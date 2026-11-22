/**
 * Source-only reference for exact English-name matches against all 23,586
 * client item IDs at Miner snapshot 1. This is NOT proof that a particular
 * ID can be enhanced to L, remains obtainable, or matches live gameplay.
 */
const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const shape=(v,keys)=>obj(v)&&Object.keys(v).length===keys.length&&
  Object.keys(v).every(k=>keys.includes(k));
const id=v=>typeof v==="string"&&/^[1-9]\d{0,12}$/.test(v);
const safeName=v=>typeof v==="string"&&v.trim()===v&&v.length>0&&v.length<=120;
const statuses=["one-exact-source-name","ambiguous-client-identity","not-found-in-miner"];
const sourceURL="https://atlantica.fandom.com/wiki/Legendary_Weapons";

export function checkLegendaryClientCandidates(payload,legendary){
  const errors=[];
  if(!shape(payload,["schemaVersion","dataset","snapshotId","sourceList","sourceKind",
      "matchPolicy","entries"])||
      payload.schemaVersion!=="1.0"||payload.dataset!=="legendary-client-name-candidates"||
      !Number.isSafeInteger(payload.snapshotId)||payload.snapshotId<1||
      payload.sourceList!==sourceURL||
      payload.sourceKind!=="game-client-extracted:catalog_items"||
      !safeName(payload.matchPolicy)||
      !Array.isArray(payload.entries)||payload.entries.length!==47||
      !obj(legendary)||!Array.isArray(legendary.items)||
      legendary.items.length!==47){
    return {ok:false,errors:["Invalid client candidate source contract"]};
  }
  const usedIds=new Set(),usedRecords=new Set();
  for(let index=0;index<payload.entries.length;index++){
    const row=payload.entries[index],ref=legendary.items[index];
    if(!shape(row,["nameEn","category","clientMatchStatus","clientCandidates"])||
        row.nameEn!==ref.nameEn||row.category!==ref.category||
        !statuses.includes(row.clientMatchStatus)||
        !Array.isArray(row.clientCandidates)||row.clientCandidates.length>5){
      errors.push("Invalid Legendary candidate row "+(index+1));continue;
    }
    const expected=row.clientCandidates.length===0?"not-found-in-miner":
      row.clientCandidates.length===1?"one-exact-source-name":"ambiguous-client-identity";
    if(expected!==row.clientMatchStatus){
      errors.push("Inconsistent Legendary candidate status "+(index+1));
    }
    for(const cand of row.clientCandidates){
      if(!shape(cand,["itemId","recordIds","clientLevelRaw","clientGradeRaw"])||
          !id(cand.itemId)||usedIds.has(cand.itemId)||
          !/^[0-9]{1,4}$/.test(cand.clientLevelRaw)||
          !/^[A-Z_]{3,32}$/.test(cand.clientGradeRaw)||
          !Array.isArray(cand.recordIds)||cand.recordIds.length<1||cand.recordIds.length>20||
          cand.recordIds.some(n=>!Number.isSafeInteger(n)||n<=0||usedRecords.has(n))){
        errors.push("Invalid client source candidate "+(index+1));continue;
      }
      usedIds.add(cand.itemId);
      for(const n of cand.recordIds)usedRecords.add(n);
    }
  }
  const counts={
    exact:payload.entries.filter(e=>e.clientMatchStatus==="one-exact-source-name").length,
    ambiguous:payload.entries.filter(e=>e.clientMatchStatus==="ambiguous-client-identity").length,
    missing:payload.entries.filter(e=>e.clientMatchStatus==="not-found-in-miner").length,
  };
  if(counts.exact!==44||counts.ambiguous!==2||counts.missing!==1)
    errors.push("Source reconciliation differs from snapshot 1 report");
  return {ok:errors.length===0,errors,counts};
}

export function assertLegendaryClientCandidates(payload,legendary){
  const checked=checkLegendaryClientCandidates(payload,legendary);
  if(!checked.ok)throw new Error("Unvalidated Legendary client candidates: "+
    checked.errors.join("; "));
  return payload.entries;
}
