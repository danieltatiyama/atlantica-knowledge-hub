#!/usr/bin/env node
/** Stage 20.16: generate a PRIVATE progress/review queue for all public items.

Default: aggregate report on stdout, no writes.
Optional --output writes the local queue (never public/committed).
Optional --groups loads an existing PRIVATE Stage 20.11 source-class report.
No requests, scraping, SQLite writes, frontend modifications or approval.
*/
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "./read-reviewed-equipment-names.mjs";
import {buildArticleReviewQueue} from "./item-article-review-queue.mjs";

const sourceProfiles=JSON.parse(readFileSync(fileURLToPath(
  new URL("../src/data/reviewed-equipment-profiles.json",import.meta.url)),"utf8"));
const sourceCurated=JSON.parse(readFileSync(fileURLToPath(
  new URL("../src/data/approved-equipment-metadata.json",import.meta.url)),"utf8"));
const sourceExtended=JSON.parse(readFileSync(fileURLToPath(
  new URL("../src/data/extended-equipment-facts.json",import.meta.url)),"utf8"));

export function runReviewQueue(options={}) {
  const groups=options.groups?JSON.parse(readFileSync(resolve(options.groups),"utf8")):null;
  const queue=buildArticleReviewQueue(
    loadReviewedEquipmentNames(),sourceProfiles,sourceCurated,sourceExtended,groups);
  if(options.output){
    writeFileSync(resolve(options.output),JSON.stringify(queue,null,2)+"\n","utf8");
  }
  return queue;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=process.argv.slice(2);
    let output=null,groups=null;
    while(args.length){
      const option=args.shift();
      if(option==="--output" && args[0])output=args.shift();
      else if(option==="--groups" && args[0])groups=args.shift();
      else throw new Error("Usage: node scripts/build-item-article-review-queue.mjs [--output PRIVATE.json] [--groups PRIVATE20.11.json]");
    }
    if(output && groups && resolve(output)===resolve(groups)){
      throw new Error("Output file cannot replace the private source-group input");
    }
    const queue=runReviewQueue({output,groups});
    const s=queue.report;
    console.log("[IC] Existing reviewed equipment IDs: "+s.publicReviewedItems);
    console.log("[IC] Full editorial profile coverage: "+s.editorialFullProfiles);
    console.log("[IC] Not yet fully documented: "+s.editorialIncompleteProfiles);
    console.log("[IC] Extended research profiles without an ID: "+s.reviewedResearchItemsWithoutCatalogId);
    for(const [field,count] of Object.entries(s.fieldCoverage)){
      console.log("[IC] "+field+": "+count+"/"+s.publicReviewedItems);
    }
    console.log(output
      ? "[IC] PRIVATE review queue written. Do not commit or publish the queue."
      : "[IC] SUMMARY ONLY. No files were written.");
  }catch(e){
    console.error("[IC] ERROR: Coverage queue failed validation or input access.");
    process.exitCode=1;
  }
}
