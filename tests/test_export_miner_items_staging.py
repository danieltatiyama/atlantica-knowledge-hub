"""Synthetic, isolated regression tests for Stage 20.1."""
import importlib.util
from pathlib import Path
import sqlite3
import tempfile
import unittest

SRC = Path(__file__).resolve().parents[1] / "scripts" / "export-miner-items-staging.py"
spec = importlib.util.spec_from_file_location("miner_export", SRC)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ExportTests(unittest.TestCase):
    def test_duplicate_ids_withheld_and_publishing_blocked(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "demo.db"
            with sqlite3.connect(path) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY, label TEXT)")
                db.execute("INSERT INTO snapshots VALUES (1,'secret-label')")
                db.execute("CREATE TABLE catalog_items(record_id INTEGER PRIMARY KEY, snapshot_id INTEGER, "
                           "item_id INTEGER, name TEXT, original_name TEXT, source TEXT, "
                           "category TEXT, region TEXT, translation_state TEXT)")
                db.executemany("INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?)", [
                    (1,1,47,"Judgment Sword","PRIVATE_OLD_NAME","C:\\private\\file", "Weapon", "global", "official"),
                    (2,1,48,"Other","other","client.ndt", "Weapon", "global", "unknown"),
                    (3,1,48,"Conflicting","other","client2.ndt", "Weapon", "global", "unknown"),
                    (4,1,None,"No ID","NA","NA", "Weapon", "global", "unknown"),
                    (5,1,-5,"Invalid ID","NA","NA", "Weapon", "global", "unknown"),
                    (6,2,99,"Other snapshot","NA","NA", "Weapon", "global", "unknown"),
                ])
            staging, report = module.export_snapshot(path, 1, "0.7", "2026-11-22T18:00:00Z")
            self.assertEqual([x["id"] for x in staging["records"]], ["47"])
            self.assertEqual(staging["records"][0]["names"], {})
            self.assertEqual(staging["records"][0]["evidence"]["status"], "Unverified")
            self.assertEqual(report["distinctDuplicateIdsWithheld"], 1)
            self.assertEqual(report["collisionRowsWithheld"], 2)
            self.assertEqual(report["missingOrInvalidItemIdRows"], 2)
            self.assertEqual(report["rowsSeen"], 5)
            joined = str(staging) + str(report)
            for secret in ["Judgment Sword", "PRIVATE_OLD_NAME", "C:\\private", "secret-label"]:
                self.assertNotIn(secret, joined)

    def test_missing_snapshot_and_wrong_schema_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "empty.db"
            with sqlite3.connect(path) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
                db.execute("INSERT INTO snapshots VALUES (1)")
                db.execute("CREATE TABLE catalog_items(item_id INTEGER)")
            with self.assertRaisesRegex(ValueError, "missing required"):
                module.export_snapshot(path, 1, "0.7")


if __name__ == "__main__":
    unittest.main()
