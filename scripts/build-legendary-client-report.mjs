#!/usr/bin/env node
/** Private local-only Legendary identity report from the full client index.
 * Nothing gets written into src/data or the static Wiki.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve,basename} from "node:path";
import {fileURLToPath} from "node:url";
import legends from "../src/data/legendary-eligibility-reference.json" with {type:"json"};
import {reconcileLegendaryAgainstClient} from "./reconcile-legendary-client.mjs";

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);
  if(args.length!==3||args[1]!=="--output"){
    console.error("[IC] Usage: node scripts/build-legendary-client-report.mjs PRIVATE_CLIENT_FACTS.json --output Miner_Legendary_Client_20_24.json");
    process.exitCode=2;
  }else{
    try{
      const input=resolve(args[0]),output=resolve(args[2]);
      if(input===output||!/^Miner_Legendary_Client_[A-Za-z0-9_-]+\.json$/.test(basename(output))){
        throw new Error("Refusing to overwrite the input or a non-private output path");
      }
      const source=JSON.parse(readFileSync(input,"utf8"));
      const report=reconcileLegendaryAgainstClient(source,legends);
      writeFileSync(output,JSON.stringify(report,null,2)+"\n","utf8");
      console.log("[IC] Legendary reference entries:",report.summary.referenceEntries);
      console.log("[IC] Unique CLIENT NAME candidates:",report.summary.uniqueClientNameCandidates);
      console.log("[IC] Ambiguous identities:",report.summary.ambiguousClientIdentities);
      console.log("[IC] Not found by name:",report.summary.missingClientNameMatches);
      console.log("[IC] All results PRIVATE; no official item ID or L availability asserted.");
    }catch{
      console.error("[IC] Legend-to-client matching report blocked: invalid/private input or identity contract.");
      process.exitCode=1;
    }
  }
}
