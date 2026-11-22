"""Stage 20.23 client-first read-only all-item extraction regression tests."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location(
    "miner_client_equipment_facts",ROOT/"scripts"/"export-client-equipment-facts.py")
mod=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


def row(record,item,*,name="Spirit Sword",region="base",
        category="Weapon",source=r"C:\PRIVATE\ItemTypeWeapon.ndt",
        official="official",grade="NORMAL",level="1",unit=None,work=450,
        material="5100(5)+6080(4)",state="unsupported",recipe=None):
    return dict(record_id=record,item_id=item,region=region,category=category,
        source=source,name=name,original_name="SECRET_PRIVATE_KOREAN",
        translation_state=official,grade=grade,level=level,unit=unit,work=work,
        material=material,recipe_state=state,recipe=recipe)


def fixture(dbfile):
    rows=[
        row(1,1),
        row(2,1,category="Sword",source=r"C:\PRIVATE\ItemTypeSword.ndt",
            unit=1,state="valid",recipe="[[5100, 5], [6080, 4]]"),
        row(3,1,region="ENG",name="KOREAN_SECRET",official="original",
            source=r"C:\PRIVATE\ItemTypeWeapon_ENG.vna"),
        row(4,47,name="Judgment Sword",category="Sword",
            source=r"C:\PRIVATE\ItemTypeSword.ndt",level="150",
            material="NULL",work=600),
        row(5,3890,name="Sweet Chocolate Ring",category="Accessories",
            source=r"C:\PRIVATE\ItemTypeAccessories.ndt"),
        row(6,3890,name="Conflicting Decoration",
            category="Decoration",source=r"C:\PRIVATE\ItemTypeDecoration.ndt"),
        row(7,9999,name="Unique Client-Only Item",category="Etc",
            source=r"C:\PRIVATE\ItemTypeEtc.ndt",material="NULL"),
        row(8,12345,name="한국어 미번역",official="original",
            source=r"C:\PRIVATE\ItemTypeEtc.ndt",material="NULL"),
        row(9,23208,name="Book: Watchful Soul [III]",category="Book",
            source=r"C:\PRIVATE\ItemTypeBook.ndt",
            work=30000000,material="3000(2)"),
        row(10,23208,name="Book: Watchful Soul [III]",category="Book",
            source=r"C:\PRIVATE\ItemTypeBook.ndt",
            work=5200000,material="3000(4)")
    ]
    with sqlite3.connect(dbfile) as db:
        db.execute("CREATE TABLE snapshots(id INTEGER PRIMARY KEY)")
        db.execute("INSERT INTO snapshots(id) VALUES (1)")
        fields="snapshot_id INTEGER, record_id INTEGER PRIMARY KEY, item_id INTEGER, region TEXT, category TEXT, name TEXT, original_name TEXT, translation_state TEXT, source TEXT, grade TEXT, level TEXT, unit INTEGER, work INTEGER, material TEXT, recipe_state TEXT, recipe TEXT"
        db.execute(f"CREATE TABLE catalog_items({fields})")
        db.executemany("INSERT INTO catalog_items VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[
            (1,*(x[k] for k in mod.COLUMNS)) for x in rows])
    return rows


class ClientFactsTests(unittest.TestCase):
    def test_parses_client_material_references_without_exposing_raw_expressions(self):
        status,components=mod.parse_ingredients("5100(5)+6080(4)","unsupported",None)
        self.assertEqual(status,"parsed-client-material")
        self.assertEqual(components,[
            {"itemId":"5100","quantity":5},{"itemId":"6080","quantity":4}])
        status,components=mod.parse_ingredients(
            "5100(5)+6080(4)","valid","[[5100, 5], [6080, 4]]")
        self.assertEqual(status,"parsed-client-recipe")
        self.assertEqual(components[1]["quantity"],4)
        self.assertEqual(mod.parse_ingredients("NULL","none",None),("none",[]))
        self.assertEqual(mod.parse_ingredients("SOME SECRET SOURCE EXPRESSION", "unsupported",None),
                         ("unsupported",[]))
        self.assertEqual(mod.parse_ingredients("123(1)+123(-2)","unsupported",None),
                         ("unsupported",[]))

    def test_general_and_specific_source_facts_are_both_preserved(self):
        rows=[
            row(1,1),
            row(2,1,category="Sword",source=r"C:\PRIVATE\ItemTypeSword.ndt",
                unit=1,state="valid",recipe="[[5100, 5], [6080, 4]]"),
        ]
        groups={"1":rows}
        private,public,report=mod.build_catalog(groups,{"1":"Spirit Sword"},1,
                                                   "2026-11-22T00:00:00Z")
        self.assertEqual(report["distinctValidItemIds"],1)
        self.assertEqual(report["publicItemsWithSourceFacts"],1)
        self.assertEqual(len(public["records"]),1)
        record=public["records"][0]
        self.assertEqual(record["nameEn"],"Spirit Sword")
        self.assertEqual(len(record["sourceDefinitions"]),2)
        self.assertEqual(len(record["variantSourceSets"]),2)  # Different unitRaw
        self.assertEqual(record["sourceDefinitions"][0]["role"],"general")
        self.assertEqual(record["sourceDefinitions"][1]["role"],"specific")
        self.assertEqual(record["sourceDefinitions"][1]["unitRaw"],1)
        for x in record["sourceDefinitions"]:
            self.assertEqual(x["ingredients"],[
                {"itemId":"5100","quantity":5},{"itemId":"6080","quantity":4}])
        serialized=json.dumps((public,private,report),ensure_ascii=False)
        for forbidden in ["C:\\\\PRIVATE","SECRET_PRIVATE_KOREAN",
                          "5100(5)+6080(4)","KOREAN_SECRET"]:
            self.assertNotIn(forbidden,serialized)

    def test_all_client_id_rows_are_read_including_not_in_551_registry(self):
        with tempfile.TemporaryDirectory() as tmp:
            source=Path(tmp)/"client.sqlite3"
            fixture(source)
            before=source.read_bytes()
            private,public,report=mod.export_catalog(source,1, {
                "1":"Spirit Sword","47":"Judgment Sword",
                "3890":"Sweet Chocolate Ring",
                "23208":"Book: Watchful Soul [III]",
            })
            self.assertEqual(before,source.read_bytes())
            self.assertEqual(report["distinctValidItemIds"],6)
            self.assertEqual(report["sourceRows"],10)
            self.assertEqual(report["publicItemsWithSourceFacts"],3)
            self.assertEqual(len(private["items"]),6)
            self.assertEqual(len(public["records"]),3)
            self.assertEqual([x["id"] for x in public["records"]],
                ["1","47","23208"])
            self.assertTrue(any(x["itemId"]=="9999" for x in private["items"]))
            conflict=next(x for x in private["items"] if x["itemId"]=="3890")
            self.assertEqual(conflict["identityState"],"reviewed-name-conflict")
            book=next(x for x in public["records"] if x["id"]=="23208")
            self.assertEqual(len(book["variantSourceSets"]),2)
            self.assertEqual(book["sourceDefinitions"][0]["workRaw"],30000000)
            self.assertEqual(book["sourceDefinitions"][1]["workRaw"],5200000)
            self.assertEqual(book["sourceDefinitions"][0]["ingredients"][0]["quantity"],2)
            self.assertEqual(book["sourceDefinitions"][1]["ingredients"][0]["quantity"],4)

    def test_readonly_invalid_database_or_snapshot_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/"bad.sqlite3"
            with sqlite3.connect(path) as db:
                db.execute("CREATE TABLE snapshots(id INTEGER)")
                db.execute("INSERT INTO snapshots VALUES (1)")
                db.execute("CREATE TABLE catalog_items(item_id INTEGER)")
            with self.assertRaises(ValueError):
                mod.export_catalog(path,1,{"1":"Spirit Sword"})
            with self.assertRaises(ValueError):
                mod.export_catalog(path,2,{"1":"Spirit Sword"})

    def test_no_identity_inference_from_untranslated_or_conflicting_names(self):
        records={
            "1":[row(1,1,official="original",name="한글")],
            "2":[row(2,2,name="Shadow Sword"),
                 row(3,2,name="Totally Different Sword")],
        }
        private,public,report=mod.build_catalog(records,{"1":"Spirit Sword",
                                                           "2":"Shadow Sword"},1)
        self.assertEqual(len(public["records"]),0)
        self.assertEqual(len(private["items"]),2)
        self.assertEqual(report["identityStates"]["reviewed-name-conflict"],2)


if __name__=="__main__":
    unittest.main()
