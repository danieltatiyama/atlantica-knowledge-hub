"""Offline synthetic tests for the SQLite schema profiler."""
import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "profile-miner-sqlite.py"
spec = importlib.util.spec_from_file_location("profile_miner_sqlite", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ProfileTests(unittest.TestCase):
    def test_metadata_only_and_read_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = Path(tmp) / "miner.sqlite3"
            with sqlite3.connect(db_path) as con:
                con.execute("CREATE TABLE items (item_id TEXT PRIMARY KEY, name TEXT, secret TEXT)")
                con.execute("INSERT INTO items VALUES (?, ?, ?)", ("47", "Test Item", "SECRET_VALUE"))
                con.execute('CREATE VIEW item_ids AS SELECT item_id FROM items')
            profile = module.profile_database(db_path)
            serialized = json.dumps(profile)
            self.assertEqual(profile["databaseFilenameOnly"], "miner.sqlite3")
            self.assertEqual(profile["tableCount"], 1)
            self.assertEqual(profile["viewCount"], 1)
            self.assertTrue(any(c["name"] == "item_id" for o in profile["objects"] for c in o["columns"]))
            self.assertNotIn("SECRET_VALUE", serialized)
            self.assertNotIn("Test Item", serialized)
            self.assertNotIn(str(Path(tmp).resolve()), serialized)
            with sqlite3.connect(db_path) as con:
                self.assertEqual(con.execute("SELECT COUNT(*) FROM items").fetchone()[0], 1)

    def test_weird_table_name_is_escaped(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "test.db"
            with sqlite3.connect(path) as con:
                con.execute('CREATE TABLE "weird\'name" ("A B" INTEGER)')
            report = module.profile_database(path)
            self.assertEqual(report["objects"][0]["columns"][0]["name"], "A B")


if __name__ == "__main__":
    unittest.main()
