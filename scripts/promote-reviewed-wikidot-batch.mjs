#!/usr/bin/env node
/** Apply a deliberately reviewed historical batch to the tracked JSON locally.

DRY RUN by default; --write only changes reviewed-equipment-profiles.json.
No commit, push, merge or deploy. Recomputes from original audit + explicit
approval manifest each time; does NOT trust an edited intermediate draft.
*/
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "./read-reviewed-equipment-names.mjs";
import {makeHistoricalDraft} from "./prepare-historical-item-profile-drafts.mjs";

const destination=fileURLToPath(
  new URL("../src/data/reviewed-equipment-profiles.json",import.meta.url)
);
const load=path=>JSON.parse(readFileSync(resolve(path),"utf8"));

export function preparePromotion(auditFile, approvalsFile) {
  if(resolve(auditFile)===resolve(approvalsFile) ||
      [resolve(auditFile),resolve(approvalsFile)].includes(resolve(destination))){
    throw new Error("Historical inputs cannot replace tracked article source");
  }
  return makeHistoricalDraft(
    load(destination),load(auditFile),load(approvalsFile),
    loadReviewedEquipmentNames()
  );
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const argv=process.argv.slice(2),write=argv.includes("--write");
  const args=argv.filter(a=>a!=="--write");
  if(args.length!==2 || argv.length!==(write?3:2)){
    console.error("[IC] Usage: node scripts/promote-reviewed-wikidot-batch.mjs <AUDIT.json> <APPROVALS.json> [--write]");
    process.exitCode=2;
  }else{
    try{
      const result=preparePromotion(args[0],args[1]);
      if(write){
        writeFileSync(destination,JSON.stringify(result.dataset,null,2)+"\n","utf8");
      }
      console.log("[IC] Existing approved articles:",result.existing);
      console.log("[IC] Explicitly approved NEW historical articles:",result.added);
      console.log(write
        ? "[IC] Tracked local article JSON updated. Run validation and review git diff. NO COMMIT OR DEPLOY."
        : "[IC] DRY RUN ONLY. No files changed. Review the historical source and approvals before --write.");
    }catch{
      console.error("[IC] Promotion BLOCKED: review evidence, source hash, duplicate IDs and schema.");
      process.exitCode=1;
    }
  }
}
