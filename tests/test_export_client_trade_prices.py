import importlib.util
from pathlib import Path
import csv
import json
import struct
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "export-client-trade-prices.py"
spec = importlib.util.spec_from_file_location("client_trade_prices", SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

CLIENT_TABLE = (
    "Market NPC trade price fixture\r\n"
    "<Data>\r\n"
    "Unique\tParam\tName\tPrice\r\n"
    "7070\t0\t금실\t3000\r\n"
    "7081\t0\t빛깔실\t10000\r\n"
    "3000\t0\t쌀\t100\r\n"
    "2080\t0\t마나 물약 [II]\t8000\r\n"
    "7044\t0\t빛깔 천\t50000\r\n"
    "99999\t1\tFurniture\t78900\r\n"
    "<End>\r\n"
)


def fixture_blob(content: str, version: int, key: int = 37):
    plain = ("\ufeff" + content).encode("utf-16le")
    head = bytearray(24)
    struct.pack_into("<I", head, 4, version)
    head[12] = key
    if version == mod.VERSION_1:
        cipher = bytearray(len(plain))
        for i in range(len(plain) - 1, -1, -1):
            follow = cipher[i+1] if i + 1 < len(cipher) else 0
            cipher[i] = ((plain[i] ^ follow) + key) & 255
    else:
        if len(plain) % 4:
            plain += b"\x00\x00"
        source = struct.unpack("<"+"I"*(len(plain)//4), plain)
        adjusted = (key - 0x57D3CEFF) & 0xFFFFFFFF
        running = carry = 0
        words = []
        for value in source:
            word = (value - adjusted - running - carry) & 0xFFFFFFFF
            words.append(word)
            running = (running + key) & 0xFFFFFFFF
            carry = word
        for i in range(len(words)):
            j = (i + mod.SHUFFLE[i % len(mod.SHUFFLE)]) % len(words)
            words[i], words[j] = words[j], words[i]
        cipher = struct.pack("<"+"I"*len(words), *words)
    return bytes(head) + bytes(cipher)


class ClientTradePricesTest(unittest.TestCase):
    def test_v1_and_v3_decode_independently_generated_fixtures(self):
        for version in (mod.VERSION_1, mod.VERSION_3):
            with self.subTest(version=version):
                blob = fixture_blob(CLIENT_TABLE, version)
                clear = mod.decode_ndt_bytes(blob)
                self.assertEqual(clear, CLIENT_TABLE)
                prices, stats = mod.parse_trade_table(clear)
                self.assertEqual(len(prices), 6)
                self.assertEqual(stats["invalidRows"], 0)

    def test_unsupported_file_does_not_guess_data(self):
        with self.assertRaisesRegex(ValueError, "Unsupported NDT"):
            mod.decode_ndt_bytes(fixture_blob(CLIENT_TABLE, mod.VERSION_1)[:4]+
                                 b"\xff\xff\xff\xff"+
                                 fixture_blob(CLIENT_TABLE, mod.VERSION_1)[8:])
        with self.assertRaisesRegex(ValueError, "not an NPCTradeItem table"):
            mod.decode_plain_file("not a price file".encode("utf-8"))

    def test_source_duplicate_and_conflicting_price_quarantines_item_catalog_pair(self):
        content = CLIENT_TABLE.replace(
            "<End>", "7070\t0\t금실\t3000\r\n"
                     "7044\t0\t빛깔 천\t49999\r\n"
                     "8\t2\tunknown\t200\r\n"
                     "5\t0\tbad\tNOT_A_PRICE\r\n"
                     "<End>"
        )
        prices, stats = mod.parse_trade_table(content)
        self.assertEqual(len(prices), 5)
        self.assertFalse(any(row["itemId"]=="7044" for row in prices))
        self.assertEqual(stats["conflictingItemCatalogPairsHeld"], 1)
        self.assertEqual(stats["duplicateSameValueRows"], 1)
        self.assertEqual(stats["unsupportedParamRows"], 1)
        self.assertEqual(stats["invalidRows"], 1)

    def test_source_id_and_catalog_fields_are_authoritative(self):
        rows, stats = mod.parse_trade_table(CLIENT_TABLE)
        general = next(x for x in rows if x["itemId"] == "7070")
        self.assertEqual(general["catalog"], "general")
        self.assertEqual(general["priceGold"], 3000)
        housing = next(x for x in rows if x["itemId"] == "99999")
        self.assertEqual(housing["catalog"], "housing")
        self.assertEqual(stats["zeroPriceRows"], 0)

    def test_four_known_current_player_examples_match_only_general_catalog(self):
        rows, _ = mod.parse_trade_table(CLIENT_TABLE)
        checks = mod.verify_anchors(rows)
        self.assertEqual([x["comparison"] for x in checks], ["match"]*4)
        without_rice = [x for x in rows if x["itemId"] != "3000"]
        checks = mod.verify_anchors(without_rice)
        self.assertEqual([x["comparison"] for x in checks],
                         ["match", "match", "absent", "match"])
        rice = next(x for x in rows if x["itemId"]=="3000")
        rice["priceGold"] = 101
        self.assertEqual(mod.verify_anchors(rows)[2]["comparison"],"mismatch")

    def test_public_itemids_validate_npc_trade_data_without_guessing_names(self):
        base=Path(__file__).resolve().parents[1] / "public" / "data" / "client-items"
        catalog = mod.load_catalog(base)
        self.assertEqual(len(catalog), 23586)
        rows, stats = mod.parse_trade_table(CLIENT_TABLE)
        out, report = mod.build_candidate(rows, catalog, stats)
        self.assertEqual(report["candidateCount"], 6)
        self.assertEqual(report["knownPriceMatchCount"], 4)
        self.assertEqual(report["generalCatalogCount"], 5)
        self.assertEqual(report["housingCatalogCount"], 1)
        self.assertEqual(report["mappedNamedItemIds"], 5)
        missing = next(x for x in out if x["itemId"]=="99999")
        self.assertEqual(missing["clientNameEn"],"")
        self.assertEqual(missing["clientIdentityStatus"],"unknown-id")
        self.assertTrue(all(x["marketFixedPriceVerified"] is False for x in out))
        self.assertNotIn("금실", json.dumps(report,ensure_ascii=False))

    def test_local_file_output_is_sanitized_and_never_claims_live_market_prices(self):
        source,stats=mod.parse_trade_table(CLIENT_TABLE)
        base=Path(__file__).resolve().parents[1] / "public" / "data" / "client-items"
        rows,report=mod.build_candidate(source,mod.load_catalog(base),stats)
        with tempfile.TemporaryDirectory() as dir:
            dst=Path(dir)
            mod.write_results(rows, report, dst, False)
            parsed=list(csv.DictReader((dst/"npc-trade-price-candidate.csv").open(
                encoding="utf-8-sig",newline=""
            )))
            self.assertEqual(len(parsed),6)
            self.assertTrue(all(x["market_fixed_price_verified"]=="false" for x in parsed))
            audit=json.loads((dst/"npc-trade-price-audit.json").read_text(encoding="utf-8"))
            self.assertEqual(audit["knownPriceMatchCount"],4)
            self.assertNotIn("localSourceAbsolutePath",audit)
            with self.assertRaises(FileExistsError):
                mod.write_results(rows,report,dst,False)
            mod.write_results(rows,report,dst,True)

    def test_historical_comparison_preserves_provenance_and_reports_missing_prices(self):
        rows, _ = mod.parse_trade_table(CLIENT_TABLE)
        source = Path(__file__).resolve().parents[1] / "research" / "market-fixed-prices" / "jana4u-2025-11-14-crosswalk.csv"
        report = mod.compare_historical_catalog(rows, source)
        self.assertEqual(report["status"], "historical-reference-only")
        self.assertEqual(report["historicalMappedItemIds"], 293)
        self.assertGreaterEqual(report["generalCatalogMatches"], 3)
        self.assertGreaterEqual(report["generalCatalogAbsent"], 200)
        self.assertEqual(report["generalCatalogMismatches"], 0)

    def test_case_insensitive_path_lookup_only_checks_expected_subdirectories(self):
        with tempfile.TemporaryDirectory() as dir:
            root=Path(dir)
            folder=root/"lang"/"eng"/"npctradeitem"
            folder.mkdir(parents=True)
            target=folder/"npctradeitem_eng.ndt"
            target.write_bytes(fixture_blob(CLIENT_TABLE,mod.VERSION_1))
            self.assertEqual(mod.game_source_path(root),target)


if __name__=="__main__":
    unittest.main()
