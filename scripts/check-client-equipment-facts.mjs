#!/usr/bin/env node
/** Validates only a strictly projected public CLIENT-SOURCE JSON.
 * Inputs are never interpreted as verified gameplay, live drop rates,
 * current equipment availability, or crafting guarantees.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "./read-reviewed-equipment-names.mjs";
import {validateClientEquipmentFacts} from "../src/data/client-equipment-facts-gate.mjs";

const defaultPath=fileURLToPath(new URL("../src/data/client-equipment-facts.json",import.meta.url));
export function checkClientFacts(path=defaultPath){
  return validateClientEquipmentFacts(
    JSON.parse(readFileSync(resolve(path),"utf8")),loadReviewedEquipmentNames()
  );
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length>3){
    console.error("[IC] Usage: node scripts/check-client-equipment-facts.mjs [CLIENT_FACTS.json]");
    process.exitCode=2;
  }else{
    try{
      const r=checkClientFacts(process.argv[2]??defaultPath);
      if(!r.ok){
        for(const e of r.errors)console.error("[IC] "+e);
        process.exitCode=1;
      }else{
        console.log("[IC] Source-bound client equipment facts:",r.records.length);
        console.log("[IC] Source files and recipe IDs validated; not verified gameplay stats.");
      }
    }catch{
      console.error("[IC] Invalid or inaccessible client source facts.");
      process.exitCode=1;
    }
  }
}
