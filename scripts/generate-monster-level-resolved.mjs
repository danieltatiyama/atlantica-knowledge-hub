#!/usr/bin/env node
/**
 * Build player-facing drop links using the selected GroupBands level bracket.
 * Original source data is immutable. Derived files are gitignored and
 * regenerated on every dev/build from the 53 SHA-approved original JSONs.
 *
 * Original reverse joins = 172,120 *all possible level bands*.
 * This stage resolves fixed-level rows and conditional main-level bands for confirmed adaptive creatures.
 * Original fixed-level snapshot had 23,905 rows at each recorded character
 * level. The 176 references whose character level is below the first BandKey
 * stay unresolved and are not falsely presented as actual drops.
 */
import {readFileSync,writeFileSync,mkdirSync,rmSync,renameSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {resolveClientCreatureDrops,resolvedReverseRowForDrop} from
  "../src/data/client-monster-drop-resolver.mjs";

const root=resolve(fileURLToPath(new URL("../",import.meta.url)));
const input=resolve(root,"public/data/client-monsters");
const itemRoot=resolve(root,"public/data/client-items");
const out=resolve(root,"public/data/client-monster-discovery");
const check=(yes,message)=>{if(!yes)throw Error(message);};
const load=file=>JSON.parse(readFileSync(file,"utf8"));
const original=path=>load(resolve(input,path));
const validPath=(p,part)=>new RegExp("^"+part+"/[0-9]{2}\\.json$").test(p);
const makePublicFile=(path,data)=>{
  mkdirSync(dirname(path),{recursive:true});
  const temp=path+".tmp-"+process.pid;
  try{writeFileSync(temp,JSON.stringify(data)+"\n","utf8");renameSync(temp,path);}
  finally{rmSync(temp,{force:true});}
};

export function createLevelResolvedDiscovery(clientRoot=itemRoot,monsterRoot=input){
  const originalManifest=load(resolve(monsterRoot,"manifest.json"));
  check(originalManifest.dataset==="all-client-monster-loot-original"&&
    originalManifest.snapshotId===1&&originalManifest.catalogMonsterIds===4351&&
    originalManifest.directSourceRows===9959&&
    originalManifest.groupReferenceRows===5784&&
    originalManifest.groupDropRows===3076&&
    originalManifest.groupBandRows===572&&
    originalManifest.groupSourceJoins===172120,
    "Original client source manifest snapshot is not approved");
  const m=originalManifest.files;
  check(m.index.length===3&&m.loot.length===9&&m.groups.length>=1,
    "Original creature source file set is incomplete");
  const chars=new Map();
  for(const file of m.index){
    check(/^index-[0-9]{2}\.json$/.test(file),"Unsafe client character index path");
    const s=load(resolve(monsterRoot,file));
    check(s.snapshotId===1&&s.schemaVersion==="1.0","Wrong character index snapshot");
    for(const row of s.rows){
      check(!chars.has(row[0]),"Repeated CharID in original index");
      chars.set(row[0],row);
    }
  }
  check(chars.size===4351,"Missing original characters");
  const loot=new Map();
  for(const file of m.loot){
    check(validPath(file,"loot"),"Unexpected original loot source shard");
    const s=load(resolve(monsterRoot,file));
    check(s.snapshotId===1&&s.schemaVersion==="1.0","Wrong loot shard");
    for(const [id,entry] of Object.entries(s.items)){
      check(!loot.has(id),"Repeated source creature loot");
      loot.set(id,entry);
    }
  }
  const groups={};
  for(const file of m.groups){
    check(validPath(file,"groups"),"Unexpected original group source shard");
    const s=load(resolve(monsterRoot,file));
    check(s.snapshotId===1&&s.schemaVersion==="1.0","Wrong group shard");
    for(const [id,entry] of Object.entries(s.items)){
      check(!Object.hasOwn(groups,id),"Repeated source GroupID");
      groups[id]=entry;
    }
  }
  check(Object.keys(groups).length===149,"Original group sources missing");
  const names=new Map(),allIds=new Set();
  const index=load(resolve(clientRoot,"manifest.json"));
  check(index.snapshotId===1&&index.totalIds===23586&&index.namedIds===22702,
    "Original client item catalog is incompatible");
  for(const file of index.indexShards){
    check(/^index-[0-9]{2}\.json$/.test(file),"Unexpected original ItemID index shard");
    const s=load(resolve(clientRoot,file));
    check(s.snapshotId===1&&s.schemaVersion==="1.0","Wrong item index");
    for(const row of s.rows){
      check(!allIds.has(row[0]),"Duplicate source ItemID");
      allIds.add(row[0]);
      if(row[6]==="named")names.set(row[0],row[1]);
    }
  }
  check(names.size===22702&&allIds.size===23586,"Original item registry incomplete");

  const items=new Map(),creatureCounts=[];
  let direct=0,groupRows=0,groupRefs=0,unresolved=0,unresolvedCreatures=0;
  const unresolvedDetails=[];
  for(const [charId,character] of chars){
    const source=loot.get(charId);
    if(!source){creatureCounts.push([charId,0,0]);continue;}
    groupRefs+=source.groups.length;
    const resolved=resolveClientCreatureDrops(character,source,groups);
    creatureCounts.push([charId,resolved.rows.length,resolved.unresolved.length]);
    if(resolved.unresolved.length){
      unresolved+=resolved.unresolved.length;unresolvedCreatures++;
      unresolvedDetails.push([charId,character[1],character[2],
        ...resolved.unresolved.map(x=>x.ref[1])]);
    }
    for(const row of resolved.rows){
      check(names.has(row.itemId),"Original item ID has no reconciled name");
      const outRow=resolvedReverseRowForDrop(charId,character[1],row);
      if(!items.has(row.itemId))items.set(row.itemId,{direct:[],group:[]});
      items.get(row.itemId)[row.kind].push(outRow);
      if(row.kind==="direct")direct++;else groupRows++;
    }
  }
  check(direct===9959&&groupRefs===5784&&unresolved===176&&
    groupRows===26201&&items.size===825&&creatureCounts.length===4351&&
    creatureCounts.reduce((sum,r)=>sum+r[1],0)===36160,
    "Client band inference diverged from audited original level snapshot");
  const rows=[];
  const buckets={};
  for(let b=0;b<30;b++)buckets[b]={};
  for(const [id,entry] of items){
    const bucket=Math.floor(Number(id)/1000);
    check(bucket>=0&&bucket<30,"Original ItemID outside manifest bucket ranges");
    buckets[bucket][id]=entry;
    rows.push([id,names.get(id),entry.direct.length,entry.group.length,
      new Set(entry.direct.map(r=>r[0])).size,
      new Set(entry.group.map(r=>r[0])).size]);
  }
  rows.sort((a,b)=>a[1].localeCompare(b[1],"en")||Number(a[0])-Number(b[0]));
  const files=Array.from({length:30},(_,n)=>
    "item-sources/"+String(n).padStart(2,"0")+".json");
  const discoveryManifest={
    schemaVersion:"1.0",snapshotId:1,
    dataset:"level-resolved-client-monster-loot",
    rule:"Fixed-level creatures: greatest BandKey <= recorded level. Confirmed main-level-scaled enemies: separate alternatives for every original band.",
    mainLevelScaledCreatureCount:41,
    originalCharacterIDs:chars.size,
    originalDirectRows:direct,
    originalGroupRefs:groupRefs,
    originalAllBandJoins:172120,
    levelMatchedGroupRows:groupRows,
    unmatchedLevelGroupRefs:unresolved,
    creaturesWithUnmatchedRefs:unresolvedCreatures,
    matchedItemIds:items.size,
    files:{itemSources:files,creatureCounts:"creature-counts.json"},
    notice:"Client-derived level-band inference calibrated against Huge Crocodile game screenshots; not independently verified for every creature. Composite percentage values are estimates, not guaranteed live-server odds.",
  };
  const lookup={
    schemaVersion:"1.0",snapshotId:1,
    dataset:"client-monster-drop-item-discovery",
    itemIds:rows.length,rawDirectSourceRows:direct,
    derivedGroupReferences:groupRows,
    unmatchedLevelGroupRefs:unresolved,
    originalAllBandJoins:172120,
    source:"audited-client-monster-loot + fixed creature bands or conditional main-level bands",
    notice:"Fixed-level and conditional main-level source candidates only. Percent estimates are inferred; do not confirm server availability or observed drop probabilities.",
    columns:["ItemID","EnglishName","DirectSourceRows","LevelMatchedGroupRows",
      "UniqueDirectCreatureIDs","UniqueGroupCreatureIDs"],
    rows,
  };
  return {manifest:discoveryManifest,index:lookup,items:buckets,
    creatureCounts,unresolvedDetails};
}

export function generateLevelResolvedDiscovery(){
  const data=createLevelResolvedDiscovery();
  makePublicFile(resolve(out,"manifest.json"),data.manifest);
  makePublicFile(resolve(out,"item-lookup.json"),data.index);
  makePublicFile(resolve(out,"creature-counts.json"),{
    schemaVersion:"1.0",snapshotId:1,
    dataset:"level-resolved-creature-drop-counts",
    count:data.creatureCounts.length,
    matchedDropRows:data.manifest.originalDirectRows+data.manifest.levelMatchedGroupRows,
    unresolvedRefs:data.manifest.unmatchedLevelGroupRefs,
    columns:["CharID","PossibleItemRows","UnresolvedGroupReferences"],
    rows:data.creatureCounts,
  });
  for(const file of data.manifest.files.itemSources){
    const bucket=Number(file.slice(-7,-5));
    makePublicFile(resolve(out,file),{
      schemaVersion:"1.0",snapshotId:1,
      dataset:"level-resolved-client-monster-loot",bucket,
      items:data.items[bucket],
    });
  }
  console.log("[IC] Verified inferred level-band discovery:",
    data.index.itemIds,"matched ItemIDs;",
    data.manifest.originalDirectRows,"direct rows;",
    data.manifest.levelMatchedGroupRows,"matched group rows;",
    data.manifest.unmatchedLevelGroupRefs,"unresolved group references.");
  return data;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{generateLevelResolvedDiscovery();}
  catch(e){console.error("[IC] Level-band source inference rejected:",e.message);process.exitCode=1;}
}
