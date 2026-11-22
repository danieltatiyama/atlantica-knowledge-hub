"""Read-only private reference_rows schema profiling regression suite."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location(
    "reference_fields_stage20_24",ROOT/"scripts"/"profile-miner-reference-fields.py")
module=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class ReferenceFieldTests(unittest.TestCase):
    def test_discovers_key_types_without_exposing_source_values(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/"ref.sqlite3"
            with sqlite3.connect(source) as db:
                db.execute("CREATE TABLE reference_rows(dataset TEXT, row_num INTEGER, data TEXT)")
                db.executemany("INSERT INTO reference_rows VALUES (?,?,?)",[
                    ("Items.csv",1,json.dumps({
                        "Unique":1,"Name":"PRIVATE_NAME",
                        "AttackMin":500,"AttackMax":700,
                        "Weight":None,"Options":{"secret":"PRIVATE_BYTES"}
                    })),
                    ("Items.csv",2,json.dumps({
                        "Unique":2,"Name":"PRIVATE_NAME_B",
                        "AttackMin":600,"AttackMax":800,"Work":450
                    })),
                    ("CraftMaterials.csv",1,json.dumps({
                        "itemId":300,"qty":5,"recipe":"SECRET_RECIPE"
                    })),
                    ("DirectDrops.csv",1,json.dumps({
                        "Rate":7500,"MonsterID":42,"source":"C:\\PRIVATE\\FILE"
                    })),
                    ("Unstructured.csv",1,json.dumps(["SECRET",3])),
                    ("Unstructured.csv",2,"not json"),
                ])
            before=source.read_bytes()
            result=module.read_profile(source)
            self.assertEqual(before,source.read_bytes())
            self.assertEqual(result["totalRowsVisited"],6)
            self.assertEqual(len(result["datasets"]),4)
            indexed={row["datasetName"]:row for row in result["datasets"]}
            items=indexed["Items.csv"]
            self.assertEqual(items["sourceRowCount"],2)
            self.assertEqual(items["jsonObjectRows"],2)
            by_key={f["fieldName"]:f for f in items["columns"]}
            self.assertEqual(by_key["AttackMin"]["rowsPresent"],2)
            self.assertEqual(by_key["Name"]["types"],{"string":2})
            self.assertIn("AttackMin",items["possibleGameplayColumns"])
            self.assertIn("Rate",indexed["DirectDrops.csv"]["possibleGameplayColumns"])
            self.assertEqual(indexed["Unstructured.csv"]["jsonArrayRows"],1)
            self.assertEqual(indexed["Unstructured.csv"]["unparsedRows"],1)
            serialized=json.dumps(result)
            for forbidden in [
                "PRIVATE_NAME","PRIVATE_BYTES","SECRET_RECIPE",
                "C:\\\\PRIVATE\\\\FILE","\"7500\""
            ]:
                self.assertNotIn(forbidden,serialized)

    def test_wrong_schema_and_bounded_row_limit_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/"bad.sqlite3"
            with sqlite3.connect(source) as db:
                db.execute("CREATE TABLE reference_rows(dataset TEXT)")
            with self.assertRaises(ValueError):
                module.read_profile(source)
            with self.assertRaises(ValueError):
                module.read_profile(source,max_rows=0)


if __name__=="__main__":
    unittest.main()
