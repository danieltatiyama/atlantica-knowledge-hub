/**
 * Stage 20.16: one queue row per item ID in the reviewed 551-name registry.
 *
 * This does not scrape Wikidot, invent gameplay stats, infer item IDs or
 * publish client rows. All URLs are candidates only; optional source groups
 * are private diagnostic classifications, not content approvals.
 */
import {validateReviewedProfiles} from "../src/data/reviewed-equipment-profiles-gate.mjs";
import {validateCuratedEquipment} from "../src/data/curated-equipment-gate.mjs";
import {validateExtendedEquipmentFacts} from "../src/data/extended-equipment-facts-gate.mjs";
import {wikidotCandidateUrl} from "./suggest-wikidot-item-pages.mjs";

export function buildArticleReviewQueue(names, profiles, curated, extended, sourceGroups=null) {
  const checkedProfile=validateReviewedProfiles(profiles,names);
  const checkedCurated=validateCuratedEquipment(curated,names);
  const checkedExtended=validateExtendedEquipmentFacts(extended,names);
  if(!checkedProfile.ok || !checkedCurated.ok || !checkedExtended.ok){
    throw new Error("One or more public item schemas failed validation");
  }
  if(sourceGroups!==null && (
    sourceGroups?.reviewVersion!=="20.11-private" ||
    !Number.isSafeInteger(sourceGroups.snapshotId) ||
    !Array.isArray(sourceGroups.items)
  ))throw new Error("Invalid private source-group report");

  const byProfile=new Map(checkedProfile.records.map(x=>[x.id,x]));
  const byCurated=new Map(checkedCurated.records.map(x=>[x.id,x]));
  const byExtended=new Map(
    checkedExtended.records.filter(x=>x.itemId!==null).map(x=>[x.itemId,x]));
  const byGroup=new Map();
  if(sourceGroups){
    for(const item of sourceGroups.items){
      if(!item || !/^[1-9]\d*$/.test(item.itemId) ||
         typeof item.classification!=="string" || byGroup.has(item.itemId)){
        throw new Error("Invalid or duplicated source-group item");
      }
      byGroup.set(item.itemId,item.classification);
    }
  }
  const rows=Object.entries(names)
    .sort((a,b)=>Number(a[0])-Number(b[0]))
    .map(([itemId,nameEn])=>{
      const profile=byProfile.get(itemId);
      const reviewed=byCurated.get(itemId);
      const rich=byExtended.get(itemId);
      return {
        itemId,nameEn,
        completeness:{
          overview:Boolean(profile?.overview||rich),
          enchantStats:Boolean(profile?.stats?.length||rich),
          crafting:Boolean(profile?.crafting),
          materials:Boolean(profile?.crafting?.materials?.length),
          detailedEffects:Boolean(rich?.specialEffects?.length),
          approvedClientFields:Boolean(reviewed),
          legendary:Boolean(profile?.legendaryEligible||rich?.grade==="L"),
        },
        sourceClassification:byGroup.get(itemId)??null,
        wikidotCandidateUrl:wikidotCandidateUrl(nameEn),
        wikidotUrlVerified:false,
        publication:"review-required",
      };
    });
  const counts={};
  for(const field of Object.keys(rows[0]?.completeness??{})){
    counts[field]=rows.filter(r=>r.completeness[field]).length;
  }
  const complete=rows.filter(row=>row.completeness.overview &&
    row.completeness.enchantStats && row.completeness.crafting &&
    row.completeness.materials).length;
  const report={
    reportVersion:"20.16",publicReviewedItems:rows.length,
    editorialFullProfiles:complete,
    editorialIncompleteProfiles:rows.length-complete,
    fieldCoverage:counts,
    reviewedResearchItemsWithoutCatalogId:
      checkedExtended.records.filter(r=>r.itemId===null).length,
    sourceGroupsJoined:byGroup.size,
    reminder:"Candidate URLs are not verified; local source groups do not approve identity or stats",
  };
  return {queueVersion:"20.16-private",report,items:rows};
}
