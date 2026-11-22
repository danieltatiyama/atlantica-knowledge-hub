/**
 * Read a local/private Stage 20.23 complete client index and match the
 * historical Fandom 47-name Legendary list by exact normalized name.
 * Name matching is SOURCE INVESTIGATION, not authoritative item ID proof.
 * Never merge collisions or infer drop, event or craftability flags.
 */
import {normalizedLegendaryName,validateLegendaryEligibility}
  from "../src/data/legendary-eligibility-reference-gate.mjs";

const obj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const ID=/^[1-9]\d*$/;

export function reconcileLegendaryAgainstClient(inventory,legendary){
  const checked=validateLegendaryEligibility(legendary);
  if(!checked.ok||!obj(inventory)||
     inventory.reportVersion!=="20.23-private"||
     inventory.dataset!=="all-client-catalog-items"||
     !Number.isSafeInteger(inventory.snapshotId)||inventory.snapshotId<1||
     !Array.isArray(inventory.items)||inventory.items.length>100000){
    throw new Error("Unsupported full client source inventory or Legendary reference");
  }
  const byName=new Map(),seenIds=new Set();
  for(const row of inventory.items){
    if(!obj(row)||!ID.test(row.itemId)||seenIds.has(row.itemId)||
       typeof row.identityState!=="string"||
       !["one-official-English-name","different-base-identities",
         "no-official-English-name","reviewed-name-conflict"].includes(row.identityState)){
      throw new Error("Invalid/duplicate private item identity");
    }
    seenIds.add(row.itemId);
    // A conflict must NEVER become an approved identifier merely
    // because one historical name happens to match.
    const name=row.officialEnglishName;
    if(typeof name!=="string"||!name.trim())continue;
    const key=normalizedLegendaryName(name);
    if(!key)continue;
    const existing=byName.get(key)??[];
    existing.push({
      itemId:row.itemId,
      identityState:row.identityState,
      sourceFileCount:Array.isArray(row.sources)?row.sources.length:0,
    });
    byName.set(key,existing);
  }
  const entries=checked.records.map(item=>{
    const matches=byName.get(normalizedLegendaryName(item.nameEn))??[];
    const eligible=matches.filter(m=>m.identityState==="one-official-English-name"&&
      m.sourceFileCount>0);
    // An exact reviewed string at multiple IDs is ambiguous, even when
    // one of the source candidates has a conflicting identity.
    const status=matches.length===0?"not-found-in-miner":
      matches.length===1&&eligible.length===1?"one-exact-source-name":
      "ambiguous-client-identity";
    return {
      nameEn:item.nameEn,category:item.category,
      sourceReference:"historical-community-list",
      clientMatchStatus:status,
      candidateItemIds:matches.map(m=>m.itemId),
      sourceDefinitionsCount:matches.reduce((n,m)=>n+m.sourceFileCount,0),
      clientProof:"Name match only; inspect original source records before publishing eligibility or acquiring location",
    };
  });
  const counts={notFound:0,exactSourceName:0,ambiguous:0};
  for(const e of entries){
    if(e.clientMatchStatus==="not-found-in-miner")counts.notFound++;
    else if(e.clientMatchStatus==="one-exact-source-name")counts.exactSourceName++;
    else counts.ambiguous++;
  }
  return {
    reviewVersion:"20.24-private",
    snapshotId:inventory.snapshotId,
    sourceListUrl:legendary.source.url,
    summary:{
      referenceEntries:entries.length,
      uniqueClientNameCandidates:counts.exactSourceName,
      ambiguousClientIdentities:counts.ambiguous,
      missingClientNameMatches:counts.notFound,
    },
    entries,
    publication:"PRIVATE CANDIDATES ONLY; never enable L solely from a string match",
  };
}
