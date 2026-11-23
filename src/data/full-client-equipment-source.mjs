/**
 * Stage 20.37: 2,462 source-backed EQUIPMENT-LIKE item IDs, without changing
 * the separately reviewed 551 equipment names or gameplay article proofs.
 *
 * This module is BUILD-TIME ONLY. It reads the already published client
 * source index, original ItemType definitions and allowlisted Items.csv
 * numeric fields. It must never be imported from an Astro client script.
 */
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {summarizeRawNumericRows,comparableRawNumber}
  from "./full-client-stats-tools.mjs";

const ROOT=resolve(fileURLToPath(new URL("../../",import.meta.url)));
const SOURCE=resolve(ROOT,"public/data/client-items");
export const EQUIPMENT_LIKE_CLIENT_CATEGORIES=Object.freeze([
  "Weapon","Defence","Sword","Spear","Axe","Bow","Gun","Cannon",
  "Staff","Guitar","Saw","Whip","Shield","Orb","Armor","Pants",
  "Boots","Helmet","Glove","Ring","Accessories","Neck","EARRING","BRACELET",
]);
const CATEGORY_SET=new Set(EQUIPMENT_LIKE_CLIENT_CATEGORIES);
const INDEX_ID=/^[1-9][0-9]{0,12}$/;

const readJSON=path=>JSON.parse(readFileSync(path,"utf8"));
const indexManifest=readJSON(resolve(SOURCE,"manifest.json"));
if(indexManifest.schemaVersion!=="1.0"||
   indexManifest.snapshotId!==1||indexManifest.totalIds!==23586||
   indexManifest.namedIds!==22702||
   indexManifest.reviewedEquipmentIds!==551||
   indexManifest.detailBucketWidth!==1000)
  throw Error("Original client equipment index manifest changed unexpectedly");

const originalIndex=new Map();
for(const filename of indexManifest.indexShards){
  if(!/^index-[0-9]{2}\.json$/.test(filename))throw Error("Unsafe index shard");
  const shard=readJSON(resolve(SOURCE,filename));
  if(shard.schemaVersion!=="1.0"||shard.snapshotId!==1||!Array.isArray(shard.rows))
    throw Error("Unexpected item index shard");
  for(const row of shard.rows){
    if(!Array.isArray(row)||row.length!==9||
       typeof row[0]!=="string"||!INDEX_ID.test(row[0])||
       originalIndex.has(row[0]))throw Error("Invalid original item index row");
    originalIndex.set(row[0],row);
  }
}
if(originalIndex.size!==23586)throw Error("Incomplete full item index");

export const FULL_CLIENT_EQUIPMENT_CATALOG=Object.freeze(
  [...originalIndex.values()].filter(row=>
    row[6]==="named"&&CATEGORY_SET.has(row[2]??""))
  .map(row=>Object.freeze({
    id:row[0],
    nameEn:row[1],
    sourceCategory:row[2],
    rawLevel:row[3],
    rawGrade:row[4],
    sourceDefinitionCount:row[5],
    hasParsedMaterials:row[7]===1,
    reviewed:row[8]===1,
  }))
  .sort((a,b)=>a.nameEn.localeCompare(b.nameEn,"en")||
    Number(a.id)-Number(b.id))
);
const equipmentById=new Map(FULL_CLIENT_EQUIPMENT_CATALOG.map(x=>[x.id,x]));
if(FULL_CLIENT_EQUIPMENT_CATALOG.length!==2462||
   FULL_CLIENT_EQUIPMENT_CATALOG.filter(x=>x.reviewed).length!==551)
  throw Error("Unexpected original 2462 source equipment or 551 reviewed identities");

export const FULL_CLIENT_EQUIPMENT_COUNT=FULL_CLIENT_EQUIPMENT_CATALOG.length;
export const FULL_CLIENT_EQUIPMENT_REVIEWED_COUNT=551;
export const FULL_CLIENT_EQUIPMENT_NEW_COUNT=1911;
const originalDetailsCache=new Map(),numericStatsCache=new Map();
const numericManifest=readJSON(resolve(SOURCE,"stats/manifest.json"));
if(numericManifest.snapshotId!==1||numericManifest.itemIds!==7560||
   numericManifest.sourceRows!==9351||!Array.isArray(numericManifest.files))
  throw Error("Unexpected published original numeric stats");

function bucketSource(id,directory,cache,manifestCheck){
  const bucket=Math.floor(Number(id)/1000);
  if(!cache.has(bucket)){
    const filename=String(bucket).padStart(2,"0")+".json";
    if(manifestCheck&&!numericManifest.files.includes(filename))return null;
    const shard=readJSON(resolve(SOURCE,directory,filename));
    if(shard.schemaVersion!=="1.0"||
      shard.snapshotId!==1||shard.bucket!==bucket||!shard.items)
      throw Error("Original source shard snapshot mismatch");
    cache.set(bucket,shard.items);
  }
  return cache.get(bucket)[String(id)]??null;
}

export function isClientEquipmentSourceId(id){
  return equipmentById.has(String(id));
}
export function getClientEquipmentSourceById(id){
  return equipmentById.get(String(id))??null;
}
export function getSourceItemLink(id,prefix=""){
  return isClientEquipmentSourceId(id)
    ?prefix+"/items/"+encodeURIComponent(String(id))+"/"
    :prefix+"/items/database/?id="+encodeURIComponent(String(id));
}
export function getClientEquipmentSourceProfile(id){
  const item=getClientEquipmentSourceById(id);
  if(!item)return null;
  const detail=bucketSource(item.id,"details",originalDetailsCache,false);
  if(!detail||!Array.isArray(detail.s)||!Array.isArray(detail.v)||
    detail.s.length!==item.sourceDefinitionCount)
    throw Error("Equipment source detail is missing or incomplete: "+item.id);
  const rawStats=bucketSource(item.id,"stats",numericStatsCache,true);
  const summary=rawStats?summarizeRawNumericRows(rawStats):null;
  return {item,detail,rawStats,summary};
}
export function getClientEquipmentBaseStat(id,key){
  const profile=getClientEquipmentSourceProfile(id);
  return profile?.summary?comparableRawNumber(profile.summary,key):null;
}
