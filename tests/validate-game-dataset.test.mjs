import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDataset } from "../scripts/validate-game-dataset.mjs";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/game-data-synthetic.json", import.meta.url), "utf8"),
);
const clone = () => structuredClone(fixture);

test("valid staging and public dataset", () => {
  assert.equal(validateDataset(fixture).ok, true);
  assert.equal(validateDataset(fixture, { publicMode: true }).ok, true);
});

test("duplicate IDs are rejected", () => {
  const dataset = clone();
  dataset.records.push(structuredClone(dataset.records[0]));
  assert.match(validateDataset(dataset).errors.join("\n"), /duplicate ID/);
});

test("unverified records are allowed in staging, blocked in public gate", () => {
  const dataset = clone();
  dataset.records[0].evidence.status = "Unverified";
  assert.equal(validateDataset(dataset).ok, true);
  assert.equal(validateDataset(dataset, { publicMode: true }).ok, false);
});

test("private records are blocked in public gate", () => {
  const dataset = clone();
  dataset.records[0].evidence.status = "Private";
  assert.equal(validateDataset(dataset, { publicMode: true }).ok, false);
});

test("absolute local source paths are rejected", () => {
  const dataset = clone();
  dataset.records[0].evidence.sources = ["C:\\Users\\Someone\\secret.ndt"];
  assert.equal(validateDataset(dataset).ok, false);
});

test("missing names are allowed without inventing translations", () => {
  const dataset = clone();
  dataset.records[0].names = {};
  assert.equal(validateDataset(dataset).ok, true);
});

test("incorrect schema versions are rejected", () => {
  const dataset = clone();
  dataset.schemaVersion = "0.7";
  assert.equal(validateDataset(dataset).ok, false);
});
