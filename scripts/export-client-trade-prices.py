#!/usr/bin/env python3
"""Stage 20.64: read-only, evidence-first extraction of client NPCTradeItem prices.

The client may ship LANG/ENG/NPCTRADEITEM/NPCTradeItem_ENG.ndt. This table
describes NPC-trade catalog prices according to public third-party research.
It is a CANDIDATE for the Market's fixed prices, not proof of equivalence.

Reads one user-owned file; never contacts a server, modifies the game, or
automatically changes the Wiki or crafting calculator. Writes candidate CSV,
aggregate report, and four independent anchor comparisons locally.

Usage:
  py scripts/export-client-trade-prices.py --game-root "D:\Games\Atlantica"
  py scripts/export-client-trade-prices.py --input "NPCTradeItem_ENG.ndt"
  py scripts/export-client-trade-prices.py --decoded "NPCTradeItem_ENG.txt"
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import csv
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import struct
import sys

VERSION_1 = 0x00010001
VERSION_3 = 0x00030001
DATA_OFFSET = 24
MAX_FILE_SIZE = 32 * 1024 * 1024
MAX_SOURCE_ROWS = 500_000
SHUFFLE = (1, 3, 2, 3, 1, 5, 4, 2, 1, 4, 2, 8, 4, 2, 6, 8, 2, 6, 4)
MASK = 0xFFFFFFFF
ID = re.compile(r"^[1-9]\d{0,12}$")
INTEGER = re.compile(r"^\d{1,15}$")
RELATIVE_SOURCE = Path("LANG") / "ENG" / "NPCTRADEITEM" / "NPCTradeItem_ENG.ndt"
ANCHORS = (
    ("7070", "Gold Thread", 3000),
    ("7081", "Colorful Thread", 10000),
    ("3000", "Rice", 100),
    ("2080", "Mana Potion [II]", 8000),
)


def decode_ndt_bytes(blob: bytes) -> str:
    """Read legacy v1 / v3 NDT encryption used by game client tables."""
    if len(blob) < DATA_OFFSET + 4 or len(blob) > MAX_FILE_SIZE:
        raise ValueError("NDT input file is empty, truncated, or exceeds size cap")
    version = struct.unpack_from("<I", blob, 4)[0]
    key = blob[12]
    source = blob[DATA_OFFSET:]
    if version == VERSION_1:
        clear = bytearray(len(source))
        for i, cipher in enumerate(source):
            value = (cipher - key) & 0xFF
            if i + 1 != len(source):
                value ^= source[i + 1]
            clear[i] = value
    elif version == VERSION_3:
        if len(source) % 4:
            raise ValueError("Unaligned version 3 NDT payload; refusing partial decrypt")
        chunks = list(struct.unpack("<" + "I" * (len(source) // 4), source))
        n = len(chunks)
        for i in range(n - 1, -1, -1):
            j = (i + SHUFFLE[i % len(SHUFFLE)]) % n
            chunks[i], chunks[j] = chunks[j], chunks[i]
        adjusted = (key - 0x57D3CEFF) & MASK
        running = 0
        carry = 0
        clear_words = []
        for word in chunks:
            clear_words.append((adjusted + word + running + carry) & MASK)
            running = (running + key) & MASK
            carry = word
        clear = struct.pack("<" + "I" * n, *clear_words)
    else:
        raise ValueError(f"Unsupported NDT file version: {version:#010x}")
    try:
        text = bytes(clear).decode("utf-16le")
    except UnicodeError as error:
        raise ValueError("Decrypted table is not UTF-16LE") from error
    text = text.removeprefix("\ufeff").rstrip("\x00")
    if "<Data>" not in text or "<End>" not in text:
        raise ValueError("No expected NPCTradeItem <Data>/<End> markers after decryption")
    return text


def decode_plain_file(blob: bytes) -> str:
    """Accept explicitly supplied already-decoded text, without guessing encoding."""
    if blob.startswith((b"\xff\xfe", b"\xfe\xff")):
        text = blob.decode("utf-16")
    else:
        try:
            text = blob.decode("utf-8-sig")
        except UnicodeError as error:
            raise ValueError("Decoded input must be UTF-8 or UTF-16 with BOM") from error
    if "<Data>" not in text or "<End>" not in text:
        raise ValueError("Decoded input is not an NPCTradeItem table")
    return text


def parse_trade_table(content: str) -> tuple[list[dict], dict]:
    """Parse only source fields Unique, Param, [Korean Name], Price.

    Supports tabs and multiple spaces for the known four-field table format.
    Never uses the source Korean name to infer identity. ItemID is authoritative.
    Unknown flags, invalid prices and duplicate ID/catalog conflicts are isolated.
    """
    in_data = False
    raw_count = 0
    entries: dict[tuple[str, str], dict] = {}
    invalid = 0
    unknown_flags = 0
    duplicates = 0
    conflicting = set()
    seen_data = False
    for source_row_number, raw in enumerate(content.splitlines(), 1):
        line = raw.strip()
        if line == "<Data>":
            if seen_data:
                raise ValueError("Multiple <Data> sections; source structure unclear")
            in_data = True
            seen_data = True
            continue
        if not in_data:
            continue
        if line == "<End>":
            in_data = False
            break
        if not line or line.startswith("#"):
            continue
        cells = line.split("\t") if "\t" in line else re.split(r"\s{2,}", line)
        if cells[0].strip().lower() in {"unique", "id"}:
            continue
        raw_count += 1
        if raw_count > MAX_SOURCE_ROWS:
            raise ValueError("Source row cap exceeded")
        if len(cells) < 4:
            invalid += 1
            continue
        item_id = cells[0].strip()
        flag = cells[1].strip()
        price_raw = cells[-1].strip() if len(cells) > 4 else cells[3].strip()
        if not ID.fullmatch(item_id) or not INTEGER.fullmatch(price_raw):
            invalid += 1
            continue
        if flag not in {"0", "1"}:
            unknown_flags += 1
            continue
        catalog = "general" if flag == "0" else "housing"
        price = int(price_raw)
        key = item_id, catalog
        if key in conflicting:
            continue
        previous = entries.get(key)
        if previous is not None:
            if previous["priceGold"] != price:
                conflicting.add(key)
                del entries[key]
            else:
                duplicates += 1
            continue
        entries[key] = {
            "itemId": item_id, "catalog": catalog,
            "priceGold": price, "sourceRowNumber": source_row_number,
        }
    if not seen_data or in_data:
        raise ValueError("Incomplete NPCTradeItem source <Data>/<End> section")
    if not entries:
        raise ValueError("No compatible NPCTradeItem price records")
    result = sorted(entries.values(), key=lambda x: (int(x["itemId"]), x["catalog"]))
    stats = {
        "parsedSourceRows": raw_count, "retainedRows": len(result),
        "invalidRows": invalid, "unsupportedParamRows": unknown_flags,
        "duplicateSameValueRows": duplicates,
        "conflictingItemCatalogPairsHeld": len(conflicting),
        "zeroPriceRows": sum(x["priceGold"] == 0 for x in result),
    }
    return result, stats


def load_catalog(base: Path) -> dict[str, tuple[str, str, str]]:
    """Read only the six audited, public client index shards, not private miner DB."""
    manifest = json.loads((base / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("dataset") != "all-client-items" or manifest.get("snapshotId") != 1:
        raise ValueError("Unexpected public item catalog snapshot")
    known = {}
    count = 0
    for shard in manifest["indexShards"]:
        if not re.fullmatch(r"index-\d{2}\.json", shard):
            raise ValueError("Invalid public catalog shard name")
        payload = json.loads((base / shard).read_text(encoding="utf-8"))
        for row in payload["rows"]:
            item_id, name, category, _, _, _, status = row[:7]
            if not ID.fullmatch(item_id) or item_id in known:
                raise ValueError("Duplicate or malformed public item ID")
            known[item_id] = (
                name if isinstance(name, str) and status == "named" else "",
                category if isinstance(category, str) else "",
                status,
            )
            count += 1
    if count != manifest.get("totalIds") or count != 23586:
        raise ValueError("Public catalog total mismatch")
    return known


def verify_anchors(rows: list[dict]) -> list[dict]:
    grouped = defaultdict(list)
    for row in rows:
        grouped[row["itemId"]].append(row)
    checks = []
    for item_id, name, expected in ANCHORS:
        observed = grouped.get(item_id, [])
        general = [row["priceGold"] for row in observed if row["catalog"] == "general"]
        unique = list(dict.fromkeys(general))
        status = "match" if unique == [expected] else (
            "absent" if not unique else "mismatch")
        checks.append({
            "itemId": item_id, "clientNameEn": name,
            "expectedGold": expected, "observedGeneralPriceGold":
            unique[0] if len(unique) == 1 else None,
            "comparison": status,
            "expectedSource": "player-example-2026-11-23",
        })
    return checks


def build_candidate(
    source: list[dict], public_items: dict[str, tuple[str, str, str]],
    parsed_stats: dict,
) -> tuple[list[dict], dict]:
    candidate = []
    for row in source:
        name, category, status = public_items.get(row["itemId"], ("", "", "unknown-id"))
        candidate.append({
            **row, "clientNameEn": name,
            "clientCategory": category, "clientIdentityStatus": status,
            "marketFixedPriceVerified": False,
            "provenance": "local-client-npc-trade-table",
        })
    checks = verify_anchors(source)
    matches = sum(x["comparison"] == "match" for x in checks)
    report = {
        "schemaVersion": "1.0",
        "researchStage": "20.64",
        "dataset": "client-npc-trade-catalog-candidate",
        "sourceRelativePath": RELATIVE_SOURCE.as_posix(),
        "extractedAtUtc": datetime.now(timezone.utc).isoformat(),
        "sourceVersion": "not-established",
        "catalogSnapshotId": 1,
        "candidateCount": len(candidate),
        "generalCatalogCount": sum(x["catalog"] == "general" for x in candidate),
        "housingCatalogCount": sum(x["catalog"] == "housing" for x in candidate),
        "mappedNamedItemIds": len({
            row["itemId"] for row in candidate if row["clientIdentityStatus"] == "named"
        }),
        "sourceParse": parsed_stats,
        "knownPriceComparison": checks,
        "knownPriceMatchCount": matches,
        "conclusion": (
            "Source table agrees with all four independent examples; "
            "its equivalence to current Global Market fixed prices remains unproven."
            if matches == len(ANCHORS) else
            "Source table does not match all four known fixed Market price examples. "
            "Do not publish or substitute these NPC catalog prices into Market fixed prices."
        ),
        "privacy": (
            "No absolute game paths, unrelated client tables, Korean item names, "
            "accounts, item inventories, personal data, or raw NDT bytes exported."
        ),
    }
    return candidate, report


def write_results(rows: list[dict], report: dict, output: Path, overwrite: bool) -> None:
    output.mkdir(parents=True, exist_ok=True)
    targets = (output / "npc-trade-price-candidate.csv",
               output / "npc-trade-price-audit.json")
    if any(path.exists() for path in targets) and not overwrite:
        raise FileExistsError("Output files already exist; choose another folder or --overwrite")
    headers = [
        "item_id", "client_name_en", "client_category", "catalog",
        "npc_trade_price_gold", "client_identity_status",
        "market_fixed_price_verified", "source_row_number", "provenance",
    ]
    with targets[0].open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(headers)
        for row in rows:
            writer.writerow([
                row["itemId"], row["clientNameEn"], row["clientCategory"],
                row["catalog"], row["priceGold"], row["clientIdentityStatus"],
                "false", row["sourceRowNumber"], row["provenance"],
            ])
    targets[1].write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def case_insensitive_child(parent: Path, name: str) -> Path:
    if not parent.is_dir():
        raise FileNotFoundError("Expected game folder component is missing")
    matches = [p for p in parent.iterdir() if p.name.casefold() == name.casefold()]
    if len(matches) != 1:
        raise FileNotFoundError("Could not uniquely find a required game folder/file")
    return matches[0]


def game_source_path(root: Path) -> Path:
    result = root.expanduser()
    for segment in RELATIVE_SOURCE.parts:
        result = case_insensitive_child(result, segment)
    if not result.is_file():
        raise FileNotFoundError("Found NPC trade candidate but it is not a file")
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sources = parser.add_mutually_exclusive_group(required=True)
    sources.add_argument("--game-root", type=Path,
                         help="Installed Atlantica Global directory")
    sources.add_argument("--input", type=Path,
                         help="Encrypted NPCTradeItem_ENG.ndt")
    sources.add_argument("--decoded", type=Path,
                         help="Already decoded NPCTradeItem table (UTF-8/UTF-16)")
    parser.add_argument("--catalog", type=Path, default=Path("public/data/client-items"))
    parser.add_argument("--output", type=Path, default=Path("client-fixed-price-investigation"))
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args(argv)
    try:
        source = game_source_path(args.game_root) if args.game_root else (
            args.decoded if args.decoded else args.input
        )
        if not source.is_file() or source.stat().st_size > MAX_FILE_SIZE:
            raise ValueError("The source input is missing or exceeds the 32 MiB safety cap")
        output = args.output.expanduser().resolve()
        if source.resolve() == output or source.resolve().is_relative_to(output):
            raise ValueError("The output directory must not overwrite the input source")
        data = source.read_bytes()
        text = decode_plain_file(data) if args.decoded else decode_ndt_bytes(data)
        prices, stats = parse_trade_table(text)
        catalog = load_catalog(args.catalog)
        candidate, report = build_candidate(prices, catalog, stats)
        write_results(candidate, report, output, args.overwrite)
        print("[IC] Client trade price candidate rows:", len(candidate))
        print("[IC] Catalog general:", report["generalCatalogCount"])
        print("[IC] Catalog housing:", report["housingCatalogCount"])
        print("[IC] Matched named client ItemIDs:", report["mappedNamedItemIds"])
        for anchor in report["knownPriceComparison"]:
            print("[IC] Example", anchor["clientNameEn"]+":", anchor["comparison"])
        print("[IC] Report:", (output / "npc-trade-price-audit.json").name)
        print("[IC] Prices remain RESEARCH ONLY; no live Market validation or UI updates.")
        return 0
    except (OSError, ValueError, KeyError, TypeError, struct.error) as error:
        print("[IC] Extraction blocked:", type(error).__name__, str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
