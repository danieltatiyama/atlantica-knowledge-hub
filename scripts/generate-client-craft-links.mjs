#!/usr/bin/env node
/**
 * Stage 20.36: build a read-only inverse "Used in Crafting" graph from the
 * 30 already published item-definition shards. No private Miner tables or
 * unverified drop sources are imported here.
 *
 * Source file rows are NOT gameplay variants. We group only identical
 * item ID/quantity recipe material lists and retain their source row IDs.
 */
import {readFileSync,writeFileSync,mkdirSync,readdirSync,rmSync,renameSync} from "node:fs";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(fileURLToPath(new URL("../",import.meta.url)));
const SOURCE=resolve(ROOT,"public/data/client-items");
const DEST=resolve(SOURCE,"crafting");
const ID=/^[1-9][0-9]{0,12}$/;
const readJSON=file=>JSON.parse(readFileSync(file,"utf8"));
const compact=data=>JSON.stringify(data)+"\n";

function assert(ok,why){if(!ok)throw Error(why);}
function sortIds(a,b){const aa=BigInt(a),bb=BigInt(b);return aa<bb?-1:aa>bb?1:0;}
function canonicalIngredients(pairs){
  assert(Array.isArray(pairs)&&pairs.length>0,"Expected positive source ingredient list");
  const seen=new Set();
  return pairs.map(pair=>{
    assert(Array.isArray(pair)&&pair.length===2&&typeof pair[0]==="string"&&
      ID.test(pair[0])&&Number.isSafeInteger(pair[1])&&pair[1]>0&&
      !seen.has(pair[0]),"Invalid/duplicated material reference");
    seen.add(pair[0]);return pair;
  }).sort((a,b)=>sortIds(a[0],b[0]));
}

export function buildCraftLinks(source=SOURCE){
  const sourceManifest=readJSON(resolve(source,"manifest.json"));
  assert(sourceManifest.schemaVersion==="1.0"&&
    sourceManifest.snapshotId===1&&sourceManifest.totalIds===23586&&
    sourceManifest.namedIds===22702&&sourceManifest.reviewedEquipmentIds===551&&
    sourceManifest.detailBucketWidth===1000,"Unexpected client index manifest");
  const names=new Map();
  const knownIds=new Set();
  for(const file of sourceManifest.indexShards){
    assert(/^index-[0-9]{2}\.json$/.test(file),"Unsafe index shard name");
    const shard=readJSON(resolve(source,file));
    assert(shard.snapshotId===1&&shard.schemaVersion==="1.0","Index snapshot mismatch");
    for(const row of shard.rows){
      assert(Array.isArray(row)&&row.length===9&&typeof row[0]==="string"&&
        ID.test(row[0])&&!knownIds.has(row[0]),"Duplicate/invalid index ID");
      knownIds.add(row[0]);
      if(row[6]==="named"){
        assert(typeof row[1]==="string"&&row[1].length>0,"Missing named identity");
        names.set(row[0],row[1]);
      }
    }
  }
  assert(knownIds.size===23586&&names.size===22702,"Incomplete original item index");
  const backlinks=new Map(),sourceSeen=new Set();
  let namedDefinitions=0,materialObservations=0,recipeProducts=0;
  for(let bucket=0;bucket<30;bucket++){
    const detail=readJSON(resolve(source,"details",String(bucket).padStart(2,"0")+".json"));
    assert(detail.schemaVersion==="1.0"&&detail.snapshotId===1&&detail.bucket===bucket,
      "Original detail bucket mismatch");
    for(const [productId,obj] of Object.entries(detail.items)){
      assert(names.has(productId)&&Math.floor(Number(productId)/1000)===bucket,
        "Product identity did not reconcile against index");
      const groups=new Map(),sourceRows=new Set();
      assert(Array.isArray(obj.s)&&obj.s.length>0,"Missing original source definitions");
      for(const def of obj.s){
        assert(Array.isArray(def)&&def.length===10&&
          Number.isSafeInteger(def[0])&&def[0]>0&&!sourceSeen.has(def[0]),
          "Invalid or duplicate source definition");
        sourceSeen.add(def[0]);sourceRows.add(def[0]);namedDefinitions++;
        const state=def[8],pairs=def[9];
        assert(["parsed-client-material","parsed-client-recipe","none","unsupported"].includes(state),
          "Unknown material parsing status");
        assert(Array.isArray(pairs),"Unexpected materials format");
        if(!state.startsWith("parsed-")){
          assert(pairs.length===0,"Unparsed source cannot declare materials");
          continue;
        }
        const materials=canonicalIngredients(pairs);
        materialObservations+=materials.length;
        const signature=JSON.stringify(materials);
        if(!groups.has(signature))groups.set(signature,{materials,sourceRowIds:[]});
        groups.get(signature).sourceRowIds.push(def[0]);
      }
      // The same recipe may appear in both general and specific ItemType.
      // Keep one backlink, with all original source row IDs in evidence.
      if(groups.size)recipeProducts++;
      for(const recipe of groups.values()){
        recipe.sourceRowIds.sort((a,b)=>a-b);
        for(const [materialId,quantity] of recipe.materials){
          if(!backlinks.has(materialId))backlinks.set(materialId,[]);
          backlinks.get(materialId).push([
            productId,names.get(productId),quantity,recipe.sourceRowIds,
          ]);
        }
      }
    }
  }
  assert(namedDefinitions===25064,"Unexpected named source row count");
  const buckets=new Map();
  let backlinksCount=0,knownMaterials=0,missingMaterials=0;
  for(const [ingredientId,usedBy] of backlinks){
    const bucket=Math.floor(Number(ingredientId)/1000);
    assert(Number.isSafeInteger(bucket)&&bucket>=0&&bucket<=99999999,
      "Unsafe material bucket");
    usedBy.sort((a,b)=>sortIds(a[0],b[0])||a[2]-b[2]);
    backlinksCount+=usedBy.length;
    if(knownIds.has(ingredientId))knownMaterials++;else missingMaterials++;
    if(!buckets.has(bucket))buckets.set(bucket,{});
    buckets.get(bucket)[ingredientId]=usedBy;
  }
  const filenames=[...buckets.keys()].sort((a,b)=>a-b)
    .map(bucket=>"used-by-"+String(bucket).padStart(2,"0")+".json");
  const manifest={
    schemaVersion:"1.0",dataset:"client-item-crafting-backlinks",
    snapshotId:1,itemIndexIds:23586,namedItemIds:22702,
    namedSourceDefinitions:namedDefinitions,
    ingredientObservations:materialObservations,
    sourceRecipeProducts:recipeProducts,
    linkedMaterialIds:backlinks.size,
    linkedKnownMaterialIds:knownMaterials,
    linkedUnindexedMaterialIds:missingMaterials,
    backlinks:backlinksCount,
    bucketWidth:1000,files:filenames,
    notice:"Original parsed client source definitions; not proof of live-server recipes or acquisition. Multiple source variants and IDs are retained.",
  };
  const output=new Map([["manifest.json",manifest]]);
  for(const bucket of [...buckets.keys()].sort((a,b)=>a-b)){
    const filename="used-by-"+String(bucket).padStart(2,"0")+".json";
    output.set(filename,{schemaVersion:"1.0",snapshotId:1,bucket,
      items:Object.fromEntries(Object.entries(buckets.get(bucket))
        .sort((a,b)=>sortIds(a[0],b[0])))});
  }
  return {manifest,output,names,knownIds,backlinks};
}

export function writeCraftLinks(source=SOURCE,dest=DEST){
  const {manifest,output}=buildCraftLinks(source);
  const tmp=dest+"-tmp-"+process.pid;
  if(readdirSync(resolve(source)).includes("crafting") &&
     !readdirSync(dest,{withFileTypes:true}).every(f=>f.isFile()&&
       /^(?:manifest|used-by-[0-9]+)\.json$/.test(f.name)))
    throw Error("Refusing to replace unexpected files in generated craft directory");
  rmSync(tmp,{recursive:true,force:true});mkdirSync(tmp,{recursive:true});
  try{
    for(const [filename,data] of output)writeFileSync(join(tmp,filename),compact(data),"utf8");
    rmSync(dest,{recursive:true,force:true});renameSync(tmp,dest);
  }catch(error){rmSync(tmp,{recursive:true,force:true});throw error;}
  return manifest;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const counts=writeCraftLinks();
    console.log("[IC] Craft backlink graph built:",counts.linkedMaterialIds,
      "material IDs,",counts.backlinks,"reverse edges;",
      counts.sourceRecipeProducts,"named recipe products.");
    if(counts.linkedUnindexedMaterialIds>0)console.log("[IC] Unindexed material IDs remain literal, without invented names:",
      counts.linkedUnindexedMaterialIds);
  }catch(error){
    console.error("[IC] ERROR: craft backlink generation rejected:",error.message);
    process.exitCode=1;
  }
}
