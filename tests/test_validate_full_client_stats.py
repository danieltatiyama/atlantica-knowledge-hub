"""Stage 20.32 candidate gate regression tests (no private game SQLite)."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "scripts" / "validate-full-client-stats.py"
SPEC = importlib.util.spec_from_file_location("validate_full_client_stats", PATH)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class CandidateAuditTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.base = Path(temp.name)
        self.candidate = self.base / "candidate"
        self.candidate.mkdir()
        self.report = self.base / "aggregate.json"
        self.index = self.base / "original-index"
        self.index.mkdir()
        self.names = {str(i): "Source name " + str(i) for i in range(1, 22703)}
        self.index_manifest = {"snapshotId": 1, "sourceDefinitionRows": 27281}
        self.load_patch = patch.object(
            module.exporter, "load_index",
            return_value=(self.index_manifest, self.names),
        )
        self.load_patch.start()
        self.addCleanup(self.load_patch.stop)
        self.manifest = {
            "schemaVersion": "1.0",
            "dataset": "all-client-item-raw-stats",
            "snapshotId": 1, "itemIds": 2, "sourceRows": 3,
            "dataSource": "game-client-extracted:Items.csv",
            "notice": module.NOTICE,
            "files": ["00.json"],
        }
        self.data = {
            "schemaVersion": "1.0", "snapshotId": 1, "bucket": 0,
            "items": {
                "1": [[10, {"MinDamage": "60", "MagicDef": "0"}],
                      [11, {"MinDamage": "60", "EV": "85"}]],
                "2": [[12, {"MoveSpeed": "10"}]],
            },
        }
        self.aggregate = {
            "reportVersion": "20.31-aggregate", "snapshotId": 1,
            "rowsInspected": 27281, "invalidJsonRows": 0,
            "invalidItemIds": 0, "unresolvedIdentitySourceRows": 2217,
            "namedIdsWithSourceRows": 22702,
            "sourceNameCollisionIdsHeld": 103,
            "namedIdsWithNoNumericFields": 22597,
            "publishedCandidateIds": 2, "publishedCandidateSourceRows": 3,
            "numericFieldCoverage": {
                "MinDamage": 2, "MagicDef": 1, "EV": 1, "MoveSpeed": 1,
            },
            "privacy": "Aggregate only: no source names, original record values or paths",
        }
        self.save()

    def save(self):
        (self.candidate / "manifest.json").write_text(
            json.dumps(self.manifest), encoding="utf-8"
        )
        (self.candidate / "00.json").write_text(
            json.dumps(self.data), encoding="utf-8"
        )
        self.report.write_text(json.dumps(self.aggregate), encoding="utf-8")

    def validate(self):
        self.save()
        return module.validate(self.candidate, self.report, self.index)

    def test_approved_candidate_stays_read_only(self):
        result = self.validate()
        self.assertEqual(result["candidateIds"], 2)
        self.assertEqual(result["sourceRows"], 3)
        self.assertEqual(result["fieldCounts"]["MoveSpeed"], 1)
        self.assertEqual(
            sorted(path.name for path in self.candidate.iterdir()),
            ["00.json", "manifest.json"],
        )

    def test_rejects_unreconciled_id(self):
        self.data["items"]["999999"] = self.data["items"].pop("2")
        with self.assertRaisesRegex(ValueError, "quarantined ID"):
            self.validate()

    def test_rejects_duplicated_source_row(self):
        self.data["items"]["2"][0][0] = 10
        with self.assertRaisesRegex(ValueError, "Duplicate or invalid"):
            self.validate()

    def test_rejects_numeric_injection_and_private_columns(self):
        self.data["items"]["2"][0][1]["rawFilePath"] = "C:/secret"
        with self.assertRaisesRegex(ValueError, "Non-allowlisted"):
            self.validate()
        del self.data["items"]["2"][0][1]["rawFilePath"]
        self.data["items"]["2"][0][1]["MoveSpeed"] = "10%<script>"
        with self.assertRaisesRegex(ValueError, "nonnumeric"):
            self.validate()

    def test_rejects_report_mismatch(self):
        self.aggregate["numericFieldCoverage"]["MinDamage"] = 99
        with self.assertRaisesRegex(ValueError, "coverage differs"):
            self.validate()

    def test_rejects_unlisted_candidate_files(self):
        self.save()
        (self.candidate / "private.txt").write_text("private", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "additional files"):
            module.validate(self.candidate, self.report, self.index)

    def test_rejects_duplicate_json_keys(self):
        self.save()
        (self.candidate / "00.json").write_text(
            '{"schemaVersion":"1.0","snapshotId":1,"bucket":0,"items":{},"items":{}}',
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "Duplicate JSON key"):
            module.validate(self.candidate, self.report, self.index)

    def test_optional_public_absence_does_not_block_ci(self):
        result = module.main([
            "--candidate", str(self.base / "no-public-data"),
            "--allow-absent",
        ])
        self.assertEqual(result, 0)
        self.assertEqual(module.main([
            "--candidate", str(self.base / "no-public-data"),
        ]), 1)


if __name__ == "__main__":
    unittest.main()
