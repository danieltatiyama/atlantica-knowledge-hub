"""Synthetic regression tests for private item-ID collision classification."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "audit-miner-item-duplicates.py"
spec = importlib.util.spec_from_file_location("miner_duplicate_audit", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DuplicateAuditTests(unittest.TestCase):
    def make_fixture(self, path: Path) -> None:
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
            def row(n, item_id, *, category="Weapon", region="base",
                    name="PRIVATE_NAME", grade="0", source="C:\\PRIVATE\\client.ndt",
                    snap=1):
                return (n, snap, item_id, category, region, source,
                        "official", name, "ORIGINAL_SECRET", grade, "100",
                        1, 0, "MATERIAL_SECRET", "unknown", "RECIPE_SECRET")
            db.executemany("INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [
                row(1,47),
                row(2,47,region="ENG",name="SECRET_TRANSLATION",source="D:\\DATA\\other.ndt"),
                row(3,49), row(4,49,source="D:\\DATA\\other.ndt"),
                row(5,50), row(6,50,grade="1"),
                row(7,51), row(8,51,category="SecondWeapon"),
                row(9,52),
                row(10,None),
                row(11,88,snap=2),
            ])

    def test_aggregated_classes_no_raw_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "source.sqlite3"
            self.make_fixture(path)
            result = module.analyze_snapshot(path, 1)
            summary = result["summary"]
            self.assertEqual(summary["sourceRows"], 10)
            self.assertEqual(summary["distinctValidIds"], 5)
            self.assertEqual(summary["singletonIds"], 1)
            self.assertEqual(summary["duplicateIdGroups"], 4)
            self.assertEqual(summary["duplicateRows"], 8)
            self.assertEqual(summary["invalidIdRows"], 1)
            self.assertEqual(summary["groupsWithMultipleSources"], 2)
            self.assertEqual(summary["groupsWithDifferentNames"], 1)
            self.assertEqual(result["collisionClasses"], {
                "same-fields-base-and-ENG":1,
                "same-fields-other":1,
                "different-item-fields":1,
                "different-categories":1,
            })
            self.assertEqual(result["duplicateRegionPatterns"]["base-and-ENG"], 1)
            self.assertEqual(result["duplicateRegionPatterns"]["base-only"], 3)
            self.assertEqual(result["duplicateGroupSizes"]["2"], 4)
            content = json.dumps(result)
            for forbidden in ("PRIVATE_NAME", "ORIGINAL_SECRET", "MATERIAL_SECRET",
                              "RECIPE_SECRET", "C:\\PRIVATE\\", "D:\\DATA\\",
                              "SECRET_TRANSLATION", str(path.resolve())):
                self.assertNotIn(forbidden, content)
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM catalog_items").fetchone()[0], 11)

    def test_invalid_snapshot_and_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "incomplete.sqlite3"
            with sqlite3.connect(path) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
                db.execute("INSERT INTO snapshots VALUES (1)")
                db.execute("CREATE TABLE catalog_items(item_id INTEGER)")
            with self.assertRaisesRegex(ValueError, "missing expected"):
                module.analyze_snapshot(path, 1)


if __name__ == "__main__":
    unittest.main()
