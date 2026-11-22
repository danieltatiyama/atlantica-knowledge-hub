"""Synthetic-only tests for private Miner identity staging."""
import importlib.util
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import unittest
import json

SRC = Path(__file__).resolve().parents[1] / "scripts" / "build-miner-identity-index.py"
spec = importlib.util.spec_from_file_location("miner_identity_index", SRC)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def create_database(path: Path) -> None:
    with sqlite3.connect(path) as db:
        db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
        db.executemany("INSERT INTO snapshots VALUES (?)", [(1,), (2,)])
        db.execute(
            "CREATE TABLE catalog_items (record_id INTEGER PRIMARY KEY, snapshot_id INTEGER, "
            "item_id INTEGER, category TEXT, region TEXT, source TEXT, "
            "translation_state TEXT, name TEXT, original_name TEXT, "
            "grade TEXT, level TEXT, unit INTEGER, work INTEGER, "
            "material TEXT, recipe_state TEXT, recipe TEXT)"
        )

        def row(rec_id, item_id, *, category="Weapon", region="base", name="SECRET_SWORD",
                original="SECRET_KOREAN", grade="NORMAL", level="100", unit=None,
                work=0, material="NULL", recipe_state="none", recipe=None, snap=1):
            return (rec_id, snap, item_id, category, region, "D:\\USER\\private\\file.ndt",
                    "official", name, original, grade, level, unit, work,
                    material, recipe_state, recipe)

        db.executemany("INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
            row(1, 192),
            row(2, 192, region="ENG", name="SECRET_KOREAN"),
            row(3, 3890, category="Accessories", name="SECRET_RING", original="RING_KOREAN"),
            row(4, 3890, category="Decoration", name="SECRET_DECOR", original="DECOR_KOREAN"),
            row(5, 576, category="Defence"),
            row(6, 576, category="Armor", unit=1),
            row(7, 1400),
            row(8, 1400),
            row(9, 23208, category="Book"),
            row(10, 23208, category="Book", work=5200000, material="SECRET_MATERIAL",
                recipe_state="valid", recipe="[[1,2]]"),
            row(11, 29650, category="House_Curtain", name="SECRET_RED", original="RED_CURTAIN"),
            row(12, 29650, category="House_Curtain", name="SECRET_BLUE", original="BLUE_CURTAIN"),
            row(13, 13, category="Stone"),
            row(14, 120, category="Book", snap=2),
        ])


class MinerIdentityTests(unittest.TestCase):
    def test_source_aware_review_flags_and_all_rows_covered(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "test.sqlite3"
            create_database(path)
            staging, report = module.index_items(path, 1, "0.7", "2026-11-22T19:17:05Z")
            states = {rec["id"]: rec["fields"]["identityReviewState"] for rec in staging["records"]}
            self.assertEqual(states, {
                "13": "singleton",
                "192": "localization-overlap-candidate",
                "576": "cross-category-overlap-candidate",
                "1400": "exact-repeat-candidate",
                "3890": "cross-category-name-conflict",
                "23208": "attribute-conflict",
                "29650": "same-partition-name-conflict",
            })
            self.assertEqual(report["sourceRows"], 13)
            self.assertEqual(report["sourceRowsRepresented"], 13)
            self.assertEqual(report["distinctValidIdsIndexed"], 7)
            self.assertEqual(sum(report["identityReviewStates"].values()), 7)
            self.assertEqual(len(staging["records"]), 7)
            self.assertTrue(all(rec["evidence"]["status"] == "Unverified" for rec in staging["records"]))
            self.assertTrue(all(rec["names"] == {} for rec in staging["records"]))
            self.assertEqual(
                len(next(rec for rec in staging["records"] if rec["id"] == "3890")["fields"]["minerSourceRecords"]),
                2,
            )
            json_out = json.dumps(staging) + json.dumps(report)
            for secret in ("SECRET_SWORD", "SECRET_KOREAN", "RING_KOREAN", "SECRET_RING",
                           "SECRET_DECOR", "RED_CURTAIN", "BLUE_CURTAIN",
                           "SECRET_MATERIAL", "D:\\USER\\private", str(path.resolve())):
                self.assertNotIn(secret, json_out)
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM catalog_items").fetchone()[0], 14)

    def test_existing_wiki_validator_accepts_staging_but_blocks_publication(self):
        if shutil.which("node") is None:
            self.skipTest("node not installed")
        validator = Path(__file__).resolve().parents[1] / "scripts" / "validate-game-dataset.mjs"
        if not validator.is_file():
            self.skipTest("requires Wiki repository checkout")
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "test.sqlite3"
            output = Path(folder) / "index.json"
            create_database(path)
            staging, _ = module.index_items(path, 1, "0.7")
            output.write_text(json.dumps(staging), encoding="utf-8")
            normal = subprocess.run(
                ["node", str(validator), str(output)], capture_output=True, text=True
            )
            public = subprocess.run(
                ["node", str(validator), str(output), "--public"], capture_output=True, text=True
            )
            self.assertEqual(normal.returncode, 0, normal.stderr)
            self.assertNotEqual(public.returncode, 0)
            self.assertIn("Unverified is not eligible", public.stderr)

    def test_bad_snapshot_and_missing_schema_fail_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "test.sqlite3"
            create_database(path)
            with self.assertRaisesRegex(ValueError, "snapshot ID must be positive"):
                module.index_items(path, 0, "0.7")
            with self.assertRaisesRegex(ValueError, "snapshot does not exist"):
                module.index_items(path, 3, "0.7")
            with self.assertRaisesRegex(ValueError, "miner version"):
                module.index_items(path, 1, " ")

    def test_duplicate_classifier_only_recommends_review(self):
        def r(category, original, *, region="base", name="same", grade="NORMAL"):
            return {
                "category": category, "original_name": original, "region": region,
                "name": name, "grade": grade, "level": "10", "unit": None,
                "work": 0, "material": "NULL", "recipe_state": "none", "recipe": None,
            }
        self.assertEqual(module.classify_records([
            r("Weapon", "KR"), r("Sword", "KR")
        ])[0], "cross-category-overlap-candidate")
        self.assertEqual(module.classify_records([
            r("Weapon", "KR"), r("Decoration", "OTHER")
        ])[0], "cross-category-name-conflict")
        self.assertEqual(module.classify_records([
            r("Weapon", "KR"), r("Weapon", "KR", region="ENG", name="KOREAN")
        ])[0], "localization-overlap-candidate")
        self.assertEqual(module.classify_records([
            r("Weapon", "KR"), r("Weapon", "KR", grade="RARE")
        ])[0], "attribute-conflict")


if __name__ == "__main__":
    unittest.main()
