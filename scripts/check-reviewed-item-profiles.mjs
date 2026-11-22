#!/usr/bin/env node
/** Validate editorially reviewed public item profiles before Astro deploy. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { loadReviewedEquipmentNames } from "./read-reviewed-equipment-names.mjs";
import { validateReviewedProfiles } from "../src/data/reviewed-equipment-profiles-gate.mjs";

const defaultPath = fileURLToPath(new URL("../src/data/reviewed-equipment-profiles.json", import.meta.url));

export function checkReviewedItemProfiles(path = defaultPath) {
  const input = JSON.parse(readFileSync(resolve(path), "utf8"));
  const names = loadReviewedEquipmentNames();
  return validateReviewedProfiles(input, names);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) {
    console.error("[IC] Usage: node scripts/check-reviewed-item-profiles.mjs [profiles.json]");
    process.exitCode = 2;
  } else {
    try {
      const report = checkReviewedItemProfiles(process.argv[2] || defaultPath);
      if (!report.ok) {
        for (const issue of report.errors) console.error("[IC] " + issue);
        process.exitCode = 1;
      } else {
        console.log("[IC] Reviewed item articles validated: " + report.records.length);
        console.log("[IC] All fields have section-level provenance. No files modified.");
      }
    } catch {
      console.error("[IC] Reviewed item profiles failed validation or could not be read.");
      process.exitCode = 1;
    }
  }
}
