"""Stage 20.3 synthetic-only unit tests; never open production client data."""
import csv
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "triage-miner-item-collisions.py"
spec = importlib.util.spec_from_file_location("miner_triage", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def build_fixture(path: Path) -> None:
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
        def row(rec, item, *, snap=1, region="base", category="Weapon",
                grade="0", name="SECRET_NAME", source="C:\\TOP_SECRET\\mine.ndt"):
            return (
                rec, snap, item, category, region, source, "official", name,
                "PRIVATE_ORIGINAL_NAME", grade, "100", 1, 0,
                "SECRET_MATERIAL", "unknown", "SECRET_RECIPE"
            )
        db.executemany(
            "INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            [
                row(1, 47),
                row(2, 47, region="ENG", name="SECRET_ENGLISH", source="D:\\SECRET\\eng.ndt"),
                row(3, 50),
                row(4, 50, source="D:\\SECRET\\eng.ndt"),
                row(5, 51),
                row(6, 51, region="ENG", grade="1"),
                row(7, 52),
                row(8, 52, region="ENG", category="Book"),
                row(9, 99),
                row(10, None),
                row(11, 47, snap=2),
            ],
        )


class TriageTests(unittest.TestCase):
    def test_aggregate_and_private_queue_are_consistent(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "source.db"
            build_fixture(path)
            report, queue = module.analyze(path, 1)
            self.assertEqual(report["summary"], {
                "sourceRows": 10,
                "invalidItemIdRows": 1,
                "distinctValidIds": 5,
                "singletonIds": 1,
                "duplicateGroups": 4,
                "duplicateRows": 8,
            })
            self.assertEqual(len(queue), 4)
            self.assertEqual(report["collisionClassByRegionPattern"]["same-fields-base-and-ENG"]["base-and-ENG"], 1)
            self.assertEqual(report["collisionClassByRegionPattern"]["same-fields-other"]["base-only"], 1)
            self.assertEqual(report["collisionClassByRegionPattern"]["different-item-fields"]["base-and-ENG"], 1)
            self.assertEqual(report["collisionClassByRegionPattern"]["different-categories"]["base-and-ENG"], 1)
            self.assertEqual(report["fieldDifferencesByClass"]["different-item-fields"]["grade"], 1)
            self.assertEqual(report["fieldDifferencesByClass"]["different-categories"]["category"], 1)
            self.assertEqual(report["labelAndSourceDifferencesByClass"]["same-fields-base-and-ENG"]["name"], 1)
            self.assertEqual(report["privateQueueByPriority"]["A-localization-review"], 1)
            self.assertEqual(report["privateQueueByPriority"]["D-identity-conflict"], 1)
            entry = next(x for x in queue if x["item_id"] == 51)
            self.assertEqual(entry["different_fields"], "grade")
            self.assertEqual(entry["record_ids"], "5;6")

            # Aggregate JSON is safe to share; the queue is not published.
            text = json.dumps(report) + json.dumps(queue)
            for secret in ("SECRET_NAME", "SECRET_ENGLISH", "PRIVATE_ORIGINAL_NAME",
                           "SECRET_RECIPE", "SECRET_MATERIAL",
                           "C:\\TOP_SECRET\\", "D:\\SECRET\\", str(path.resolve())):
                self.assertNotIn(secret, text)
            with sqlite3.connect(path) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM catalog_items").fetchone()[0], 11)

    def test_cli_creates_only_local_report_and_private_id_queue(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "source.db"
            report_path = Path(temp) / "review.json"
            queue_path = Path(temp) / "private.csv"
            build_fixture(path)
            code = module.main([
                str(path), "--snapshot", "1", "--output", str(report_path),
                "--private-queue", str(queue_path),
            ])
            self.assertEqual(code, 0)
            self.assertEqual(json.loads(report_path.read_text(encoding="utf-8"))["summary"]["duplicateGroups"], 4)
            with queue_path.open(newline="", encoding="utf-8-sig") as out:
                rows = list(csv.DictReader(out))
            self.assertEqual(len(rows), 4)
            self.assertEqual(set(rows[0]), set(module.PRIVATE_COLUMNS))
            self.assertEqual(rows[0]["item_id"], "47")
            # Do not allow accidental overwrite of the input file.
            self.assertEqual(module.main([
                str(path), "--snapshot", "1", "--output", str(path),
            ]), 1)

    def test_missing_snapshot_and_schema_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "broken.db"
            with sqlite3.connect(path) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
                db.execute("INSERT INTO snapshots VALUES (1)")
                db.execute("CREATE TABLE catalog_items(item_id INTEGER)")
            with self.assertRaisesRegex(ValueError, "lacks required"):
                module.analyze(path, 1)
            with self.assertRaisesRegex(ValueError, "positive"):
                module.analyze(path, 0)


if __name__ == "__main__":
    unittest.main()
