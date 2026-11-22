#!/usr/bin/env node
/** Validate approved-only equipment manifest against the real 551-name registry. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadReviewedEquipmentNames } from "./read-reviewed-equipment-names.mjs";
import { validateDataset } from "./validate-game-dataset.mjs";
import { validateCuratedEquipment } from "../src/data/curated-equipment-gate.mjs";

const DEFAULT_FILE = fileURLToPath(
  new URL("../src/data/approved-equipment-metadata.json", import.meta.url)
);

export function checkCuratedFile(path = DEFAULT_FILE) {
  const payload = JSON.parse(readFileSync(resolve(path), "utf8"));
  const dictionary = loadReviewedEquipmentNames();
  const generic = validateDataset(payload, { publicMode: true });
  const curated = validateCuratedEquipment(payload, dictionary);
  return { ok: generic.ok && curated.ok, generic, curated, approvedCount: curated.records.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) {
    console.error("[IC] Usage: node scripts/check-curated-equipment.mjs [manifest.json]");
    process.exitCode = 2;
  } else {
    try {
      const result = checkCuratedFile(process.argv[2] || DEFAULT_FILE);
      if (!result.ok) {
        console.error("[IC] Curated equipment safety gate failed.");
        for (const issue of result.curated.errors) console.error("[IC] " + issue);
        console.error("[IC] Generic dataset errors: " + result.generic.errors.length);
        process.exitCode = 1;
      } else {
        console.log("[IC] Reviewed equipment manifest validated.");
        console.log("[IC] Approved records: " + result.approvedCount);
        console.log("[IC] No files modified.");
      }
    } catch (error) {
      console.error("[IC] ERROR: curated validation could not complete.");
      process.exitCode = 1;
    }
  }
}
