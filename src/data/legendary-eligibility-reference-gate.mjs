/**
 * Historical Fandom "Legendary Weapons" list, intentionally independent of
 * item IDs, source-client enchantment fields and present-day availability.
 *
 * The source article has 47 entries under 12 nonempty categories. Names in
 * the article describe potentially L-eligible equipment, not guaranteed
 * drops, crafting availability, event status or verified 2026 client IDs.
 */
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const exact=(x,fields)=>obj(x)&&Object.keys(x).length===fields.length&&
  Object.keys(x).every(f=>fields.includes(f));
const safe=s=>typeof s==="string"&&s.length>0&&s.length<=170&&s===s.trim()&&
  !/[<>{}\n\r\\]/.test(s);
const categories=["Axe","Bow","Cannon","Gun","Instrument","Orb","Power Saw",
  "Shield","Spear","Staff","Sword","Whip"];
const URL="https://atlantica.fandom.com/wiki/Legendary_Weapons";
export const LEGENDARY_REFERENCE_URL=URL;

export function validateLegendaryEligibility(payload){
  const errors=[];
  if(!exact(payload,["schemaVersion","dataset","scope","source","qualification","items"])||
     payload.schemaVersion!=="1.0"||payload.dataset!=="legendary-eligibility-reference"||
     payload.scope!=="historical-community-list"||
     !exact(payload.source,["title","url","accessedDate"])||
     payload.source.url!==URL||!safe(payload.source.title)||
     !/^\d{4}-\d{2}-\d{2}$/.test(payload.source.accessedDate)||
     !safe(payload.qualification)||!Array.isArray(payload.items)){
    return {ok:false,errors:["Invalid Legendary reference dataset contract"],records:[]};
  }
  const names=new Set();
  for(let i=0;i<payload.items.length;i++){
    const entry=payload.items[i],label="legendary entry "+(i+1);
    if(!exact(entry,["nameEn","category","minimumLevel","acquisition","craftability"])||
       !safe(entry.nameEn)||
       !categories.includes(entry.category)||
       !(entry.minimumLevel===null||
         (Number.isSafeInteger(entry.minimumLevel)&&entry.minimumLevel>0&&entry.minimumLevel<=999))||
       entry.acquisition!=="unknown"||entry.craftability!=="unknown"){
      errors.push(label+" has invalid source fact fields");continue;
    }
    const canonical=normalizedLegendaryName(entry.nameEn);
    if(names.has(canonical)){errors.push(label+" has duplicate normalized name");continue;}
    names.add(canonical);
  }
  if(payload.items.length!==47)errors.push("Expected 47 currently indexed historical entries");
  if(new Set(payload.items.map(x=>x.category)).size!==12){
    errors.push("Expected 12 source category groups");
  }
  return {ok:errors.length===0,errors,records:errors.length?[]:payload.items};
}

export function normalizedLegendaryName(name){
  if(!safe(name))return "";
  return name.normalize("NFKD")
    .replace(/[\u2018\u2019\u02bc]/g,"'")
    .replace(/\p{M}/gu,"")
    .replace(/\s+/g," ")
    .toLowerCase();
}

/** This is a NAME cross-check only; not an item-ID source attestation. */
export function crossReferenceLegendaryNames(legendary, clientNames){
  const verdict=validateLegendaryEligibility(legendary);
  if(!verdict.ok)throw new Error("Legendary eligibility catalog is invalid");
  if(!obj(clientNames))throw new Error("Client ID/name dictionary is invalid");
  const byName=new Map();
  for(const [id,name] of Object.entries(clientNames)){
    if(!/^[1-9]\d*$/.test(id)||!safe(name))throw new Error("Invalid client dictionary");
    const key=normalizedLegendaryName(name);
    if(!byName.has(key))byName.set(key,[]);
    byName.get(key).push(id);
  }
  return verdict.records.map(entry=>{
    const matches=byName.get(normalizedLegendaryName(entry.nameEn))??[];
    return {
      ...entry,
      matchingReviewedIds:[...matches],
      // A matching NAME is insufficient evidence to automatically set
      // a gameplay Legendary flag for an item with an ambiguous ID.
      identityStatus:matches.length===0?"no-reviewed-id":
        matches.length===1?"exact-name-candidate":"ambiguous-name",
    };
  });
}
