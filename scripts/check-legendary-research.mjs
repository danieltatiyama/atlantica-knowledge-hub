#!/usr/bin/env node
/** Verify the source-bound Legendary research example dataset before publishing. */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {validateLegendaryResearch} from "../src/data/legendary-enhancement-research.mjs";

const defaultFile = fileURLToPath(new URL("../src/data/legendary-enhancement-research.json", import.meta.url));

export function checkLegendaryResearch(path=defaultFile){
  const data=JSON.parse(readFileSync(resolve(path),"utf8"));
  return validateLegendaryResearch(data);
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length>3){
    console.error("[IC] Usage: node scripts/check-legendary-research.mjs [historical-data.json]");
    process.exitCode=2;
  }else{
    try{
      const result=checkLegendaryResearch(process.argv[2]||defaultFile);
      if(!result.ok){
        for(const issue of result.errors)console.error("[IC] "+issue);
        process.exitCode=1;
      }else{
        console.log("[IC] Historical Legendary examples validated: "+result.items.length);
        console.log("[IC] L-source and projection evidence distinguished; no real client item IDs inferred.");
      }
    }catch{
      console.error("[IC] Historical Legendary research dataset could not be validated.");
      process.exitCode=1;
    }
  }
}
