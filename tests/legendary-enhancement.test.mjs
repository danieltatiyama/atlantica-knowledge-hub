import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  LEGENDARY_ENCHANT_MULTIPLIER_TENTHS,
  LEGENDARY_PROJECTION_MODEL,
  projectClassicStat,
  getEnchantStatRows,
} from "../src/data/equipment-enchant-projection.mjs";
import {
  validateLegendaryResearch,
  getLegendaryResearchRows,
} from "../src/data/legendary-enhancement-research.mjs";
import { validateReviewedProfiles } from "../src/data/reviewed-equipment-profiles-gate.mjs";
import { loadReviewedEquipmentNames } from "../scripts/read-reviewed-equipment-names.mjs";

const data = JSON.parse(readFileSync(
  fileURLToPath(new URL("../src/data/legendary-enhancement-research.json", import.meta.url)), "utf8"
));
const clone = (x) => JSON.parse(JSON.stringify(x));
const names = loadReviewedEquipmentNames();
const profiles = JSON.parse(readFileSync(
  fileURLToPath(new URL("../src/data/reviewed-equipment-profiles.json", import.meta.url)), "utf8"
));

test("Legendary uses exact 43/10 after +10 (40/10), not a 43% bonus", () => {
  assert.equal(LEGENDARY_ENCHANT_MULTIPLIER_TENTHS, 43);
  assert.equal(LEGENDARY_PROJECTION_MODEL, "wikidot-legendary-43-v1");
  assert.equal(projectClassicStat(1350, 10), 5400);
  assert.equal(projectClassicStat(1350, "L"), 5805);
  assert.equal(projectClassicStat(2750, "L"), 11825);
  assert.equal(projectClassicStat(230, "L"), 989);
});

const fixtures = [
  {item:"Immortal Bow",fields:{
    attackMin:[1350,5805],attackMax:[2750,11825],dexterity:[230,989]}},
  {item:"Excalibur",fields:{
    attackMin:[3016,12968],attackMax:[3782,16262],
    strength:[250,1075],vitality:[250,1075]}},
  {item:"Guardian Sheath",fields:{
    defense:[15570,66951],vitality:[288,1238]}},
];
test("different documented Legendary weapons and shield agree with exact floor(4.3x)", () => {
  for(const sample of fixtures){
    for(const [field,[base,legendary]] of Object.entries(sample.fields)){
      assert.equal(projectClassicStat(base,"L"),legendary,
        sample.item + " " + field);
    }
  }
  const shield=getLegendaryResearchRows(data).find(x=>x.nameEn==="Guardian Sheath");
  assert.equal(shield.unchangedAtLegendary.magicDefense,198);
  assert.equal(shield.legendary.magicDefense,undefined);
});

test("Dell'arte's Ambition is known eligible but L is a prediction, not an invented source table", () => {
  const item=getLegendaryResearchRows(data).find(x=>x.nameEn==="Dell'arte's Ambition");
  assert.equal(item.legendaryObserved,null);
  assert.equal(item.legendaryBasis,"estimated");
  assert.equal(item.legendary.attackMin,20231);
  assert.equal(item.legendary.attackMax,25374);
  assert.equal(item.legendary.strength,1715);
  assert.equal(item.legendary.vitality,1715);
  // Published +3 row of 7528-9441 from 4705-5901 validates older model.
  assert.equal(projectClassicStat(4705,3),7528);
  assert.equal(projectClassicStat(5901,3),9441);
});

test("all public Legendary research facts require exact historical citation and scope", () => {
  const check=validateLegendaryResearch(data);
  assert.equal(check.ok,true,check.errors.join("; "));
  assert.equal(check.items.length,4);
  assert.deepEqual(check.items.map(x=>x.nameEn),
    ["Immortal Bow","Excalibur","Guardian Sheath","Dell'arte's Ambition"]);
  assert.equal(data.items.some(x=>"itemId" in x),false); // Registry ID is unknown.
});

test("research gate blocks fabricated L data, source tampering and extra records", () => {
  for(const mutate of [
    x=>{x.items[0].legendaryObserved.attackMin=5806;},
    x=>{x.items[1].legendaryObserved.vitality=1076;},
    x=>{x.items[2].unchangedAtLegendary.magicDefense=200.5;},
    x=>{x.items[3].legendaryObserved={attackMin:20231};},
    x=>{x.items[1].source.url="https://malicious.example/item";},
    x=>{x.items[1].source.url="file:///C:/private";},
    x=>{x.items[0].itemId="12345";},
    x=>{x.items[0].base.attackMin=-1;},
    x=>{x.items[0].legendaryEligible=false;},
    x=>{x.items.push(clone(x.items[0]));},
  ]){
    const candidate=clone(data);mutate(candidate);
    assert.equal(validateLegendaryResearch(candidate).ok,false);
  }
});

test("Legendary row must be explicitly enabled and always follows +10", () => {
  const observed=[{enchantLevel:0,attackMin:1350,attackMax:2750,dexterity:230}];
  const regular=getEnchantStatRows(observed,"wikidot-classic-v1");
  assert.equal(regular.length,11);
  assert.equal(regular.some(x=>x.enchantLevel==="L"),false);
  const enhanced=getEnchantStatRows(observed,"wikidot-classic-v1",LEGENDARY_PROJECTION_MODEL);
  assert.equal(enhanced.length,12);
  assert.equal(enhanced[10].enchantLevel,10);
  assert.equal(enhanced[11].enchantLevel,"L");
  assert.equal(enhanced[11].origin,"estimated");
  assert.equal(enhanced[11].attackMin,5805);
  assert.equal(enhanced[11].attackMax,11825);
  assert.equal(enhanced[11].dexterity,989);
});

test("reviewed historical L measurements override estimates and don't multiply fixed stats", () => {
  const observed=[
    {enchantLevel:0,defense:15570,vitality:288,magicDefense:198},
    {enchantLevel:"L",defense:66951,vitality:1238,magicDefense:198},
  ];
  const result=getEnchantStatRows(observed,"wikidot-classic-v1",LEGENDARY_PROJECTION_MODEL);
  assert.equal(result[11].origin,"observed");
  assert.equal(result[11].magicDefense,198);
  assert.equal(result[10].magicDefense,undefined);
  assert.equal(result[11].vitality,1238);
  assert.equal(result[11].defense,66951);
});

test("no Legendary estimate without a numeric +0 baseline, classic model, or verified eligibility", () => {
  const baseline=[{enchantLevel:0,attackMin:1350,attackMax:2750}];
  assert.throws(()=>getEnchantStatRows(baseline,null,LEGENDARY_PROJECTION_MODEL),RangeError);
  assert.throws(()=>getEnchantStatRows([], "wikidot-classic-v1",LEGENDARY_PROJECTION_MODEL),RangeError);
  assert.throws(()=>getEnchantStatRows(baseline, "wikidot-classic-v1","unknown-L"),RangeError);
  assert.throws(()=>projectClassicStat(2.5,"L"),RangeError);
  assert.throws(()=>projectClassicStat(-1,"L"),RangeError);
  assert.throws(()=>projectClassicStat(Number.MAX_SAFE_INTEGER,"L"),RangeError);
});

test("public editorial gate rejects Legendary rows on ordinary gear and undocumented L model", () => {
  assert.equal(validateReviewedProfiles(profiles,names).ok,true);
  for(const mutate of [
    x=>{x.records[0].stats.push({enchantLevel:"L",strength:21});},
    x=>{x.records[0].legendaryProjectionModel=LEGENDARY_PROJECTION_MODEL;},
    x=>{x.records[0].legendaryEligible=true;},
    x=>{x.records[0].evidence.legendary="community-reference";},
  ]){
    const candidate=clone(profiles);mutate(candidate);
    assert.equal(validateReviewedProfiles(candidate,names).ok,false);
  }
});

test("future reviewed L-eligible profile can opt in with source evidence",()=>{
  const example=clone(profiles);
  // This is synthetic data: eligibility is NOT claimed for Spirit Sword.
  example.records[0].legendaryEligible=true;
  example.records[0].legendaryProjectionModel=LEGENDARY_PROJECTION_MODEL;
  example.records[0].evidence.legendary="community-reference";
  const gate=validateReviewedProfiles(example,names);
  assert.equal(gate.ok,true,gate.errors.join("; "));
});
