"""Read-only all-item stats extraction regression, with source-name quarantine."""
from __future__ import annotations
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location(
    "full_miner_stats",ROOT/"scripts"/"export-full-client-stats.py")
module=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

class AllSourceStatsTests(unittest.TestCase):
    def setUp(self):
        self.sandbox=tempfile.TemporaryDirectory()
        self.addCleanup(self.sandbox.cleanup)
        self.root=Path(self.sandbox.name)
        self.database=self.root/"original.sqlite3"
        with sqlite3.connect(self.database) as db:
            db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
            db.execute("INSERT INTO snapshots VALUES(1)")
            db.execute("CREATE TABLE reference_rows(dataset TEXT,row_num INTEGER,data TEXT)")
            dummy=json.dumps({"Unique":"0","EnglishName":"PRIVATE_NOT_PUBLISHED",
                              "MinDamage":"200","rawFilePath":"SECRET_EXAMPLE"})
            db.executemany("INSERT INTO reference_rows VALUES('Items.csv',?,?)",
                           [(i,dummy) for i in range(1,20001)])
            records=[
              (20001,{"Unique":"1","EnglishName":"Spirit Sword","MinDamage":"60",
                      "MaxDamage":"90","MagicDef":"0","EV":"0","MoveSpeed":"0",
                      "rawFilePath":"C:\\PRIVATE","Mag":"292.5"}),
              (20002,{"Unique":"1","EnglishName":"Spirit Sword","MinDamage":"60",
                      "MaxDamage":"90","MoveSpeed":"0"}),
              (20003,{"Unique":"2","EnglishName":"Cursed Sword Muramasa","MinDamage":"75"}),
              (20004,{"Unique":"2","EnglishName":"FORGED NAME","MinDamage":"99999"}),
              (20005,{"Unique":"3","EnglishName":"Lapis Sword (No Trade)","AC":"100",
                      "MoveSpeed":"4","CriticalPlus":"0","HitRate":"1e9"}),
              (20006,{"Unique":"3890","EnglishName":"unresolved","Str":"99"}),
              (20007,{"Unique":"429","EnglishName":"Immortal Bow","MinDamage":"300"}),
              (20008,{"Unique":"437","EnglishName":"Immortal Bow","MinDamage":"310"}),
            ]
            db.executemany("INSERT INTO reference_rows VALUES('Items.csv',?,?)",
                           [(i,json.dumps(obj)) for i,obj in records])
        self.index_dir=ROOT/"public"/"data"/"client-items"
        self.out=self.root/"candidate"
        self.report=self.root/"aggregate.json"

    def test_all_source_matching_keeps_distinct_ids_and_never_writes_db(self):
        before=self.database.read_bytes()
        report=module.export(self.database,self.index_dir,self.out,self.report)
        self.assertEqual(self.database.read_bytes(),before)
        self.assertEqual(report["rowsInspected"],20008)
        self.assertEqual(report["sourceNameCollisionIdsHeld"],1)
        self.assertEqual(report["publishedCandidateIds"],4)
        self.assertEqual(report["publishedCandidateSourceRows"],5)
        self.assertEqual(report["invalidItemIds"],20000)
        self.assertEqual(report["unresolvedIdentitySourceRows"],1)
        self.assertEqual(report["numericFieldCoverage"]["MoveSpeed"],3)
        self.assertNotIn("Spirit Sword",json.dumps(report))
        self.assertNotIn("C:\\PRIVATE",json.dumps(report))
        first=json.loads((self.out/"00.json").read_text(encoding="utf-8"))
        self.assertEqual(first["items"]["1"][0][1]["MinDamage"],"60")
        self.assertEqual(first["items"]["1"][0][1]["Mag"],"292.5")
        self.assertEqual(first["items"]["1"][0][1]["MagicDef"],"0")
        self.assertNotIn("rawFilePath",first["items"]["1"][0][1])
        self.assertNotIn("2",first["items"],"Name-conflicted ID should be quarantined")
        self.assertEqual(first["items"]["429"][0][1]["MinDamage"],"300")
        self.assertEqual(first["items"]["437"][0][1]["MinDamage"],"310")
        self.assertEqual(first["items"]["3"][0][1]["MoveSpeed"],"4")
        self.assertNotIn("HitRate",first["items"]["3"][0][1])
        manifest=json.loads((self.out/"manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["sourceRows"],5)
        self.assertEqual(manifest["dataset"],"all-client-item-raw-stats")

    def test_output_reuse_is_rejected_without_explicit_overwrite(self):
        module.export(self.database,self.index_dir,self.out,self.report)
        with self.assertRaises(FileExistsError):
            module.export(self.database,self.index_dir,self.out,self.report)
        self.assertEqual(module.parse_numeric_fields({
            "MinDamage":"100","MoveSpeed":"0","EV":"10","Mag":"292.5",
            "AC":"not-numeric","Critical":"50%","CriticalPlus":"<script>"
        }),{"MinDamage":"100","EV":"10","MoveSpeed":"0","Mag":"292.5"})

    def test_unrecognized_source_schema_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"wrong.sqlite3"
            with sqlite3.connect(path) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER)")
                db.execute("INSERT INTO snapshots VALUES(1)")
                db.execute("CREATE TABLE reference_rows(dataset TEXT)")
            with self.assertRaises(ValueError):
                module.export(path,self.index_dir,self.root/"no",self.root/"no-report.json")

if __name__=="__main__":
    unittest.main()
