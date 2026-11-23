/**
 * Cross-check generated reverse loot relations against independently
 * generated creature counts and original snapshot metadata.
 * This is a source-integrity audit, not live-server verification.
 */
const ensure=(condition,why)=>{if(!condition)throw Error("Audit rejected: "+why);};
export function inspectSourceQuality({itemManifest,monsterManifest,discoveryManifest,
  itemLookup,creatureCounts,reverseShards,craftManifest}){
  ensure(itemManifest.snapshotId===1&&itemManifest.totalIds===23586,"item source manifest");
  ensure(monsterManifest.snapshotId===1&&monsterManifest.catalogMonsterIds===4351,
    "original monster manifest");
  ensure(discoveryManifest.snapshotId===1&&
    discoveryManifest.dataset==="level-resolved-client-monster-loot","resolved loot manifest");
  ensure(craftManifest.snapshotId===1&&
    craftManifest.dataset==="client-item-crafting-backlinks","craft manifest");
  ensure(itemLookup.itemIds===822&&Array.isArray(itemLookup.rows)&&
    itemLookup.rows.length===822,"822 level-selected items");
  ensure(creatureCounts.count===4351&&creatureCounts.rows.length===4351,
    "creature count index");
  const byCreature=new Map();
  for(const row of creatureCounts.rows){
    ensure(Array.isArray(row)&&row.length===3&&!byCreature.has(row[0]),
      "duplicate/invalid creature counts");
    byCreature.set(row[0],{expected:row[1],unresolved:row[2],actual:0});
  }
  let direct=0,group=0;
  const byItem=new Map();
  for(const shard of reverseShards){
    ensure(shard.schemaVersion==="1.0"&&shard.snapshotId===1&&
      shard.dataset==="level-resolved-client-monster-loot","reverse shard schema");
    for(const [itemId,entry] of Object.entries(shard.items)){
      ensure(!byItem.has(itemId)&&Array.isArray(entry.direct)&&Array.isArray(entry.group),
        "duplicate/invalid reverse item");
      byItem.set(itemId,entry);
      for(const type of ["direct","group"]){
        for(const row of entry[type]){
          const creature=byCreature.get(row[0]);
          ensure(creature,"reverse reference to unknown creature "+row[0]);
          creature.actual++;
          if(type==="direct")direct++;else group++;
        }
      }
    }
  }
  ensure(byItem.size===822,"missing matched item reverse shards");
  ensure(itemLookup.rows.every(row=>{
    const e=byItem.get(row[0]);
    return e&&e.direct.length===row[2]&&e.group.length===row[3];
  }),"item lookup and reverse item indexes diverged");
  const incorrect=[...byCreature].filter(([id,x])=>x.expected!==x.actual).map(x=>x[0]);
  ensure(incorrect.length===0,"forward/reverse creature count mismatch: "+incorrect.slice(0,5));
  ensure(direct===9959&&group===23905&&
    direct===discoveryManifest.originalDirectRows&&
    group===discoveryManifest.levelMatchedGroupRows,"derived source row totals");
  const unresolved=[...byCreature].filter(([,x])=>x.unresolved>0);
  const unresolvedCount=unresolved.reduce((sum,[,x])=>sum+x.unresolved,0);
  ensure(unresolvedCount===197&&unresolvedCount===discoveryManifest.unmatchedLevelGroupRefs,
    "unresolved group bracket counts");
  const crocodileGold=byItem.get("7070");
  const crocodileSilver=byItem.get("7080");
  ensure(!crocodileGold||![...crocodileGold.direct,...crocodileGold.group]
    .some(row=>row[0]==="289"),"Gold Thread incorrectly linked to Huge Crocodile");
  ensure(crocodileSilver?.group.some(row=>row[0]==="289"),
    "Silver Thread missing from Huge Crocodile");
  const matchedCreatures=[...byCreature.values()].filter(x=>x.expected>0).length;
  return {
    schemaVersion:"1.0",snapshotId:1,
    dataset:"atlantica-client-source-quality",
    status:"source-consistent",
    itemCatalog:{ids:itemManifest.totalIds,named:itemManifest.namedIds,
      equipmentReviewed:itemManifest.reviewedEquipmentIds},
    monsters:{ids:byCreature.size,withMatchedDrops:matchedCreatures,
      withoutMatchedDrops:byCreature.size-matchedCreatures,
      directRows:direct,levelMatchedGroupRows:group,
      matchedItemIds:byItem.size,
      unresolvedGroupReferences:unresolvedCount,
      creaturesWithUnresolvedReferences:unresolved.length},
    crafting:{recipeProducts:craftManifest.sourceRecipeProducts,
      ingredientObservations:craftManifest.ingredientObservations,
      linkedMaterialIds:craftManifest.linkedMaterialIds,
      unindexedMaterialIds:craftManifest.linkedUnindexedMaterialIds},
    checks:{forwardReverseMatches:true,sourceSnapshotMatches:true,
      hugeCrocodileReference:true},
    warnings:[
      "The 197 unmatched group references remain unresolved and are not inferred.",
      "Unindexed crafting material IDs retain original numeric references; do not guess their identities.",
      "Source-consistent means internal indexes agree. It does not prove live-server drop rates, active monsters, or recipe availability.",
    ],
  };
}
