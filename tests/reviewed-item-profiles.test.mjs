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
