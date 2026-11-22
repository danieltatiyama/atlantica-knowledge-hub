/** Fail-closed gate for structured client-source facts from Stage 20.23.
 * These are EXTRACTED client values, not independently observed gameplay
 * stats, recipes in player skill UI, live drops or current availability.
 */
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const exact=(x,keys)=>obj(x)&&Object.keys(x).length===keys.length&&
  Object.keys(x).every(k=>keys.includes(k));
const id=s=>typeof s==="string"&&/^[1-9]\d*$/.test(s);
const finite=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12;
const raw=x=>x===null||(typeof x==="string"&&x.length<=80&&
  !/[<>{}\\\r\n]/.test(x)&&!/^[A-Za-z]:/.test(x))||finite(x);
const ingredient=x=>exact(x,["itemId","quantity"])&&id(x.itemId)&&
  finite(x.quantity)&&x.quantity>0;
const source=x=>exact(x,["recordId","file","role","category",
  "levelRaw","gradeRaw","workRaw","unitRaw","ingredientsStatus","ingredients"])&&
  Number.isSafeInteger(x.recordId)&&x.recordId>0&&
  /^ItemType[A-Za-z0-9_]+\.(?:ndt|vna)$/i.test(x.file)&&
  ["general","specific"].includes(x.role)&&
  /^[A-Za-z0-9_ ]{1,60}$/.test(x.category)&&
  ["levelRaw","gradeRaw","workRaw","unitRaw"].every(k=>raw(x[k]))&&
  ["none","unsupported","parsed-client-recipe","parsed-client-material"]
    .includes(x.ingredientsStatus)&&
  Array.isArray(x.ingredients)&&x.ingredients.length<=200&&
  x.ingredients.every(ingredient)&&
  (x.ingredientsStatus.startsWith("parsed-")?x.ingredients.length>0:
    x.ingredients.length===0);

export function validateClientEquipmentFacts(dataset,registry){
  const errs=[];
  if(!exact(dataset,["schemaVersion","dataset","snapshotId","records"])||
     dataset.schemaVersion!=="1.0"||dataset.dataset!=="client-equipment-facts"||
     !(dataset.snapshotId===null||
       (Number.isSafeInteger(dataset.snapshotId)&&dataset.snapshotId>0))||
     !Array.isArray(dataset.records)||dataset.records.length>100000||!obj(registry)){
    return {ok:false,errors:["Invalid client fact dataset"],records:[]};
  }
  if(dataset.records.length && dataset.snapshotId===null){
    errs.push("Public records require a source snapshot");
  }
  const usedItems=new Set(),usedRecordIds=new Set();
  for(const [i,item] of dataset.records.entries()){
    const label="source item "+(i+1);
    if(!exact(item,["id","nameEn","origin","identity","sourceDefinitions","variantSourceSets"])||
       !id(item.id)||registry[item.id]!==item.nameEn||
       usedItems.has(item.id)||item.origin!=="game-client-extracted"||
       item.identity!=="official-base-name-match"||
       !Array.isArray(item.sourceDefinitions)||item.sourceDefinitions.length===0||
       item.sourceDefinitions.length>100||
       !Array.isArray(item.variantSourceSets)){
      errs.push(label+" has an unreviewed identity or invalid source structure");
      continue;
    }
    usedItems.add(item.id);
    const recordIds=new Set();
    for(const def of item.sourceDefinitions){
      if(!source(def)||recordIds.has(def.recordId)||usedRecordIds.has(def.recordId)){
        errs.push(label+" has invalid/reused source row");continue;
      }
      recordIds.add(def.recordId);
      usedRecordIds.add(def.recordId);
    }
    const idsInVariants=new Set();
    for(const [j,variant] of item.variantSourceSets.entries()){
      if(!exact(variant,["variantIndex","recordIds"])||
         variant.variantIndex!==j+1||
         !Array.isArray(variant.recordIds)||!variant.recordIds.length||
         variant.recordIds.some(v=>!Number.isSafeInteger(v)||!recordIds.has(v)||
           idsInVariants.has(v))){
        errs.push(label+" has invalid source grouping");continue;
      }
      for(const rid of variant.recordIds)idsInVariants.add(rid);
    }
    if(recordIds.size!==idsInVariants.size){
      errs.push(label+" loses source rows between source and variant groups");
    }
  }
  return {ok:errs.length===0,errors:errs,records:errs.length?[]:dataset.records};
}

export function assertClientEquipmentFacts(dataset,registry){
  const checked=validateClientEquipmentFacts(dataset,registry);
  if(!checked.ok)throw new Error("Client source fact publication blocked: "+
    checked.errors.join("; "));
  return checked.records;
}
