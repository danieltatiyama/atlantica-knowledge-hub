#!/usr/bin/env node
/**
 * Build-time, public, source-checked CSV for 551 reviewed equipment items
 * and their +0..+10 model columns.
 *
 * +0: original Items.csv raw client baseline
 * +1..+10: historical computed model for whitelisted integer scalable stats
 * MagicDef, EV, MoveSpeed: exact unchanged client source values (including zero)
 * Missing or fractional unprojectable values: blank, never guessed.
 *
 * NO Legendary row, drop rates, raw unreviewed client records or binaries.
 */
import {mkdirSync,writeFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import items from "../src/data/client-item-attributes.json" with {type:"json"};
import {EQUIPMENT_ITEM_NAMES_EN} from "../src/data/equipment-item-names-en.ts";
import {assertClientItemAttributes}
  from "../src/data/client-item-attributes-gate.mjs";
import {withClientMovementSpeed} from "../src/data/client-movement-speed.mjs";
import {buildHistoricalClientProjection}
  from "../src/data/client-item-stat-summary.mjs";

export const GRADE_EXPORT_KEYS=Object.freeze([
  "MinDamage","MaxDamage","AC","Str","Dex","Vit","Mag",
  "MagicDef","EV","MoveSpeed",
]);
const MODEL="wikidot-classic-v1";
const HEADER=[
  "item_id","item_name_en","grade","snapshot_id",
  "original_source_rows",...GRADE_EXPORT_KEYS,
  "scalable_values_origin","fixed_values_origin","projection_model",
];

function csvCell(value){
  const str=String(value??"");
  return /[",\r\n]/.test(str)?'"'+str.replaceAll('"','""')+'"':str;
}

function toLine(values){
  return values.map(csvCell).join(",");
}

/** No I/O. Testable full-data generator with fail-closed identity checks. */
export function generateClientGradeCSV(originalDataset=items) {
  if(!originalDataset||originalDataset.snapshotId!==1||
     !Array.isArray(originalDataset.records)){
    throw new Error("CSV requires the original reviewed NA Miner snapshot 1");
  }
  const verified=assertClientItemAttributes(originalDataset,EQUIPMENT_ITEM_NAMES_EN);
  if(verified.length!==551)throw new Error("Unreviewed or missing equipment items");
  const enriched=withClientMovementSpeed(verified,originalDataset.snapshotId);
  const lines=[toLine(HEADER)];
  const seenIds=new Set();
  for(const item of enriched){
    if(seenIds.has(item.id))throw new Error("Duplicate item ID in equipment export");
    seenIds.add(item.id);
    const projection=buildHistoricalClientProjection(item);
    if(projection.rows.length!==11)throw new Error("Missing grade rows for "+item.id);
    const sources=item.sourceRows.map(x=>String(x.sourceRowNumber)).join(";");
    for(const row of projection.rows){
      if(!Number.isInteger(row.grade)||row.grade<0||row.grade>10)
        throw new Error("Unexpected/non-classic upgrade grade");
      lines.push(toLine([
        item.id,item.nameEn,"+"+row.grade,originalDataset.snapshotId,sources,
        ...GRADE_EXPORT_KEYS.map(key=>row.values[key]??""),
        row.grade===0?"client-raw-baseline":"historical-estimate",
        "game-client-extracted-unchanged",
        MODEL,
      ]));
    }
  }
  if(seenIds.size!==551||lines.length!==6062){
    throw new Error("Equipment CSV must have 551 items and 6061 data rows");
  }
  return lines.join("\n")+"\n";
}

const launchedAsScript=process.argv[1] &&
  resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(launchedAsScript){
  const defaultOutput=fileURLToPath(
    new URL("../public/data/client-equipment-grades.csv",import.meta.url));
  const path=resolve(process.argv[2]??defaultOutput);
  const allowed=resolve(defaultOutput);
  if(path!==allowed){
    console.error("[IC] CSV output must use the reviewed static public/data location.");
    process.exitCode=2;
  }else{
    try{
      const csv=generateClientGradeCSV();
      mkdirSync(dirname(path),{recursive:true});
      writeFileSync(path,csv,"utf8");
      console.log("[IC] Generated 551 items × 11 grades = 6,061 rows.");
      console.log("[IC] Source snapshot 1; fixed MagicDef/EV/MoveSpeed never scaled.");
      console.log("[IC] Grades +1..+10 marked historical estimates, no Legendary L.");
    }catch{
      console.error("[IC] Client grade CSV blocked by identity/source/model validation.");
      process.exitCode=1;
    }
  }
}
