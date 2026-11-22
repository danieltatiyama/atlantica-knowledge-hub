"""Synthetic-only source attestation tests; never access user's game client."""
import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load(filename: str, name: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


verifier = load("scripts/verify-approved-equipment-against-sqlite.py", "miner_source_attestation")
synthetic = load("tests/test_reconcile_miner_equipment.py", "synthetic_equipment_fixture")


class SourceAttestationTests(unittest.TestCase):
    def test_original_manually_selected_fields_match_private_source(self):
        with tempfile.TemporaryDirectory() as folder:
            database, registry = synthetic.prepare_files(Path(folder))
            _review, _report, candidates = verifier.STAGE.reconcile(database, registry, 1)
            payload = verifier.STAGE.approved_dataset(
                synthetic.approval(), candidates, 1, "unknown", "2026-11-22T19:45:00Z"
            )
            self.assertEqual(verifier.verify_against_source(database, registry, 1, payload), 1)

            for modification in ("name", "category", "level", "grade", "row", "status", "extra"):
                tampered = copy.deepcopy(payload)
                item = tampered["records"][0]
                if modification == "name":
                    item["names"]["en"] = "Falsified sword"
                elif modification == "category":
                    item["fields"]["clientCategory"] = "Book"
                elif modification == "level":
                    item["fields"]["clientLevelRaw"] = "9999"
                elif modification == "grade":
                    item["fields"]["clientGradeRaw"] = "LEGEND"
                elif modification == "row":
                    item["evidence"]["sources"][1] = "catalog_items:snapshot=1:record=1234567"
                elif modification == "status":
                    item["evidence"]["status"] = "Verified"
                elif modification == "extra":
                    item["fields"]["recipe"] = "SECRET_GAME_RECIPE"
                with self.subTest(change=modification), self.assertRaises(ValueError):
                    verifier.verify_against_source(database, registry, 1, tampered)

    def test_conflicting_item_and_wrong_snapshot_remain_blocked(self):
        with tempfile.TemporaryDirectory() as folder:
            database, registry = synthetic.prepare_files(Path(folder))
            _review, _report, candidates = verifier.STAGE.reconcile(database, registry, 1)
            payload = verifier.STAGE.approved_dataset(
                synthetic.approval(), candidates, 1, "unknown", "2026-11-22T19:45:00Z"
            )
            wrong_snapshot = copy.deepcopy(payload)
            wrong_snapshot["snapshot"]["id"] = "miner-snapshot-2-equipment-approved"
            with self.assertRaises(ValueError):
                verifier.verify_against_source(database, registry, 1, wrong_snapshot)
            bad_conflict = copy.deepcopy(payload)
            bad_conflict["records"][0]["id"] = "3890"
            with self.assertRaises(ValueError):
                verifier.verify_against_source(database, registry, 1, bad_conflict)


if __name__ == "__main__":
    unittest.main()
