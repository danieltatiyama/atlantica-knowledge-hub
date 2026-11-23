"""Stage 20.38: synthetic read-only loot source extraction and audits."""
from __future__ import annotations
import importlib.util
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
def from_script(path,name):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

export=from_script("scripts/export-client-monster-loot.py","monster_export_test")
validate=from_script("scripts/validate-client-monster-loot.py","monster_validation_test")
FIXTURE={
    "Characters.csv":[
        {"CharID":"100","EnglishName":"Original Monster",
         "ConfiguredLevel":"42","InternalKind":"MONSTER"},
        {"CharID":"101","EnglishName":"Another Monster",
         "ConfiguredLevel":"50","InternalKind":"MONSTER"},
    ],
    "DirectDrops.csv":[
        {"CharID":"100","ItemID":"5100","RawRate":"250",
         "Slot":"Drop1","MinQtyCandidate":"1","MaxQtyCandidate":"3"},
        {"CharID":"101","ItemID":"999999999","RawRate":"0",
         "Slot":"Drop2","MinQtyCandidate":"0","MaxQtyCandidate":"1"},
    ],
    "CharacterGroupRefs.csv":[
        {"CharID":"100","GroupID":"8","RawRate":"150",
         "Slot":"Group1"},
    ],
    "GroupDrops.csv":[
        {"GroupID":"8","Band":"B1","ItemID":"7050",
         "RawRate":"900","Slot":"Slot0",
         "MinQtyCandidate":"1","MaxQtyCandidate":"2"},
    ],
    "GroupBands.csv":[
        {"GroupID":"8","Band":"B1","BandKey":"BAND_1",
         "EntryCount":"1","RawSum":"900"},
    ]
}
COUNTS={key:len(value) for key,value in FIXTURE.items()}

class MonsterSourceTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:")
        self.db.executescript("""
            CREATE TABLE snapshots(id INTEGER PRIMARY KEY);
            INSERT INTO snapshots VALUES(1);
            CREATE TABLE reference_rows(
                dataset TEXT, row_num INTEGER, data TEXT,
                PRIMARY KEY(dataset,row_num));
            CREATE TABLE monsters(
                char_id INTEGER, code TEXT, name TEXT,
                source TEXT, level TEXT, grade TEXT);
        """)
        for dataset,values in FIXTURE.items():
            self.db.executemany(
                "INSERT INTO reference_rows(dataset,row_num,data) VALUES(?,?,?)",
                [(dataset,i,json.dumps(value)) for i,value in enumerate(values,1)])
        self.db.execute(
            "INSERT INTO monsters VALUES(?,?,?,?,?,?)",
            (102,"NPC_CODE","Unreconciled Original","C:\\Client\\Monsters.ndt","64","2"))
        self.db.commit()
        self.db.execute("PRAGMA query_only=ON")
        self.first=patch.dict(export.EXPECTED,COUNTS,clear=True)
        self.second=patch.dict(validate.export.EXPECTED,COUNTS,clear=True)
        self.first.start();self.second.start()
    def tearDown(self):
        self.second.stop();self.first.stop()
        self.db.close()

    def test_ids_join_exactly_and_rates_remain_raw_not_percent(self):
        output,report=export.build(self.db)
        manifest=output["manifest.json"]
        self.assertEqual(manifest["catalogMonsterIds"],3)
        self.assertEqual(manifest["directSourceRows"],2)
        self.assertEqual(manifest["groupReferenceRows"],1)
        self.assertEqual(manifest["groupDropRows"],1)
        self.assertEqual(manifest["groupBandRows"],1)
        self.assertEqual(manifest["reverseItemIds"],3)
        self.assertEqual(manifest["groupSourceJoins"],1)
        self.assertEqual(report["sourceRowCounts"],COUNTS)
        indexed=[r for filename,shard in output.items()
                 if filename.startswith("index-") for r in shard["rows"]]
        self.assertEqual(len(indexed),3)
        self.assertEqual([r for r in indexed if r[0]=="102"][0][4],"unnamed")
        char_records=output["characters/00.json"]["items"]["102"]["miner"]
        self.assertEqual(char_records[0][3],"Monsters.ndt",
                         "Full local paths may not be published")
        original=output["loot/00.json"]["items"]["100"]["direct"][0]
        self.assertEqual(original[1],"5100")
        self.assertEqual(original[2],"Coral")
        self.assertEqual(original[3],"250")
        unknown=output["loot/00.json"]["items"]["101"]["direct"][0]
        self.assertEqual(unknown[1],"999999999")
        self.assertIsNone(unknown[2],"Unknown client Item ID cannot get a guessed name")
        group=output["item-sources/7050.json"] if "item-sources/7050.json" in output else (
            output["item-sources/07.json"])
        self.assertEqual(group["items"]["7050"]["group"][0][2],"8")
        self.assertEqual(group["items"]["7050"]["group"][0][5],"150")
        self.assertEqual(group["items"]["7050"]["group"][0][6],"900")
        self.assertFalse("RatePctHypothesis" in json.dumps(output))
        self.assertFalse("%" in json.dumps(group))

    def test_validator_accepts_exact_original_relations_and_rejects_any_modified_join(self):
        output,_=export.build(self.db)
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/"Miner_MonsterLoot_PublicCandidate_20_38"
            export.write_candidate(output,root)
            result=validate.validate(root)
            self.assertEqual(result["monsters"],3)
            self.assertEqual(result["directDrops"],2)
            self.assertEqual(result["groupDrops"],1)
            self.assertEqual(result["linkedItemIds"],3)
            filename=root/"item-sources/07.json"
            shard=json.loads(filename.read_text(encoding="utf-8"))
            shard["items"]["7050"]["group"][0][6]="9999"
            filename.write_text(json.dumps(shard),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"Reverse item/monster"):
                validate.validate(root)

    def test_invalid_rate_and_unsafe_original_monster_name_are_rejected(self):
        self.db.execute("PRAGMA query_only=OFF")
        raw=dict(FIXTURE["DirectDrops.csv"][0],RawRate="25%")
        self.db.execute("UPDATE reference_rows SET data=? WHERE dataset=? AND row_num=?",
                        (json.dumps(raw),"DirectDrops.csv",1))
        self.db.commit();self.db.execute("PRAGMA query_only=ON")
        with self.assertRaisesRegex(ValueError,"raw numeric"):
            export.build(self.db)
        self.db.execute("PRAGMA query_only=OFF")
        self.db.execute("UPDATE reference_rows SET data=? WHERE dataset=? AND row_num=?",
                        (json.dumps(FIXTURE["DirectDrops.csv"][0]),"DirectDrops.csv",1))
        unsafe=dict(FIXTURE["Characters.csv"][0],EnglishName="<script>alert(1)</script>")
        self.db.execute("UPDATE reference_rows SET data=? WHERE dataset=? AND row_num=?",
                        (json.dumps(unsafe),"Characters.csv",1))
        self.db.commit();self.db.execute("PRAGMA query_only=ON")
        with self.assertRaisesRegex(ValueError,"Untrusted original text"):
            export.build(self.db)

    def test_unknown_monster_id_or_group_reference_is_not_assigned_to_another_name(self):
        self.db.execute("PRAGMA query_only=OFF")
        broken=dict(FIXTURE["DirectDrops.csv"][0],CharID="999999")
        self.db.execute("UPDATE reference_rows SET data=? WHERE dataset=? AND row_num=?",
                        (json.dumps(broken),"DirectDrops.csv",1))
        self.db.commit();self.db.execute("PRAGMA query_only=ON")
        with self.assertRaisesRegex(ValueError,"unknown original CharID"):
            export.build(self.db)

if __name__=="__main__":
    unittest.main()
