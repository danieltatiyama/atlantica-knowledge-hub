/**
 * Compare decoded general/specific ItemType source definitions without
 * losing provenance or interpreting file records as gameplay recipes.
 * Ingredient order is not semantically meaningful, but quantities, IDs,
 * unknown values and source conflict states ARE meaningful.
 */
import {getClientMaterialName} from "./client-material-names-en.mjs";

const fieldNames=Object.freeze(["levelRaw","gradeRaw","workRaw","unitRaw"]);

function rawPresent(value) {
  return value!==null && value!==undefined && value!=="";
}

function stringifyRaw(value) {
  if (typeof value==="number" && !Number.isSafeInteger(value))
    throw new TypeError("Invalid client raw numeric value");
  return String(value);
}

export function summarizeSourceRawField(sourceDefinitions,key) {
  if (!fieldNames.includes(key))throw new TypeError("Unknown source field");
  if (!Array.isArray(sourceDefinitions)||!sourceDefinitions.length)
    throw new TypeError("Empty source records");
  const seen=sourceDefinitions.filter(r=>rawPresent(r[key]))
    .map(r=>({recordId:r.recordId,value:stringifyRaw(r[key])}));
  const different=[...new Set(seen.map(x=>x.value))];
  return {
    status:seen.length===0?"not-provided":
      different.length>1?"conflict":
      seen.length<sourceDefinitions.length?"partial":"consistent",
    value:different.length===1?different[0]:null,
    sourceRecordIds:seen.map(r=>r.recordId),
    observations:seen,
  };
}

function compareIds(a,b) {
  // Avoid lexicographic order (e.g. 100 before 20) and avoid Number
  // precision issues on valid long original item IDs.
  const aa=BigInt(a.itemId),bb=BigInt(b.itemId);
  return aa<bb?-1:aa>bb?1:a.quantity-b.quantity;
}

export function normalizeSourceIngredients(source) {
  if (!source||!Array.isArray(source.ingredients)||
      !["parsed-client-material","parsed-client-recipe","none","unsupported"]
        .includes(source.ingredientsStatus)) {
    throw new TypeError("Invalid source ingredient record");
  }
  if (!source.ingredientsStatus.startsWith("parsed-")) {
    if(source.ingredients.length)throw new TypeError("Unparsed source cannot provide ingredients");
    return null;
  }
  if(!source.ingredients.length)throw new TypeError("Parsed source requires ingredients");
  const rows=source.ingredients.map(x=>{
    if(!x||typeof x.itemId!=="string"||!/^[1-9]\d*$/.test(x.itemId)||
       !Number.isSafeInteger(x.quantity)||x.quantity<=0){
      throw new TypeError("Invalid source ingredient ID or quantity");
    }
    return {...x};
  }).sort(compareIds);
  return rows;
}

export function summarizeClientCrafting(item) {
  if(!item||!Array.isArray(item.sourceDefinitions)||!item.sourceDefinitions.length)
    throw new TypeError("Invalid equipment source records");
  const sourceDefinitions=item.sourceDefinitions;
  const fields=Object.fromEntries(fieldNames.map(key=>
    [key,summarizeSourceRawField(sourceDefinitions,key)]));
  const grouped=new Map();
  const statuses={
    parsed:0,unsupported:0,none:0,
  };
  for(const source of sourceDefinitions){
    const parsed=normalizeSourceIngredients(source);
    if(parsed===null){
      statuses[source.ingredientsStatus]++;
      continue;
    }
    statuses.parsed++;
    const canonical=JSON.stringify(parsed.map(x=>[x.itemId,x.quantity]));
    if(!grouped.has(canonical)){
      grouped.set(canonical,{materials:parsed.map(m=>({
        itemId:m.itemId,quantity:m.quantity,
        nameEn:getClientMaterialName(m.itemId)??null,
      })),sourceRecordIds:[],sourceFiles:[]});
    }
    const group=grouped.get(canonical);
    group.sourceRecordIds.push(source.recordId);
    group.sourceFiles.push(source.file);
  }
  const recipes=[...grouped.values()];
  const status=recipes.length>1?"different-source-materials":
    recipes.length===1&&statuses.parsed<sourceDefinitions.length?"partial-source-materials":
    recipes.length===1?"same-source-materials":
    statuses.unsupported>0?"unparsed-source-materials":"not-provided";
  return {
    fields,
    recipes,
    status,
    sourceCount:sourceDefinitions.length,
    parsedSourceCount:statuses.parsed,
    sourcesWithoutIngredients:statuses.none,
    sourcesWithUnparsedMaterials:statuses.unsupported,
    missingMaterialNames:recipes.reduce((sum,recipe)=>
      sum+recipe.materials.filter(m=>m.nameEn===null).length,0),
  };
}
