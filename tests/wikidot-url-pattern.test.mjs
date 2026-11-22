import test from "node:test";
import assert from "node:assert/strict";
import {
  wikidotItemSlug,
  wikidotCandidateUrl,
  suggestCatalogPages
} from "../scripts/suggest-wikidot-item-pages.mjs";
import { loadReviewedEquipmentNames } from "../scripts/read-reviewed-equipment-names.mjs";

test("historic Wikidot item URLs follow public item:<slug> namespace", () => {
  const samples = [
    ["Spirit Sword","spirit-sword"],
    ["Spirit Bow","spirit-bow"],
    ["Spirit Instrument","spirit-instrument"],
    ["Destroyer's Sword","destroyer-s-sword"],
    ["Phoenix's Light Armor","phoenix-s-light-armor"],
    ["Dark Knight's Shield","dark-knight-s-shield"],
    ["Pegasus Lance","pegasus-lance"],
    ["Excalibur","excalibur"],
  ];
  for (const [name,slug] of samples) {
    assert.equal(wikidotItemSlug(name),slug);
    assert.equal(wikidotCandidateUrl(name),
      "https://atlantica-online.wikidot.com/item:"+slug);
  }
});

test("suggestions read the 551 reviewed names and make no existence claims", () => {
  const matches=suggestCatalogPages(loadReviewedEquipmentNames(),"spirit");
  assert.ok(matches.length > 0);
  assert.ok(matches.every(row=>row.verified===false));
  assert.ok(matches.some(row=>row.name==="Spirit Bow" && row.id==="400"));
  assert.ok(matches.some(row=>row.name==="Spirit Sword" && row.id==="1"));
  assert.ok(matches.some(row=>row.name==="Spirit Instrument" && row.id==="1400"));
});

test("slug hints fail closed on unsupported values", () => {
  assert.equal(wikidotCandidateUrl("    "),null);
  assert.throws(()=>wikidotItemSlug({name:"evil"}),TypeError);
  assert.throws(()=>suggestCatalogPages({},"",0),RangeError);
  assert.equal(wikidotItemSlug("Sword?<script>"),"sword-script");
});
