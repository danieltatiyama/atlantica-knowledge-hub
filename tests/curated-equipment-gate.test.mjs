import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { validateDataset } from "../scripts/validate-game-dataset.mjs";
import { loadReviewedEquipmentNames } from "../scripts/read-reviewed-equipment-names.mjs";
import { validateCuratedEquipment, assertCuratedEquipment } from "../src/data/curated-equipment-gate.mjs";
import { mergeCuratedEquipment } from "../scripts/merge-curated-equipment.mjs";

const registry = loadReviewedEquipmentNames();
const empty = JSON.parse(
  readFileSync(fileURLToPath(new URL("../src/data/approved-equipment-metadata.json", import.meta.url)), "utf8")
);

function approved(id = "1", name = "Spirit Sword", sourceId = 112473) {
  return {
    id,
    names: { en: name },
    fields: { clientCategory: "Sword", clientLevelRaw: "1", clientGradeRaw: "NORMAL" },
    evidence: {
      status: "Extracted",
      sources: [
        "reviewed:src/data/equipment-item-names-en.ts",
        "catalog_items:snapshot=1:record=" + sourceId,
      ],
    },
  };
}
function dataset(records = [approved()], snapshot = 1) {
  return {
    schemaVersion: "1.0",
    dataset: "items",
    snapshot: {
      id: "miner-snapshot-" + snapshot + "-equipment-approved",
      game: "Atlantica Online Global",
      minerVersion: "unknown",
      exportedAt: "2026-11-22T19:45:00Z",
    },
    records,
  };
}

test("actual reviewed equipment registry contains exactly 551 unique public names", () => {
  assert.equal(Object.keys(registry).length, 551);
  assert.equal(registry["1"], "Spirit Sword");
  assert.equal(registry["192"], "Twilight Instrument");
  assert.equal(registry["650"], "Red Soul Robe");
});

test("empty tracked publication manifest is valid and discloses no client data", () => {
  const result = validateCuratedEquipment(empty, registry);
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.records.length, 0);
  assert.equal(validateDataset(empty, { publicMode: true }).ok, true);
});

test("explicitly approved existing English names with narrow client fields pass both gates", () => {
  const payload = dataset();
  const gate = validateCuratedEquipment(payload, registry);
  assert.deepEqual(gate.errors, []);
  assert.equal(gate.records.length, 1);
  assert.equal(validateDataset(payload, { publicMode: true }).ok, true);
});

test("reject any unreviewed or altered name and duplicate or unknown IDs", () => {
  const cases = [
    dataset([approved("1", "Altered label")]),
    dataset([approved("999999", "Made-up item")]),
    dataset([approved(), approved()]),
    dataset([{...approved(), id: 1}]),
    dataset([{...approved(), names: { en: "Spirit Sword", "pt-br": "Espada" }}]),
  ];
  for (const payload of cases) assert.equal(validateCuratedEquipment(payload, registry).ok, false);
});

test("reject private/gameplay payload fields, paths, and unauthorized evidence", () => {
  const cases = [
    dataset([{...approved(), fields: { ...approved().fields, recipe: [[5100, 5]] }}]),
    dataset([{...approved(), fields: { ...approved().fields, rate: 5000 }}]),
    dataset([{...approved(), fields: { ...approved().fields, work: 1000 }}]),
    dataset([{...approved(), fields: {} }]),
    dataset([{...approved(), fields: { clientCategory: "C:\\secret\\file.ndt" }}]),
    dataset([{...approved(), fields: { clientLevelRaw: "200; rm -rf" }}]),
    dataset([{...approved(), evidence: {status:"Verified", sources:approved().evidence.sources} }]),
    dataset([{...approved(), evidence: {status:"Extracted", sources:[
      "reviewed:src/data/equipment-item-names-en.ts", "C:\\private\\file.ndt"]}}]),
    dataset([{...approved(), extra: "unreviewed" }]),
    dataset([{...approved(), evidence: {...approved().evidence, extra: true} }]),
    dataset([{...approved(), evidence: {...approved().evidence, sources:[
      "reviewed:src/data/equipment-item-names-en.ts", "catalog_items:snapshot=2:record=123"]}}]),
    dataset([{...approved(), evidence: {...approved().evidence, sources:[
      "reviewed:src/data/equipment-item-names-en.ts", "catalog_items:snapshot=1:record=0"]}}]),
  ];
  for (const payload of cases) assert.equal(validateCuratedEquipment(payload, registry).ok, false);
});

test("reject malformed or unjustified metadata snapshots", () => {
  const cases = [
    dataset([approved()], 0),
    {...dataset(), snapshot:{...dataset().snapshot, game:"Other game"}},
    {...dataset(), snapshot:{...dataset().snapshot, exportedAt:"2026-11-22"}},
    {...dataset(), privatePayload:"SECRET"},
    {...dataset(), records:"not-an-array"},
    {...empty, snapshot:{...empty.snapshot, id:"miner-snapshot-1-equipment-approved"}},
    {...dataset(), records:[]},
  ];
  for (const payload of cases) assert.equal(validateCuratedEquipment(payload, registry).ok, false);
});

test("append-only merge promotes explicit new IDs without replacing existing ones", () => {
  const first = mergeCuratedEquipment(empty, dataset(), registry);
  assert.equal(first.added, 1);
  assert.equal(first.dataset.records.length, 1);
  assert.equal(first.dataset.records[0].id, "1");
  const repeat = mergeCuratedEquipment(first.dataset, dataset(), registry);
  assert.equal(repeat.added, 0);
  assert.equal(repeat.unchanged, 1);
  const second = mergeCuratedEquipment(first.dataset, dataset([
    approved("192", "Twilight Instrument", 113256),
  ]), registry);
  assert.equal(second.added, 1);
  assert.deepEqual(second.dataset.records.map(x=>x.id), ["1", "192"]);
  assert.equal(validateDataset(second.dataset, { publicMode: true }).ok, true);
  assert.equal(assertCuratedEquipment(second.dataset, registry).length, 2);
});

test("append-only merge forbids silent field changes, snapshot swaps and empty promotions", () => {
  const old = mergeCuratedEquipment(empty, dataset(), registry).dataset;
  assert.throws(()=>mergeCuratedEquipment(old, dataset([{
    ...approved(), fields: { clientCategory:"Weapon" },
  }]),registry), /manual PR/);
  assert.throws(()=>mergeCuratedEquipment(old, dataset([approved()], 2),registry), /snapshot differs/);
  assert.throws(()=>mergeCuratedEquipment(old, dataset([]),registry));
  assert.throws(()=>mergeCuratedEquipment(old, {...dataset(), records:[approved("3890", "Ring")]},registry));
});

test("every failure reports fixed diagnostics, never a client field payload", () => {
  const secret = "SECRET_LOCAL_CLIENT_RECIPE";
  const payload = dataset([{...approved(), fields: {recipe: secret}}]);
  const diagnostic = validateCuratedEquipment(payload, registry);
  assert.equal(diagnostic.ok, false);
  assert.equal(JSON.stringify(diagnostic.errors).includes(secret), false);
});
