#!/usr/bin/env node
/** Safely stage explicitly approved Miner metadata for a manual Wiki PR.

Usage:
  node scripts/promote-approved-equipment.mjs <private-approved-output.json>
  node scripts/promote-approved-equipment.mjs <private-approved-output.json> --write

Default is DRY-RUN. --write only edits the tracked reviewed-only JSON,
never commits/pushes/deploys. This step does not itself verify game truth.
*/
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadReviewedEquipmentNames } from "./read-reviewed-equipment-names.mjs";
import { validateDataset } from "./validate-game-dataset.mjs";
import { mergeCuratedEquipment } from "./merge-curated-equipment.mjs";

const DEST = fileURLToPath(new URL("../src/data/approved-equipment-metadata.json", import.meta.url));

function run(args) {
  const shouldWrite = args.includes("--write");
  const sources = args.filter((arg) => arg !== "--write");
  if (sources.length !== 1 || sources[0].startsWith("--") ||
      args.length !== (shouldWrite ? 2 : 1) ||
      args.filter((arg) => arg === "--write").length > 1) {
    throw new Error("Usage: node scripts/promote-approved-equipment.mjs <approved.json> [--write]");
  }
  const file = resolve(sources[0]);
  if (file === resolve(DEST)) throw new Error("Source and curated destination must differ");
  const incoming = JSON.parse(readFileSync(file, "utf8"));
  const existing = JSON.parse(readFileSync(DEST, "utf8"));
  const reviewedNames = loadReviewedEquipmentNames();
  const result = mergeCuratedEquipment(existing, incoming, reviewedNames);
  const generic = validateDataset(result.dataset, { publicMode: true });
  if (!generic.ok) throw new Error("Public dataset contract validation failed");
  if (shouldWrite) {
    writeFileSync(DEST, JSON.stringify(result.dataset, null, 2) + "\n", "utf8");
  }
  console.log("[IC] Previously curated entries: " + existing.records.length);
  console.log("[IC] Newly proposed entries: " + incoming.records.length);
  console.log("[IC] Additional approved entries: " + result.added);
  console.log("[IC] Unchanged entries: " + result.unchanged);
  console.log(shouldWrite
    ? "[IC] Local curated JSON updated. Review git diff and open a PR. No commit/deploy performed."
    : "[IC] DRY RUN ONLY. No files changed. Use --write after editorial review.");
}

try {
  run(process.argv.slice(2));
} catch (error) {
  // Never echo exceptions containing raw private file contents or local paths.
  console.error("[IC] ERROR: Promotion blocked. Check input, snapshot, IDs, provenance and field approvals.");
  process.exitCode = 1;
}
