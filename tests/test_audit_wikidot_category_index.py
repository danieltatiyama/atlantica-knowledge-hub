"""Synthetic-only category index parsing tests. No network or site content copying."""
import importlib.util
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location(
  "wikidot_category_index",ROOT/"scripts"/"audit-wikidot-category-index.py"
)
mod=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)

AXE="""<!DOCTYPE html><html><head><title>Axe - Atlantica Online Wiki</title></head>
<body><div id="page-content"><h1>List</h1>
<table><tr><th>Item</th><th>Min. Level</th><th>Attack Power</th>
<th>Strength</th><th>Vitality</th><th>Craftable</th></tr>
<tr><td><a>Spirit Axe</a></td><td>1</td><td>60 - 130</td><td>7</td><td>6</td><td>Yes</td></tr>
<tr><td>Destroyer's Axe</td><td>35</td><td>130 - 280</td><td>15</td><td>13</td><td>Yes</td></tr>
<tr><td>Unknown Axe</td><td>99</td><td>999 - 999</td><td>20</td><td>10</td><td>Yes</td></tr>
</table></div></body></html>"""
ARMOR="""<html><head><title>Armor - Atlantica Online Wiki</title></head>
<body><div id="page-content"><h1>List</h1><table>
<tr><th>Item</th><th>Min. Level</th><th>Defense</th><th>Strength</th>
<th>Vitality</th><th>Magic Defense</th><th>Evasion</th></tr>
<tr><td>Spirit Armor</td><td>1</td><td>150</td><td>-</td><td>5</td><td>5</td><td>+0.4%</td></tr>
</table></div></body></html>"""


def queue(names):
    return {"queueVersion":"20.16-private","items":[{
        "itemId":str(ident),"nameEn":name,
        "completeness":{}, "wikidotUrlVerified":False,
        "wikidotCandidateUrl":mod.CORE.ORIGIN+"/item:"+mod.CORE.candidate_slug(name)}
        for ident,name in names
    ]}


class CategoryIndexTests(unittest.TestCase):
    def test_parse_category_tables_into_base_numeric_facts_only(self):
        rows=mod.parse_index_html(AXE,"axe")
        self.assertEqual(rows[0],{
            "name":"Spirit Axe", "minimumLevel":1,
            "stats":{"enchantLevel":0,"attackMin":60,"attackMax":130,
                     "strength":7,"vitality":6}
        })
        self.assertEqual(rows[1]["name"],"Destroyer's Axe")
        self.assertEqual(rows[1]["minimumLevel"],35)
        self.assertNotIn("craftable",str(rows).lower())
        arm=mod.parse_index_html(ARMOR,"armor")
        self.assertEqual(arm[0]["stats"],{
            "enchantLevel":0,"defense":150,"vitality":5,"magicDefense":5})
        self.assertNotIn("evasion",str(arm).lower())

    def test_join_to_existing_reviewed_names_without_fabricating_ids(self):
        q=queue([(300,"Spirit Axe"),(330,"Destroyer's Axe"),(600,"Spirit Armor"),
                 (89,"Dragon Heart Sword")])
        result=mod.audit_indexes(q,{"axe":AXE.encode(),"armor":ARMOR.encode()})
        s=result["summary"]
        self.assertEqual(s["categoryPagesParsed"],2)
        self.assertEqual(s["uniqueHistoricalCandidates"],3)
        self.assertEqual(s["itemNameCollisionsWithheld"],0)
        self.assertEqual([x["itemId"] for x in result["entries"]],["300","330","600"])
        axe=result["entries"][0]
        self.assertEqual(axe["reviewedNameEn"],"Spirit Axe")
        self.assertEqual(axe["sourceScope"],"category-index")
        self.assertTrue(axe["itemNameMatchedInIndex"])
        self.assertTrue(axe["titleMatches"])  # category title, NOT game-item verification
        self.assertFalse(axe["editoriallyApproved"])
        self.assertFalse(axe["wikidotUrlVerified"])
        self.assertIsNone(axe["overview"])  # classes are not in the index
        self.assertIsNone(axe["crafting"])
        self.assertEqual(axe["stats"][0]["attackMax"],130)
        self.assertEqual(axe["sourceUrl"],mod.CORE.ORIGIN+"/item:axe")
        self.assertEqual(len(axe["sourceSha256"]),64)

    def test_false_page_identity_and_unknown_category_rejected(self):
        with self.assertRaises(ValueError):
            mod.parse_index_html(AXE,"armor")
        with self.assertRaises(ValueError):
            mod.parse_index_html(AXE,"evil")
        with self.assertRaises(ValueError):
            mod.audit_indexes(queue([(300,"Spirit Axe")]),{"other":AXE.encode()})

    def test_index_duplicate_item_names_are_withheld_for_identity_review(self):
        q=queue([(300,"Spirit Axe"),(333,"Spirit Axe"),(330,"Destroyer's Axe")])
        result=mod.audit_indexes(q,{"axe":AXE.encode()})
        self.assertEqual(result["summary"]["uniqueHistoricalCandidates"],1)
        self.assertEqual(result["summary"]["itemNameCollisionsWithheld"],1)
        self.assertEqual([x["itemId"] for x in result["entries"]],["330"])

    def test_duplicate_item_between_two_indexes_not_selected_arbitrarily(self):
        cross=ARMOR.replace("Spirit Armor","Spirit Axe")
        q=queue([(300,"Spirit Axe"),(330,"Destroyer's Axe")])
        result=mod.audit_indexes(q,{"axe":AXE.encode(),"armor":cross.encode()})
        self.assertEqual(result["summary"]["itemNameCollisionsWithheld"],1)
        self.assertEqual([x["itemId"] for x in result["entries"]],["330"])

    def test_completed_profiles_are_skipped_and_batch_offset_is_bounded(self):
        q=queue([(300,"Spirit Axe"),(330,"Destroyer's Axe")])
        q["items"][0]["completeness"]={
          "overview":True,"enchantStats":True,"crafting":True,"materials":True}
        result=mod.audit_indexes(q,{"axe":AXE.encode()})
        self.assertEqual([x["itemId"] for x in result["entries"]],["330"])
        result=mod.audit_indexes(queue([(300,"Spirit Axe"),(330,"Destroyer's Axe")]),
                                {"axe":AXE.encode()},max_entries=1,offset=1)
        self.assertEqual([x["itemId"] for x in result["entries"]],["330"])
        with self.assertRaises(ValueError):
            mod.audit_indexes(q,{"axe":AXE.encode()},max_entries=21)
        with self.assertRaises(ValueError):
            mod.audit_indexes(q,{"axe":AXE.encode()},offset=-1)


if __name__=="__main__":
    unittest.main()
