/**
 * Build-time source overview for the initial 551 reviewed equipment IDs.
 *
 * "Category" and "level" below are raw client file fields, not verified
 * player-facing equip restrictions or a complete taxonomy of all items.
 * Generic Weapon/Defence rows are NOT silently preferred over a unique
 * more-specific ItemType source category.
 */
import {summarizeClientRawFields} from "./client-item-stat-summary.mjs";

export function getClientItemSourceOverview(item,sourceFacts,attrs) {
  if(!item||!sourceFacts||!attrs||item.id!==sourceFacts.id||
     item.id!==attrs.id||!Array.isArray(sourceFacts.sourceDefinitions)||
     !sourceFacts.sourceDefinitions.length){
    throw new TypeError("Catalog overview requires matching reviewed original item IDs");
  }
  const definitions=sourceFacts.sourceDefinitions;
  const specific=[...new Set(definitions.filter(x=>x.role==="specific").map(x=>x.category))];
  const general=[...new Set(definitions.map(x=>x.category))];
  const rawCategories=specific.length?specific:general;
  const category=rawCategories.length===1?rawCategories[0]:"Multiple sources";
  const levels=[...new Set(definitions.map(x=>x.levelRaw).filter(x=>x!==null&&x!==""))]
    .map(String);
  const rawLevel=levels.length===1&&/^(0|[1-9]\d*)$/.test(levels[0])?
    levels[0]:null;
  const summary=summarizeClientRawFields(attrs);
  const raw=key=>{
    const field=summary.byKey.get(key);
    return field&&field.status!=="conflict"?field.value:null;
  };
  return {
    category,rawLevel,
    minDamage:raw("MinDamage"),
    maxDamage:raw("MaxDamage"),
    physicalAC:raw("AC"),
    magicDef:raw("MagicDef"),
    evasion:raw("EV"),
    movement:raw("MoveSpeed"),
    sourceConflictCount:summary.conflictCount,
  };
}
