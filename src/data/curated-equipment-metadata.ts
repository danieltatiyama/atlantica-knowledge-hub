/**
 * The ONLY published bridge from reviewed Miner metadata into Astro pages.
 * No SQLite access, private staging data or unreviewed client source files
 * are imported at build or runtime.
 */
import curated from "./approved-equipment-metadata.json";
import { EQUIPMENT_ITEM_NAMES_EN } from "./equipment-item-names-en";
import { assertCuratedEquipment } from "./curated-equipment-gate.mjs";

export interface CuratedEquipmentMetadata {
  id: string;
  names: { en: string };
  fields: {
    clientCategory?: string;
    clientLevelRaw?: string;
    clientGradeRaw?: string;
  };
  evidence: {
    status: "Extracted";
    sources: string[];
  };
}

const rows = assertCuratedEquipment(curated, EQUIPMENT_ITEM_NAMES_EN) as CuratedEquipmentMetadata[];
const indexed = new Map<string, CuratedEquipmentMetadata>(
  rows.map((record) => [record.id, record])
);

export function getCuratedEquipmentMetadata(id: string | number): CuratedEquipmentMetadata | undefined {
  return indexed.get(String(id));
}

export const APPROVED_EQUIPMENT_METADATA_COUNT = indexed.size;
export const APPROVED_EQUIPMENT_SOURCE_SNAPSHOT =
  indexed.size > 0 ? curated.snapshot.id : undefined;
