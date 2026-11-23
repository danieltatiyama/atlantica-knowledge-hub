/** Source-only raw combat-like item fields from Items.csv / Miner snapshot.
 * No in-game validation and no derived +10/L multipliers.
 */
import values from "./client-item-attributes.json";
import {EQUIPMENT_ITEM_NAMES_EN} from "./equipment-item-names-en";
import {assertClientItemAttributes} from "./client-item-attributes-gate.mjs";
import {withClientMovementSpeed} from "./client-movement-speed.mjs";

export interface ClientAttributeSourceRow {
  sourceRowNumber:number;
  fieldsRaw:Record<string,string>;
}
export interface ClientItemAttributes {
  id:string;
  nameEn:string;
  identity:"exact-official-english-source-name";
  sourceRows:ClientAttributeSourceRow[];
}

// Validate the original 551 identities first, then attach separately attested
// MoveSpeed values by the immutable Items.csv source row IDs.
const items=withClientMovementSpeed(
  assertClientItemAttributes(values,EQUIPMENT_ITEM_NAMES_EN),values.snapshotId
) as ClientItemAttributes[];
const byId=new Map(items.map(item=>[item.id,item]));
export const CLIENT_ATTRIBUTE_ITEM_COUNT=items.length;
export const CLIENT_ATTRIBUTE_SOURCE_SNAPSHOT=values.snapshotId;
export function getClientItemAttributes(id:string|number) {
  return byId.get(String(id));
}
