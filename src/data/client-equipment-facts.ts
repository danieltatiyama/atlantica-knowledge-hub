/**
 * Source-separated game-client equipment facts.
 * Safe public subset is GENERATED locally from the read-only Miner SQLite.
 * Source data is not proof of 2026 gameplay, special effects, item drop
 * probabilities, or craftability.
 */
import values from "./client-equipment-facts.json";
import {EQUIPMENT_ITEM_NAMES_EN} from "./equipment-item-names-en";
import {assertClientEquipmentFacts} from "./client-equipment-facts-gate.mjs";

export interface ClientMaterialReference {
  itemId:string; quantity:number;
}
export interface ClientSourceDefinition {
  recordId:number;
  file:string;
  role:"general"|"specific";
  category:string;
  levelRaw:string|number|null;
  gradeRaw:string|number|null;
  unitRaw:string|number|null;
  workRaw:string|number|null;
  ingredientsStatus:"none"|"unsupported"|"parsed-client-recipe"|"parsed-client-material";
  ingredients:ClientMaterialReference[];
}
export interface ClientEquipmentFacts {
  id:string;
  nameEn:string;
  origin:"game-client-extracted";
  identity:"official-base-name-match";
  sourceDefinitions:ClientSourceDefinition[];
  variantSourceSets:{variantIndex:number;recordIds:number[]}[];
}

const facts=assertClientEquipmentFacts(values,EQUIPMENT_ITEM_NAMES_EN) as ClientEquipmentFacts[];
const byId=new Map(facts.map(x=>[x.id,x]));
export const CLIENT_EQUIPMENT_SOURCE_COUNT=facts.length;
export const CLIENT_EQUIPMENT_SOURCE_SNAPSHOT=values.snapshotId;

export function getClientEquipmentFacts(id:string|number){
  return byId.get(String(id));
}
