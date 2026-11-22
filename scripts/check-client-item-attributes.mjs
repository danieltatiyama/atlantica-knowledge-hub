#!/usr/bin/env node
/** Validate only the public candidate from raw Items.csv; no stat inference. */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "./read-reviewed-equipment-names.mjs";
import {validateClientItemAttributes} from "../src/data/client-item-attributes-gate.mjs";

const defaultFile=fileURLToPath(new URL("../src/data/client-item-attributes.json",import.meta.url));
export function verifyClientAttributes(file=defaultFile){
  const data=JSON.parse(readFileSync(resolve(file),"utf8"));
  return validateClientItemAttributes(data,loadReviewedEquipmentNames());
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length>3){
    console.error("[IC] Usage: node scripts/check-client-item-attributes.mjs [PUBLIC_CANDIDATE.json]");
    process.exitCode=2;
  }else{
    try{
      const checked=verifyClientAttributes(process.argv[2]??defaultFile);
      if(!checked.ok){
        checked.errors.forEach(()=>console.error("[IC] Invalid client attribute source field"));
        process.exitCode=1;
      }else{
        console.log("[IC] Reviewed item IDs with raw Items.csv attributes:",checked.records.length);
        console.log("[IC] Values are client source strings, NOT verified tooltip stats or L projections.");
      }
    }catch{
      console.error("[IC] Failed to parse or validate client attributes.");
      process.exitCode=1;
    }
  }
}
