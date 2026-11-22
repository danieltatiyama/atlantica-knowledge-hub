"""Regression for client numeric attributes in Miner reference_rows Items.csv."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location(
    "client_item_attributes_stage20_25",
    ROOT/"scripts"/"export-client-item-attributes.py")
module=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class ClientItemAttributesTests(unittest.TestCase):
    def db(self,path:Path):
        with sqlite3.connect(path) as db:
            db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
            db.execute("INSERT INTO snapshots VALUES (1)")
            db.execute(
                "CREATE TABLE reference_rows(dataset TEXT,row_num INTEGER,data TEXT)")
            rows=[
                ("Items.csv",1,{"Unique":"1","EnglishName":"Spirit Sword",
                 "MinDamage":"125","MaxDamage":"300","AC":"-9",
                 "MagicDef":"0","Str":"19","Dex":"8","Mag":"292.5",
                 "CriticalPlus":"0.5","EffectKind":"PRIVATE_TEXT",
                 "rawSourcePath":"C:\\PRIVATE\\SECRET"}),
                ("Items.csv",2,{"Unique":"1","EnglishName":"Spirit Sword",
                 "MinDamage":"126","MaxDamage":"310","AC":"-8",
                 "MagicDef":"0","Mag":"292.5"}),
                ("Items.csv",3,{"Unique":"47","EnglishName":"Judgment Sword",
                 "MinDamage":"999","MaxDamage":"1000","AC":"95"}),
                ("Items.csv",4,{"Unique":"47","EnglishName":"OTHER IDENTIY",
                 "MinDamage":"2000"}),
                ("Items.csv",5,{"Unique":"70000","EnglishName":"Other Item",
                 "MinDamage":"55"}),
                ("Items.csv",6,{"Unique":"-1","EnglishName":"Invalid",
                 "MinDamage":"55"}),
                ("Items.csv",7,{"Unique":"800","EnglishName":"html",
                 "AC":"<script>"}),
                ("CraftRecipes.csv",1,{"Unique":"1","Work":"50000"}),
            ]
            db.executemany("INSERT INTO reference_rows VALUES (?,?,?)",
                 [(dataset,number,json.dumps(payload)) for dataset,number,payload in rows])
        return rows

    def test_all_raw_fields_preserved_with_exact_name_and_source_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/"miner.sqlite3"
            self.db(source)
            before=source.read_bytes()
            names={"1":"Spirit Sword","47":"Judgment Sword","99":"Missing Item"}
            private,public,report=module.export_reference_stats(source,names,1,
                generated_at="2026-11-22T12:00:00Z")
            self.assertEqual(source.read_bytes(),before)
            self.assertEqual(report["rowsInspected"],7)
            self.assertEqual(report["invalidItemIdentifiers"],1)
            self.assertEqual(report["collisionIds"],1)
            self.assertEqual(report["unmatchedIds"],1)
            self.assertEqual(report["exactMatchIds"],1)
            self.assertEqual(report["itemsWithNumericClientAttributes"],1)
            self.assertEqual(len(public["records"]),1)
            record=public["records"][0]
            self.assertEqual(record["id"],"1")
            self.assertEqual([r["sourceRowNumber"] for r in record["sourceRows"]],[1,2])
            self.assertEqual(record["sourceRows"][0]["fieldsRaw"]["MinDamage"],"125")
            self.assertEqual(record["sourceRows"][0]["fieldsRaw"]["CriticalPlus"],"0.5")
            self.assertEqual(record["sourceRows"][0]["fieldsRaw"]["AC"],"-9")
            self.assertEqual(record["sourceRows"][0]["fieldsRaw"]["Mag"],"292.5")
            self.assertEqual(record["sourceRows"][1]["fieldsRaw"]["Mag"],"292.5")
            self.assertNotIn("EffectKind",record["sourceRows"][0]["fieldsRaw"])
            self.assertNotIn("rawSourcePath",record["sourceRows"][0]["fieldsRaw"])
            self.assertEqual(report["numericFieldCoverage"]["MinDamage"],2)
            self.assertEqual(next(item for item in private["items"] if item["itemId"]=="47")["status"],
                             "item-id-name-collision")
            for forbidden in ["Spirit Sword","Judgment Sword","PRIVATE","125","OTHER IDENTIY"]:
                self.assertNotIn(forbidden,json.dumps(report))

    def test_untrusted_numeric_strings_not_published(self):
        source={
          "MinDamage":"00420","MaxDamage":"12345",
          "AC":"10\nPRIVATE","MagicDef":"1e10","Critical":"50%",
          "HitRate":"99999999999999999999",
          "Str":"-1","Dex":0,"Mag":"292.5",
          "Dodge":" 12 ","Vit":"NaN","Intl":float("inf"),
        }
        safe=module.parse_raw_fields(source)
        self.assertNotIn("MinDamage",safe)
        self.assertNotIn("AC",safe)
        self.assertNotIn("MagicDef",safe)
        self.assertNotIn("Critical",safe)
        self.assertNotIn("HitRate",safe)
        self.assertNotIn("Vit",safe)
        self.assertNotIn("Intl",safe)
        self.assertEqual(safe["MaxDamage"],"12345")
        self.assertEqual(safe["Str"],"-1")
        self.assertEqual(safe["Dex"],"0")
        self.assertEqual(safe["Dodge"],"12")
        self.assertEqual(safe["Mag"],"292.5")

    def test_missing_schema_and_snapshot_fail_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/"miner.sqlite3"
            with sqlite3.connect(source) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER)")
                db.execute("INSERT INTO snapshots VALUES (1)")
                db.execute("CREATE TABLE reference_rows(dataset TEXT)")
            with self.assertRaises(ValueError):
                module.export_reference_stats(source,{"1":"Spirit Sword"},1)
            with self.assertRaises(ValueError):
                module.export_reference_stats(source,{"1":"Spirit Sword"},2)


if __name__=="__main__":
    unittest.main()
