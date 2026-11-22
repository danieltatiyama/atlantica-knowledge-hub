/**
 * Stage 19.0 - public, reviewed cross-reference of the 551 NA client
 * English item names and the game-transmitted equipment box lists.
 *
 * This is not a full item database. A reference indicates presence in a
 * captured preview, NOT a verified drop probability or guaranteed reward.
 */
import { EQUIPMENT_ITEM_NAMES_EN } from "./equipment-item-names-en";
import { EQUIPMENT_BOXES } from "./equipment-box-registry";
import { getCapturedEquipmentPool } from "./equipment-box-captured-pools";
import { getCapturedSelectionPool } from "./equipment-box-selection-pools";

export interface EquipmentItemBoxReference {
  boxId: string;
  boxName: string;
  boxSlug: string;
  interaction: "random" | "selection";
}

export interface EquipmentItemCatalogEntry {
  id: string;
  nameEn: string;
  boxReferences: EquipmentItemBoxReference[];
}

const references = new Map<string, EquipmentItemBoxReference[]>();

for (const box of EQUIPMENT_BOXES) {
  const randomPreview = getCapturedEquipmentPool(box.itemUniqueId);
  const selectionPreview = getCapturedSelectionPool(box.itemUniqueId);
  const ids = randomPreview?.itemUniqueIds ?? selectionPreview?.itemUniqueIds ?? [];

  for (const id of ids) {
    const key = String(id);
    const current = references.get(key) ?? [];
    current.push({
      boxId: box.itemUniqueId,
      boxName: box.name,
      boxSlug: box.slug,
      interaction: selectionPreview ? "selection" : "random",
    });
    references.set(key, current);
  }
}

export const EQUIPMENT_ITEM_CATALOG: EquipmentItemCatalogEntry[] =
  Object.entries(EQUIPMENT_ITEM_NAMES_EN)
    .map(([id, nameEn]) => ({
      id,
      nameEn,
      boxReferences: references.get(id) ?? [],
    }))
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn, "en") || Number(a.id) - Number(b.id));

export const EQUIPMENT_ITEM_CATALOG_BY_ID =
  new Map(EQUIPMENT_ITEM_CATALOG.map((item) => [item.id, item]));
