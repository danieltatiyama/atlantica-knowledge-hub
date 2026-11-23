"""Stage 20.33: ZIP import safety and reviewed equipment invariance."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def import_source(filename, module_name):
    spec = importlib.util.spec_from_file_location(module_name, ROOT / "scripts" / filename)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


imp = import_source("import-full-client-stats.py", "import_20_33")
reviewed = import_source("verify-full-client-reviewed-stats.py", "review_20_33")


class ImportZipTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.base = Path(tmp.name)
        self.zip = self.base / "source.zip"
        self.target = self.base / "public" / "stats"
        self.sample_manifest = {"files": ["00.json"]}
        self.sample_bucket = {"items": {"1": [[1, {"Str": "0"}]]}}

    def make_zip(self, entries=None):
        if entries is None:
            prefix = "Miner_AllStats_PublicCandidate_20_31\\"
            entries = [
                (prefix + "manifest.json", json.dumps(self.sample_manifest)),
                (prefix + "00.json", json.dumps(self.sample_bucket)),
            ]
        with zipfile.ZipFile(self.zip, "w", compression=zipfile.ZIP_DEFLATED) as z:
            for name, data in entries:
                z.writestr(name, data)

    def test_windows_archive_extract_is_exact_and_safe(self):
        self.make_zip()
        stage = self.base / "stage"
        stage.mkdir()
        imp.extract_candidate(self.zip, stage)
        self.assertEqual(sorted(p.name for p in stage.iterdir()),
                         ["00.json", "manifest.json"])

    def test_archive_rejects_traversal(self):
        self.make_zip([
            ("../manifest.json", json.dumps(self.sample_manifest)),
            ("00.json", json.dumps(self.sample_bucket)),
        ])
        stage = self.base / "stage"
        stage.mkdir()
        with self.assertRaisesRegex(ValueError, "unsafe path"):
            imp.extract_candidate(self.zip, stage)

    def test_archive_rejects_unexpected_files_and_duplicate_leaf(self):
        self.make_zip([
            ("manifest.json", json.dumps(self.sample_manifest)),
            ("00.json", json.dumps(self.sample_bucket)),
            ("Miner_AllStats_PublicCandidate_20_31\\00.json",
             json.dumps(self.sample_bucket)),
        ])
        stage = self.base / "stage"
        stage.mkdir()
        with self.assertRaisesRegex(ValueError, "duplicate output files"):
            imp.extract_candidate(self.zip, stage)

    def test_import_stages_only_after_both_audits_and_no_implicit_push(self):
        self.make_zip()
        self.target.parent.mkdir(parents=True)
        with patch.object(imp, "IMPORT_TARGET", self.target), \
             patch.object(imp.audit, "validate", return_value={
                 "candidateIds": 7560, "sourceRows": 9351
             }) as first, \
             patch.object(imp.reviewed, "verify", return_value={
                 "reviewedEquipmentIds": 551, "originalSourceRows": 1031
             }) as second:
            result = imp.import_stats(self.zip, dry_run=True)
            self.assertFalse(result["publishedInWorkingTree"])
            self.assertFalse(self.target.exists())
            self.assertTrue(first.called)
            self.assertTrue(second.called)
            result = imp.import_stats(self.zip)
            self.assertTrue(result["publishedInWorkingTree"])
            self.assertTrue((self.target / "manifest.json").exists())
            with self.assertRaisesRegex(ValueError, "already exists"):
                imp.import_stats(self.zip)

    def test_failing_audit_leaves_no_published_data(self):
        self.make_zip()
        self.target.parent.mkdir(parents=True)
        with patch.object(imp, "IMPORT_TARGET", self.target), \
             patch.object(imp.audit, "validate", side_effect=ValueError("blocked")):
            with self.assertRaisesRegex(ValueError, "blocked"):
                imp.import_stats(self.zip)
        self.assertFalse(self.target.exists())


class ReviewedSourceTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.base = Path(tmp.name)
        self.candidate = self.base / "candidate"
        self.candidate.mkdir()
        self.baseline = self.base / "baseline.json"
        records, candidate_items = [], {}
        number = 1
        for idnum in range(1, 552):
            rows = []
            current = []
            for _ in range(2 if idnum <= 480 else 1):
                raw = {"Str": str(idnum)}
                rows.append({"sourceRowNumber": number, "fieldsRaw": raw})
                current.append([number, {"Str": str(idnum), "MoveSpeed": "0"}])
                number += 1
            records.append({"id": str(idnum), "sourceRows": rows})
            candidate_items[str(idnum)] = current
        self.baseline.write_text(json.dumps({
            "schemaVersion": "1.0", "dataset": "client-item-attributes",
            "snapshotId": 1, "records": records
        }), encoding="utf-8")
        (self.candidate / "manifest.json").write_text(json.dumps({
            "snapshotId": 1, "dataset": "all-client-item-raw-stats",
            "files": ["00.json"]
        }), encoding="utf-8")
        self.bucket = {"schemaVersion": "1.0", "snapshotId": 1,
                       "bucket": 0, "items": candidate_items}
        self.save()
        self.assertEqual(number - 1, 1031)

    def save(self):
        (self.candidate / "00.json").write_text(json.dumps(self.bucket),
                                                encoding="utf-8")

    def test_every_old_row_is_preserved_and_movespeed_is_separate(self):
        result = reviewed.verify(self.candidate, self.baseline)
        self.assertEqual(result["reviewedEquipmentIds"], 551)
        self.assertEqual(result["originalSourceRows"], 1031)

    def test_any_changed_existing_combat_field_is_rejected(self):
        self.bucket["items"]["500"][0][1]["Str"] = "999"
        self.save()
        with self.assertRaisesRegex(ValueError, "raw source fields differ"):
            reviewed.verify(self.candidate, self.baseline)

    def test_missing_old_row_is_rejected(self):
        self.bucket["items"]["1"].pop()
        self.save()
        with self.assertRaisesRegex(ValueError, "row count differs"):
            reviewed.verify(self.candidate, self.baseline)


if __name__ == "__main__":
    unittest.main()
