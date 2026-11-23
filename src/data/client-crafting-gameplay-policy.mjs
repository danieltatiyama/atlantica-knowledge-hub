/**
 * User-confirmed, live gameplay rule for equipment production.
 *
 * Original ItemType source rows provide Unit (per-batch quantity) only for
 * some items (e.g. Armor 645 = 1, Defence 18801 = missing).
 * For EQUIPMENT, the player confirmed: exactly one item per batch and a
 * maximum of 20 items per craft operation. This is NOT a source-derived rule.
 *
 * All other crafting retains the independently reported 10,000-item operation
 * cap. Avoid extending the equipment rule to categories not listed here.
 */
export const EQUIPMENT_BATCH_SIZE=1;
export const EQUIPMENT_MAX_PER_OPERATION=20;
export const OTHER_MAX_PER_OPERATION=10000;
export const EQUIPMENT_SOURCE_CATEGORIES=new Set([
  "Weapon","Defence","Sword","Spear","Axe","Bow","Gun","Cannon",
  "Staff","Guitar","Saw","Whip","Shield","Orb","Armor","Pants",
  "Boots","Helmet","Glove","Ring","Accessories","Neck",
  "EARRING","BRACELET",
]);
export function isEquipmentSourceCategory(category){
  return typeof category==="string"&&EQUIPMENT_SOURCE_CATEGORIES.has(category);
}
export function craftGameplayPolicy(category){
  const equipment=isEquipmentSourceCategory(category);
  return {
    equipment,
    batchSize:equipment?EQUIPMENT_BATCH_SIZE:null,
    maxPerOperation:equipment?EQUIPMENT_MAX_PER_OPERATION:OTHER_MAX_PER_OPERATION,
    source:equipment?"user-confirmed-equipment-rule":"client-batch-or-manual",
  };
}
