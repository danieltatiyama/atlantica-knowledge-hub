"""Synthetic-only tests for Stage 20.5 curated equipment reconciliation."""
import importlib.util
import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / "reconcile-miner-equipment.py"
spec = importlib.util.spec_from_file_location("miner_equipment", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def prepare_files(folder: Path) -> tuple[Path, Path]:
    database = folder / "synthetic.sqlite3"
    registry = folder / "synthetic-equipment-item-names-en.ts"
    public_names = {
        192: "Twilight Instrument",
        576: "Brody's Enhanced Robe",
        3890: "Sweet Chocolate Ring (No Trade)",
        23208: "Book: Watchful Soul [III]",
        650: "Red Soul Robe",
        2200: "Small Bolt",
        999: "Absent from Miner",
    }
    tsv = "\n".join(f"{item_id}|{name}" for item_id, name in public_names.items())
    registry.write_text(
        "const ITEM_NAMES_TSV = " + json.dumps(tsv, ensure_ascii=False) +
        ";\nexport const EQUIPMENT_ITEM_NAMES_EN = {};\n",
        encoding="utf-8",
    )

    with sqlite3.connect(database) as db:
        db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
        db.executemany("INSERT INTO snapshots VALUES (?)", [(1,), (2,)])
        db.execute(
            "CREATE TABLE catalog_items(record_id INTEGER PRIMARY KEY, snapshot_id INTEGER, "
            "item_id INTEGER, region TEXT, category TEXT, name TEXT, original_name TEXT, "
            "source TEXT, grade TEXT, level TEXT, work INTEGER, material TEXT, "
            "recipe_state TEXT, recipe TEXT)"
        )
        def row(rec_id, item_id, name, *, region="base", category="Weapon",
                original="KOREAN_SECRET", source="ItemTypeWeapon.ndt",
                grade="NORMAL", level="100", work=0, material="SECRET_RECIPE",
                recipe_state="none", recipe=None, snapshot=1):
            return (rec_id, snapshot, item_id, region, category, name, original,
                    "D:\\PRIVATE\\CLIENT\\" + source, grade, level, work,
                    material, recipe_state, recipe)

        db.executemany("INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
            row(1001, 192, "Twilight Instrument", level="165"),
            row(1002, 192, "황혼의 악기", region="ENG", source="ItemTypeWeapon_ENG.vna", level="165"),
            row(1011, 576, "Brody's Enhanced Robe", category="Defence"),
            row(1012, 576, "Brody's Enhanced Robe", category="Armor", source="ItemTypeArmor.ndt"),
            row(1021, 3890, "Sweet Chocolate Ring (No Trade)", category="Accessories",
                original="RING_SECRET", source="ItemTypeAccessories.ndt"),
            row(1022, 3890, "Jeon Woo-chi Back Decoration (Not Used)",
                category="Decoration", original="DECOR_SECRET", source="ItemTypeDecoration.ndt"),
            row(1031, 23208, "Book: Watchful Soul [III]", category="Book",
                source="ItemTypeBook.ndt", work=30000000),
            row(1032, 23208, "Book: Watchful Soul [III]", category="Book",
                source="ItemTypeBook.ndt", work=5200000),
            row(1041, 650, "Red Soul Robe", category="Defence", recipe_state="unsupported"),
            row(1042, 650, "Red Soul Robe", category="Armor", source="ItemTypeArmor.ndt",
                recipe_state="valid", recipe="[[5100,3]]"),
            row(1051, 2200, "Small Bolt", category="Metal", source="ItemTypeMetal.ndt"),
            row(2001, 192, "Twilight Instrument", snapshot=2),
        ])
    return database, registry


def approval(item_id="192", record_id=1001, fields=None, note=None):
    return {
        "schemaVersion": "20.5-approvals",
        "snapshotId": 1,
        "approvals": [{
            "itemId": item_id,
            "recordId": record_id,
            "fields": fields or ["clientCategory", "clientLevelRaw", "clientGradeRaw"],
            "reviewNote": note or "Checked the base source row against the reviewed catalog name.",
        }],
    }


class EquipmentBridgeTests(unittest.TestCase):
    def test_reconcile_all_public_ids_without_publishing_anything(self):
        with tempfile.TemporaryDirectory() as folder:
            database, registry = prepare_files(Path(folder))
            private, report, candidates = module.reconcile(database, registry, 1)
            states = {row["itemId"]: row["reviewState"] for row in private["entries"]}
            self.assertEqual(states, {
                "192": "localization-overlap-candidate",
                "576": "cross-category-overlap-candidate",
                "650": "cross-category-overlap-candidate",
                "2200": "single-base-source",
                "3890": "base-name-conflict",
                "23208": "base-item-field-conflict",
                "999": "no-source-records",
            })
            self.assertEqual(report["publicNamesInRegistry"], 7)
            self.assertEqual(report["sourceRowsConsidered"], 11)
            self.assertEqual(report["eligibleForManualSourceReview"], 4)
            self.assertEqual(sum(report["reviewStates"].values()), 7)
            self.assertEqual(len(private["entries"]), 7)
            self.assertEqual(candidates["192"]["entry"]["candidateSourceRows"][0]["recordId"], 1001)
            self.assertTrue(candidates["192"]["entry"]["hasNonmatchingBaseNames"] is False)
            # The aggregated report must not disclose game-client names/IDs/paths.
            agg = json.dumps(report)
            for secret in ("Twilight Instrument", "SECRET", "D:\\PRIVATE", "192", "3890", "23208"):
                self.assertNotIn(secret, agg)
            # Even the private manifest must not leak raw recipes or absolute paths.
            private_text = json.dumps(private)
            for secret in ("SECRET_RECIPE", "KOREAN_SECRET", "RING_SECRET",
                           "DECOR_SECRET", "D:\\PRIVATE"):
                self.assertNotIn(secret, private_text)

    def test_explicit_approval_emits_existing_name_and_selected_client_metadata_only(self):
        with tempfile.TemporaryDirectory() as folder:
            database, registry = prepare_files(Path(folder))
            _private, _report, candidates = module.reconcile(database, registry, 1)
            dataset = module.approved_dataset(approval(), candidates, 1, "unknown", "2026-11-22T19:25:00Z")
            self.assertEqual(len(dataset["records"]), 1)
            rec = dataset["records"][0]
            self.assertEqual(rec["id"], "192")
            self.assertEqual(rec["names"], {"en": "Twilight Instrument"})
            self.assertEqual(rec["fields"], {
                "clientCategory": "Weapon",
                "clientLevelRaw": "165",
                "clientGradeRaw": "NORMAL",
            })
            self.assertEqual(rec["evidence"]["status"], "Extracted")
            self.assertEqual(rec["evidence"]["sources"][-1], "catalog_items:snapshot=1:record=1001")
            serialized = json.dumps(dataset)
            for secret in ("SECRET_RECIPE", "KOREAN_SECRET", "D:\\PRIVATE"):
                self.assertNotIn(secret, serialized)

            if shutil.which("node"):
                payload = Path(folder) / "approved.json"
                payload.write_text(json.dumps(dataset), encoding="utf-8")
                validator = ROOT / "scripts" / "validate-game-dataset.mjs"
                proc = subprocess.run(
                    ["node", str(validator), str(payload), "--public"],
                    capture_output=True, text=True,
                )
                self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_hard_identity_conflicts_and_unsafe_approvals_fail_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            database, registry = prepare_files(Path(folder))
            _private, _report, candidates = module.reconcile(database, registry, 1)
            for a in [
                approval(item_id="3890", record_id=1021),
                approval(item_id="23208", record_id=1031),
                approval(item_id="999", record_id=9999),
                approval(record_id=1002),
                approval(fields=["recipe"]),
                approval(fields=["clientCategory", "clientCategory"]),
                approval(note="short"),
            ]:
                with self.subTest(a=a):
                    with self.assertRaises(ValueError):
                        module.approved_dataset(a, candidates, 1, "unknown")
            with self.assertRaises(ValueError):
                module.approved_dataset({"schemaVersion":"20.5-approvals", "snapshotId":1, "approvals":[]},
                                        candidates, 1, "unknown")
            with self.assertRaises(ValueError):
                module.approved_dataset(approval(), candidates, 2, "unknown")

    def test_bad_registry_or_snapshot_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            database, registry = prepare_files(Path(folder))
            registry.write_text("export const EQUIPMENT_ITEM_NAMES_EN = {};", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "format changed"):
                module.reconcile(database, registry, 1)
            db, registry = prepare_files(Path(folder))
            with self.assertRaisesRegex(ValueError, "snapshot not found"):
                module.reconcile(db, registry, 3)
            with self.assertRaisesRegex(ValueError, "positive"):
                module.reconcile(db, registry, 0)


if __name__ == "__main__":
    unittest.main()
