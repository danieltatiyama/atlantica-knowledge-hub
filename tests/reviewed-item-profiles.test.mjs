import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadReviewedEquipmentNames } from "../scripts/read-reviewed-equipment-names.mjs";
import { validateReviewedProfiles } from "../src/data/reviewed-equipment-profiles-gate.mjs";
import { checkReviewedItemProfiles } from "../scripts/check-reviewed-item-profiles.mjs";

const names = loadReviewedEquipmentNames();
const profiles = JSON.parse(readFileSync(
  fileURLToPath(new URL("../src/data/reviewed-equipment-profiles.json", import.meta.url)), "utf8"
));
const clone = (value) => JSON.parse(JSON.stringify(value));
const verify = (value) => validateReviewedProfiles(value, names);

test("real reviewed profile passes explicit public gate", () => {
  const check = checkReviewedItemProfiles();
  assert.deepEqual(check.errors, []);
  assert.equal(check.ok, true);
  assert.equal(check.records.length, 7);
  assert.deepEqual(check.records.map(x => x.id), ["1","100","264","400","1400","1420","11245"]);
  assert.equal(check.records[0].nameEn, names["1"]);
});

test("Spirit Sword displays only screenshot-backed +0 stats and original class restrictions", () => {
  const sword = profiles.records[0];
  assert.equal(sword.id, "1");
  assert.equal(sword.nameEn, "Spirit Sword");
  assert.equal(sword.overview.typeEn, "Sword");
  assert.equal(sword.overview.minimumLevel, 1);
  assert.ok(sword.overview.eligibleClasses.includes("Swordsman"));
  assert.ok(sword.overview.eligibleClasses.includes("Natasha"));
  assert.ok(sword.overview.eligibleClasses.includes("Ari"));
  assert.deepEqual(sword.stats, [{
    enchantLevel: 0, attackMin: 60, attackMax: 90,
    strength: 5, vitality: 5,
  }]);
  assert.equal(sword.crafting.productionPerBatch, 1);
  assert.equal(sword.crafting.requiredWorkload, 450);
  assert.deepEqual(sword.crafting.requiredSkill, { nameEn: "Sword", level: 1 });
  assert.deepEqual(sword.crafting.materials, [
    { nameEn: "Copper Flakes", quantity: 5 },
    { nameEn: "Maple", quantity: 4 },
  ]);
  assert.equal(sword.evidence.stats, "ingame-screenshot");
  assert.equal(sword.evidence.crafting, "ingame-screenshot");
  assert.equal(sword.evidence.materials, "community-reference");
  assert.equal(sword.enchantmentProjectionModel, "wikidot-classic-v1");
  assert.equal(sword.evidence.projections, "community-reference");
  assert.equal(sword.evidence.references.length, 5);
});

test("community-backed Spirit Bow and Instrument are labeled as historical, not observed in-game", () => {
  for (const [id, type, base, urlSuffix] of [
    ["400","Bow",{attackMin:50,attackMax:100,dexterity:8},"item:spirit-bow"],
    ["1400","Instrument",{attackMin:40,attackMax:50,intelligence:16,vitality:6},"item:spirit-instrument"]
  ]) {
    const rec=profiles.records.find(x=>x.id===id);
    assert.equal(rec.nameEn,names[id]);
    assert.equal(rec.overview.typeEn,type);
    assert.deepEqual(rec.stats[0],{enchantLevel:0,...base});
    assert.equal(rec.evidence.stats,"community-reference");
    assert.equal(rec.evidence.overview,"community-reference");
    assert.equal(rec.evidence.crafting,"community-reference");
    assert.equal(rec.evidence.materials,"community-reference");
    assert.equal(rec.enchantmentProjectionModel,"wikidot-classic-v1");
    assert.ok(rec.evidence.references.some(ref=>ref.url?.endsWith(urlSuffix)));
  }
});

test("reject unknown IDs, overwritten published names and injected extra fields", () => {
  for (const mutate of [
    (x) => { x.records[0].id = "999999"; },
    (x) => { x.records[0].nameEn = "Secret Alternate Sword"; },
    (x) => { x.records[0].overview.typeEn = "<script>alert(1)</script>"; },
    (x) => { x.records[0].overview.eligibleClasses[0] = "Rogue\nNew Class"; },
    (x) => { x.records[0].recipe = "[[5100, 99]]"; },
    (x) => { x.records[0].enchantmentProjectionModel = "invented-unsupported"; },
    (x) => { x.records.push(clone(x.records[0])); },
    (x) => { x.privatePayload = "SECRET_CLIENT_DUMP"; },
    (x) => { x.records[0].crafting.materials[0].rawClientPath = "C:\\PRIVATE"; },
  ]) {
    const bad = clone(profiles);
    mutate(bad);
    assert.equal(verify(bad).ok, false);
  }
});

test("reject fabricated or malformed enchantments", () => {
  for (const mutate of [
    (x) => { x.records[0].stats.push(clone(x.records[0].stats[0])); },
    (x) => { x.records[0].stats[0].enchantLevel = 11; },
    (x) => { x.records[0].stats[0].attackMin = 999; },
    (x) => { x.records[0].stats[0].strength = "high"; },
    (x) => { x.records[0].stats[0].attackMax = null; },
    (x) => { x.records[0].stats[0].unverifiedCritical = 300; },
    (x) => { x.records[0].stats[0].recipe = "[[500,6]]"; },
  ]) {
    const bad = clone(profiles);
    mutate(bad);
    assert.equal(verify(bad).ok, false);
  }
});

test("reject unsourced gameplay or materials and unsafe community URLs", () => {
  for (const mutate of [
    (x) => { x.records[0].evidence.overview = "not-provided"; },
    (x) => { x.records[0].evidence.stats = "unverified"; },
    (x) => { x.records[0].evidence.crafting = "not-provided"; },
    (x) => { x.records[0].evidence.materials = "not-provided"; },
    (x) => { x.records[0].evidence.projections = "not-provided"; },
    (x) => { x.records[0].evidence.references = []; },
    (x) => { x.records[0].evidence.references[1].url = "file:///C:/private/secret.json"; },
    (x) => { x.records[0].evidence.references[1].url = "https://malicious.example/"; },
    (x) => { x.records[0].evidence.references[0].url = "file:///private/upload.png"; },
    (x) => { x.records[0].evidence.references[0].label = "/mnt/data/private-image.png"; },
    (x) => { x.records[0].crafting.materials[0].quantity = -5; },
  ]) {
    const bad = clone(profiles);
    mutate(bad);
    assert.equal(verify(bad).ok, false);
  }
});

test("allows future partial articles with missing unknown stats/crafting but explicit evidence", () => {
  const partial = clone(profiles);
  partial.records[0].stats = [];
  partial.records[0].enchantmentProjectionModel = null;
  partial.records[0].evidence.projections = "not-provided";
  partial.records[0].crafting = null;
  partial.records[0].evidence.stats = "not-provided";
  partial.records[0].evidence.crafting = "not-provided";
  partial.records[0].evidence.materials = "not-provided";
  assert.equal(verify(partial).ok, true, verify(partial).errors.join("; "));
});

test("public profile JSON does not embed image assets, Miner records or local paths", () => {
  const payload = JSON.stringify(profiles);
  for (const forbidden of [
    "ItemTypeSword.ndt", "catalog_items:snapshot", "C:\\", "/mnt/data/",
    "112473", "192767", "5100(5)", "6080(4)", "user-home",
  ]) {
    assert.equal(payload.includes(forbidden), false);
  }
});


test("four Wikidot-sourced complete articles reproduce independently checked historical +0..+10 rows",()=>{
  const multipliers=[10,12,14,16,18,21,24,28,32,36,40];
  const samples=[
    {id:"100",name:"Spirit Spear",kind:"Spear",level:1,work:450,skill:1,
      source:"item:spirit-spear",
      base:{attackMin:80,attackMax:110,strength:11,vitality:3},
      final:{attackMin:320,attackMax:440,strength:44,vitality:12},
      materialCount:2,classes:["Spearman","Trainee Chueh Shui"]},
    {id:"264",name:"Evil Staff",kind:"Staff",level:130,work:160000000,skill:110,
      source:"item:evil-staff",
      base:{attackMin:988,attackMax:1326,intelligence:392,vitality:148},
      final:{attackMin:3952,attackMax:5304,intelligence:1568,vitality:592},
      materialCount:10,classes:["Monk","Trainee Ching Ya"]},
    {id:"1420",name:"Phoenix's Instrument",kind:"Instrument",level:113,
      work:60000000,skill:85,source:"item:phoenix-s-instrument",
      base:{attackMin:634,attackMax:850,intelligence:252,vitality:95},
      final:{attackMin:2536,attackMax:3400,intelligence:1008,vitality:380},
      materialCount:9,classes:["Maestro","Trainee Chiu Hong"]},
    {id:"11245",name:"Pegasus Shield",kind:"Shield",level:140,
      work:60000000,skill:110,source:"item:pegasus-shield",
      base:{defense:9812,vitality:182},
      final:{defense:39248,vitality:728},
      materialCount:9,classes:["Swordsman","Knight (Merc)"]},
  ];
  let numericChecks=0;
  for(const entry of samples){
    const article=profiles.records.find(x=>x.id===entry.id);
    assert.ok(article);
    assert.equal(article.nameEn,names[entry.id]);
    assert.equal(article.nameEn,entry.name);
    assert.equal(article.overview.typeEn,entry.kind);
    assert.equal(article.overview.minimumLevel,entry.level);
    assert.equal(article.crafting.requiredWorkload,entry.work);
    assert.deepEqual(article.crafting.requiredSkill,{nameEn:entry.kind,level:entry.skill});
    assert.equal(article.crafting.materials.length,entry.materialCount);
    assert.equal(article.stats.length,11);
    assert.deepEqual(article.stats.map(x=>x.enchantLevel),[0,1,2,3,4,5,6,7,8,9,10]);
    assert.deepEqual(article.stats[0],{enchantLevel:0,...entry.base});
    assert.deepEqual(article.stats[10],{enchantLevel:10,...entry.final});
    for(const cls of entry.classes){
      assert.ok(article.overview.eligibleClasses.includes(cls),entry.name+" "+cls);
    }
    assert.equal(article.enchantmentProjectionModel,null); // Source rows, not extrapolated.
    assert.equal(article.legendaryEligible,false);
    assert.equal(article.legendaryProjectionModel,null);
    assert.equal(article.evidence.projections,"not-provided");
    assert.equal(article.evidence.legendary,"not-provided");
    for(const key of ["overview","stats","crafting","materials"]){
      assert.equal(article.evidence[key],"community-reference");
    }
    assert.equal(article.evidence.references.length,1);
    assert.equal(article.evidence.references[0].kind,"community-reference");
    assert.ok(article.evidence.references[0].url.endsWith(entry.source));
    for(const row of article.stats){
      for(const [stat,value] of Object.entries(row)){
        if(stat==="enchantLevel")continue;
        const expected=Math.floor(entry.base[stat]*multipliers[row.enchantLevel]/10);
        assert.equal(value,expected,entry.name+" +"+row.enchantLevel+" "+stat);
        numericChecks++;
      }
    }
  }
  assert.ok(numericChecks>=150,"broad numeric cross-check coverage across 4 item types");
});

test("historical Shield fixed Magic Defense and evasion are not invented as enchantment-scaled stats",()=>{
  const shield=profiles.records.find(x=>x.id==="11245");
  assert.ok(shield);
  assert.ok(shield.stats.every(row=>row.magicDefense===undefined));
  assert.ok(shield.stats.every(row=>row.attackMin===undefined));
  assert.ok(shield.stats.every(row=>row.attackMax===undefined));
  assert.equal(shield.legendaryEligible,false);
});
