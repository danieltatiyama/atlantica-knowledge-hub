"""Offline synthetic tests only. Never make requests to the Wikidot website."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "wikidot_historical_source_audit",
    ROOT / "scripts" / "audit-wikidot-item-pages.py"
)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

FAKE_BOW = """<!doctype html><html><head><title>Spirit Bow - Atlantica Online Wiki</title>
</head><body><nav>Unrelated</nav><div id="page-content">
<p>Type: <a href="/weapons">Bow</a></p>
<p>Min. Level: 1</p>
<p>Restrictions: <a>Archer</a>/<a>Prophet</a>/<a>Dark Archer</a> Classes Only</p>
<h1>Stats</h1>
<table><tr><th>Enchant Level</th><th>Attack Power</th><th>Dexterity</th><th>Durability</th></tr>
<tr><td>+0</td><td>50 - 100</td><td>8</td><td>-</td></tr>
<tr><td>+1</td><td>60 - 120</td><td>9</td><td>-</td></tr>
<tr><td>+10</td><td>200 - 400</td><td>32</td><td>-</td></tr></table>
<h1>Source</h1><h2>Boxes</h2>
<table><tr><th>Box</th><th>Random Selection</th><th>Quantity</th></tr>
<tr><td>Spirit Weapon Box</td><td>No</td><td>1</td></tr></table>
<h1>Crafting</h1><h2>Info</h2>
<ul><li>Production Rate: 1 per batch</li><li>Required <a>Workload</a>: 450</li>
<li>Required <a>Bow Skill</a>: 1</li></ul>
<h2>Materials</h2>
<table><tr><th>Material</th><th>Need</th></tr>
<tr><td><a>Coral</a></td><td>5</td></tr><tr><td><a>Maple</a></td><td>4</td></tr></table>
</div><footer>page revision: 3, last edited: 02 Dec 2017 06:00</footer>
</body></html>"""

FAKE_EXCALIBUR = """<html><head><title>Excalibur - Atlantica Online Wiki</title></head>
<body><div id="page-content"><p>Type: Sword</p><p>Min. Level: 150</p>
<h2>Stats</h2><table><tr><th>Enchant Level</th><th>Attack Power</th>
<th>Strength</th><th>Vitality</th></tr>
<tr><td>+0</td><td>3,016 - 3,782</td><td>250</td><td>250</td></tr>
<tr><td>+10</td><td>12,064 - 15,128</td><td>1,000</td><td>1,000</td></tr>
<tr><td>L</td><td>12,968 - 16,262</td><td>1,075</td><td>1,075</td></tr>
</table></div></body></html>"""


def queue(rows):
    return {"queueVersion": "20.16-private", "items": [
        {"itemId": str(item_id), "nameEn": name,
         "wikidotCandidateUrl": module.ORIGIN + "/item:" + module.candidate_slug(name),
         "wikidotUrlVerified": False,
         "completeness": {}}
        for item_id, name in rows
    ]}


class HistoricalAuditTests(unittest.TestCase):
    def test_spirit_bow_structured_stats_overview_crafting_and_materials(self):
        result = module.parse_page(
            FAKE_BOW, "Spirit Bow", module.ORIGIN + "/item:spirit-bow")
        self.assertEqual(result["status"], "historical-draft")
        self.assertTrue(result["titleMatches"])
        self.assertEqual(result["sourceRevision"], 3)
        self.assertEqual(result["overview"], {
            "typeEn": "Bow", "minimumLevel": 1,
            "eligibleClasses": ["Archer", "Prophet", "Dark Archer"]})
        self.assertEqual(result["stats"], [
            {"enchantLevel": 0,"attackMin": 50,"attackMax": 100,"dexterity": 8},
            {"enchantLevel": 1,"attackMin": 60,"attackMax": 120,"dexterity": 9},
            {"enchantLevel": 10,"attackMin": 200,"attackMax": 400,"dexterity": 32}])
        self.assertEqual(result["crafting"], {
            "productionPerBatch": 1, "requiredWorkload": 450,
            "requiredSkill": {"nameEn": "Bow", "level": 1}})
        self.assertEqual(result["materials"], [
            {"nameEn": "Coral", "quantity": 5},
            {"nameEn": "Maple", "quantity": 4}])
        self.assertNotIn("Spirit Weapon Box", json.dumps(result))

    def test_wikidot_break_separated_fields_are_kept_separate(self):
        html = """<html><head><title>Spirit Bow - Atlantica Online Wiki</title></head>
        <body><div id="page-content"><p>Type: <a>Bow</a><br>
        Min. Level: 1<br>Restrictions: Archer/Prophet Classes Only</p>
        <h2>Stats</h2><table><tr><th>Enchant Level</th><th>Attack Power</th></tr>
        <tr><td>+0</td><td>50 - 100</td></tr></table></div></body></html>"""
        result = module.parse_page(
            html,"Spirit Bow",module.ORIGIN+"/item:spirit-bow"
        )
        self.assertEqual(result["overview"], {
            "typeEn":"Bow", "minimumLevel":1,
            "eligibleClasses":["Archer","Prophet"],
        })
        self.assertEqual(result["stats"][0]["attackMin"],50)

    def test_numeric_thousands_and_L_are_parsed_not_interpolated(self):
        result = module.parse_page(
            FAKE_EXCALIBUR, "Excalibur", module.ORIGIN + "/item:excalibur")
        self.assertEqual(result["stats"], [
            {"enchantLevel": 0,"attackMin": 3016,"attackMax": 3782,
             "strength": 250,"vitality": 250},
            {"enchantLevel": 10,"attackMin": 12064,"attackMax": 15128,
             "strength": 1000,"vitality": 1000},
            {"enchantLevel": "L","attackMin": 12968,"attackMax": 16262,
             "strength": 1075,"vitality": 1075}])

    def test_title_mismatch_never_trusts_unrelated_item_page(self):
        result = module.parse_page(
            FAKE_BOW, "Spirit Sword", module.ORIGIN + "/item:spirit-sword")
        self.assertEqual(result["status"], "title-mismatch")
        self.assertEqual(result["stats"], [])
        self.assertFalse(result["titleMatches"])

    def test_invalid_redirect_and_candidate_url_rejected(self):
        self.assertTrue(module.valid_url(module.ORIGIN + "/item:spirit-bow","Spirit Bow"))
        for path in [
            "https://malicious.example/item:spirit-bow",
            "http://atlantica-online.wikidot.com/item:spirit-bow",
            "https://atlantica-online.wikidot.com/item:spirit-bow?redirect=true",
            "https://atlantica-online.wikidot.com/../../item:spirit-bow",
            "https://atlantica-online.wikidot.com/item:spirit-sword",
        ]:
            self.assertFalse(module.valid_url(path,"Spirit Bow"))
        with self.assertRaises(ValueError):
            module.SameHostRedirects().redirect_request(
                None,None,302,"redirect",{},"https://other.example/fake")

    def test_offline_missing_html_and_not_auto_approved(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            (path / "400.html").write_text(FAKE_BOW,encoding="utf-8")
            (path / "not-related.html").write_text("<body>secret</body>",encoding="utf-8")
            rows = queue([(400,"Spirit Bow"),(1,"Spirit Sword")])
            result = module.run(rows,path,False,5,0,3.0)
            self.assertEqual(result["mode"],"local-html")
            self.assertEqual(result["summary"]["itemsRequested"],2)
            self.assertEqual(result["summary"]["parsedHistoricalDrafts"],1)
            self.assertEqual(result["summary"]["fetchedAndTitleMatched"],0)
            self.assertTrue(result["allRowsAreHistoricalUnverified"])
            bow, sword = result["entries"]
            self.assertEqual(bow["status"],"historical-draft")
            self.assertEqual(bow["itemId"],"400")
            self.assertFalse(bow["editoriallyApproved"])
            self.assertFalse(bow["wikidotUrlVerified"])
            self.assertEqual(len(bow["sourceSha256"]),64)
            self.assertEqual(sword["status"],"html-not-provided")
            self.assertNotIn("rawHtml",str(result))
            self.assertNotIn("nav>",str(result))

    def test_batch_limits_privacy_and_no_implicit_network(self):
        for bad in [
            {"queueVersion":"legacy","items":[]},
            queue([(1,"Spirit Bow"),(1,"Spirit Bow")]),
            {"queueVersion":"20.16-private","items":[
                {"itemId":"4","nameEn":"Spirit Bow",
                 "wikidotCandidateUrl":"https://evil.invalid/item:spirit-bow"}
            ]},
        ]:
            with self.assertRaises(ValueError):
                module.validate_queue(bad)
        with self.assertRaises(ValueError):
            module.run(queue([(400,"Spirit Bow")]),None,False,1,0,3.0)
        with self.assertRaises(ValueError):
            module.run(queue([(400,"Spirit Bow")]),Path("."),False,21,0,3.0)
        with self.assertRaises(ValueError):
            module.run(queue([(400,"Spirit Bow")]),Path("."),False,1,0,1.0)

    def test_parser_discards_potentially_irrelevant_tables(self):
        malformed=FAKE_BOW.replace(
            "<tr><td>+1</td><td>60 - 120</td><td>9</td><td>-</td></tr>",
            "<tr><td>+1</td><td>60 - 120</td><td>9</td><td>-</td></tr>"
            "<tr><td>+1</td><td>99 - 120</td><td>9</td><td>-</td></tr>")
        with self.assertRaisesRegex(ValueError,"Conflicting"):
            module.parse_page(malformed,"Spirit Bow",module.ORIGIN+"/item:spirit-bow")


if __name__=="__main__":
    unittest.main()
