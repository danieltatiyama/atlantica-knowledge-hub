#!/usr/bin/env node
/** Compile deliberately reviewed historical batches into a local draft.

Usage:
  node scripts/build-historical-item-profile-draft.mjs \
    <PRIVATE_20_17_AUDIT.json> <PRIVATE_20_18_APPROVALS.json> \
    --output Miner_Wikidot_Draft_20_18.json

The output NEVER replaces tracked source data; copy it into a dedicated
Git PR only after reviewing the full diff and the source/license context.
*/
import {readFileSync,writeFileSync} from "node:fs";
import {resolve, basename, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "./read-reviewed-equipment-names.mjs";
import {makeHistoricalDraft} from "./prepare-historical-item-profile-drafts.mjs";

const publicFile = fileURLToPath(
  new URL("../src/data/reviewed-equipment-profiles.json",import.meta.url)
);
const publicDirectory = resolve(publicFile,"..");
const readJson=path=>JSON.parse(readFileSync(resolve(path),"utf8"));

export function compileLocalDraft(auditPath,approvalPath,outPath) {
  const dest=resolve(outPath);
  const inputs=[resolve(auditPath),resolve(approvalPath),resolve(publicFile)];
  if(inputs.includes(dest) ||
      dest.startsWith(publicDirectory+sep) ||
      !/^Miner_Wikidot_Draft_[A-Za-z0-9_-]+\.json$/.test(basename(dest))) {
    throw new Error("Output must be a private Miner_Wikidot_Draft_*.json outside src/data");
  }
  const result=makeHistoricalDraft(
    readJson(publicFile),readJson(auditPath),readJson(approvalPath),
    loadReviewedEquipmentNames()
  );
  writeFileSync(dest,JSON.stringify(result.dataset,null,2)+"\n","utf8");
  return {added:result.added,existing:result.existing};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  const usage="[IC] Usage: node scripts/build-historical-item-profile-draft.mjs <AUDIT.json> <APPROVALS.json> --output Miner_Wikidot_Draft_20_18.json";
  if(args.length!==4 || args[2]!=="--output"){
    console.error(usage);
    process.exitCode=2;
  }else{
    try{
      const result=compileLocalDraft(args[0],args[1],args[3]);
      console.log("[IC] Existing public reviewed item articles:",result.existing);
      console.log("[IC] Approved NEW historical articles in PRIVATE draft:",result.added);
      console.log("[IC] No tracked files changed; no commit or public deploy.");
      console.log("[IC] Verify this draft with: node scripts/check-reviewed-item-profiles.mjs <DRAFT.json>");
    }catch{
      console.error("[IC] Historical article draft blocked. Check selected grades, source hashes, IDs and editorial gate.");
      process.exitCode=1;
    }
  }
}
