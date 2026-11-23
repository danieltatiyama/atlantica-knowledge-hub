#!/usr/bin/env node
/** Read only the approved input and derived snapshots; write an audit artifact. */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {inspectSourceQuality} from "../src/data/wiki-source-audit.mjs";
const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const read=path=>JSON.parse(readFileSync(resolve(root,path),"utf8"));
export function generateSourceAudit(){
  const monsterRoot="public/data/client-monsters/";
  const discoverRoot="public/data/client-monster-discovery/";
  const data={
    itemManifest:read("public/data/client-items/manifest.json"),
    monsterManifest:read(monsterRoot+"manifest.json"),
    discoveryManifest:read(discoverRoot+"manifest.json"),
    itemLookup:read(discoverRoot+"item-lookup.json"),
    creatureCounts:read(discoverRoot+"creature-counts.json"),
    craftManifest:read("public/data/client-items/crafting/manifest.json"),
  };
  const paths=data.discoveryManifest.files.itemSources;
  if(!Array.isArray(paths)||paths.length!==30||
     !paths.every((name,i)=>name==="item-sources/"+String(i).padStart(2,"0")+".json"))
    throw Error("Audit rejected unexpected reverse source paths");
  data.reverseShards=paths.map(path=>read(discoverRoot+path));
  const report=inspectSourceQuality(data);
  const file=resolve(root,"public/data/audits/source-quality.json");
  mkdirSync(dirname(file),{recursive:true});
  writeFileSync(file,JSON.stringify(report)+"\n","utf8");
  console.log("[IC] Source quality audit:",report.status,
    report.monsters.matchedItemIds,"matched item IDs,",
    report.monsters.unresolvedGroupReferences,"unresolved groups");
  return report;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{generateSourceAudit();}catch(e){
    console.error("[IC] Source audit failed:",e.message);process.exitCode=1;
  }
}
