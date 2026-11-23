#!/usr/bin/env node
/**
 * Stage 20.41: derive a SMALL item-by-name discovery index from the exact
 * source-audited monster loot and client item ID registries.
 *
 * DO NOT rewrite or interpret original source rows. Output is an untrusted
 * client-source discovery aid, not a probability model.
 */
import {readFileSync,writeFileSync,mkdirSync,renameSync,rmSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const client=resolve(root,"public/data/client-items");
const monsters=resolve(root,"public/data/client-monsters");
const destination=resolve(monsters,"item-lookup.json");
const ID=/^[1-9][0-9]{0,12}$/;
const parse=path=>JSON.parse(readFileSync(path,"utf8"));
const check=(v,message)=>{if(!v)throw Error(message);};
const intId=(id)=>{check(typeof id==="string"&&ID.test(id),"Unsafe source ID");return Number(id)};

export function createMonsterItemDiscovery(itemRoot=client,monsterRoot=monsters){
  const index= parse(resolve(itemRoot,"manifest.json"));
  check(index.schemaVersion==="1.0"&&index.snapshotId===1&&
    index.totalIds===23586&&index.namedIds===22702&&
    Array.isArray(index.indexShards)&&index.indexShards.length===6,
    "Unexpected original all-client item index");
  const names=new Map(),allIds=new Set();
  for(const file of index.indexShards){
    check(/^index-[0-9]{2}\.json$/.test(file),"Unsafe original item index shard");
    const shard=parse(resolve(itemRoot,file));
    check(shard.schemaVersion==="1.0"&&shard.snapshotId===1&&
      Array.isArray(shard.rows),"Original item index snapshot changed");
    for(const row of shard.rows){
      check(Array.isArray(row)&&row.length===9,"Unknown item index row");
      const id=row[0];intId(id);
      check(!allIds.has(id),"Repeated original item index ID");
      allIds.add(id);
      if(row[6]==="named"){
        check(typeof row[1]==="string"&&row[1].length>0,
          "Unreconciled item name");
        names.set(id,row[1]);
      }
    }
  }
  check(allIds.size===23586&&names.size===22702,
    "All-item source names are incomplete");
  const original=parse(resolve(monsterRoot,"manifest.json"));
  check(original.schemaVersion==="1.0"&&original.snapshotId===1&&
    original.dataset==="all-client-monster-loot-original"&&
    original.catalogMonsterIds===4351&&original.directSourceRows===9959&&
    original.groupReferenceRows===5784&&original.groupDropRows===3076&&
    original.groupBandRows===572&&original.groupSourceJoins===172120&&
    original.reverseItemIds===893&&
    Array.isArray(original.files?.itemSources)&&
    original.files.itemSources.length===30,
    "Original audited monster-drop source manifest changed");
  const seen=new Set(),rows=[];
  let totalDirect=0,totalGroup=0,otherIdentity=0;
  for(const file of original.files.itemSources){
    check(/^item-sources\/[0-9]{2}\.json$/.test(file),
      "Unexpected source shard name");
    const shard=parse(resolve(monsterRoot,file));
    check(shard.schemaVersion==="1.0"&&shard.snapshotId===1&&
      Number.isInteger(shard.bucket)&&shard.items&&
      typeof shard.items==="object"&&!Array.isArray(shard.items),
      "Original item loot shard changed");
    for(const [id,refs] of Object.entries(shard.items)){
      check(Number.isSafeInteger(intId(id))&&
        Math.floor(Number(id)/1000)===shard.bucket&&!seen.has(id),
        "Original ItemID missing/duplicated/misbucketed");
      seen.add(id);
      const name=names.get(id);
      if(!name){otherIdentity++;continue;}
      check(refs&&typeof refs==="object"&&
        Array.isArray(refs.direct)&&Array.isArray(refs.group),
        "Original reverse drop rows are malformed");
      const directCreatures=new Set(),groupCreatures=new Set();
      for(const row of refs.direct){
        check(Array.isArray(row)&&row.length===7,"Invalid direct source row");
        intId(row[0]);directCreatures.add(row[0]);
      }
      for(const row of refs.group){
        check(Array.isArray(row)&&row.length===11,
          "Invalid derived group source row");
        intId(row[0]);groupCreatures.add(row[0]);
      }
      totalDirect+=refs.direct.length;totalGroup+=refs.group.length;
      rows.push([
        id,name,refs.direct.length,refs.group.length,
        directCreatures.size,groupCreatures.size,
      ]);
    }
  }
  check(seen.size===original.reverseItemIds&&otherIdentity===0,
    "Unreconciled ItemIDs cannot be automatically named");
  check(totalDirect===original.directSourceRows&&
    totalGroup===original.groupSourceJoins,
    "Derived drop coverage does not match original audited snapshot");
  rows.sort((a,b)=>a[1].localeCompare(b[1],"en")||intId(a[0])-intId(b[0]));
  return {
    schemaVersion:"1.0",
    dataset:"client-monster-drop-item-discovery",
    snapshotId:1,
    itemIds:rows.length,
    rawDirectSourceRows:totalDirect,
    derivedGroupReferences:totalGroup,
    source:"audited-client-monster-loot + original all-client item identities",
    notice:"Original client-source records only. RawRate and derived group links do not confirm server availability or observed drop percentages.",
    columns:["ItemID","EnglishName","DirectSourceRows","DerivedGroupReferences",
      "UniqueDirectCreatureIDs","UniqueGroupCreatureIDs"],
    rows,
  };
}

export function generateMonsterItemDiscovery(file=destination){
  const data=createMonsterItemDiscovery();
  mkdirSync(dirname(file),{recursive:true});
  const temp=file+".tmp-"+process.pid;
  try{
    writeFileSync(temp,JSON.stringify(data)+"\n","utf8");
    renameSync(temp,file);
  }finally{
    rmSync(temp,{force:true});
  }
  return data;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const data=generateMonsterItemDiscovery();
    console.log("[IC] Monster item discovery:",data.itemIds,
      "original item IDs,",data.rawDirectSourceRows,"direct source rows,",
      data.derivedGroupReferences,"derived group links; no drop odds inferred.");
  }catch(error){
    console.error("[IC] Monster item discovery rejected:",error.message);
    process.exitCode=1;
  }
}
