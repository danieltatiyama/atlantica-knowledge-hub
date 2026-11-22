/**
 * Editorially reviewed, source-specific item article facts.
 * This layer is intentionally separate from raw Miner metadata:
 * no private SQLite, client binaries, or uploaded screenshot bytes are
 * published to the static Wiki.
 */
import profiles from "./reviewed-equipment-profiles.json";
import { EQUIPMENT_ITEM_NAMES_EN } from "./equipment-item-names-en";
import { assertReviewedProfiles } from "./reviewed-equipment-profiles-gate.mjs";

export interface ItemArticleStatRow {
  enchantLevel: number;
  attackMin?: number;
  attackMax?: number;
  strength?: number;
  vitality?: number;
  dexterity?: number;
  intelligence?: number;
  defense?: number;
  magicDefense?: number;
}

export interface ItemArticleProfile {
  id: string;
  nameEn: string;
  overview: null | {
    typeEn: string;
    minimumLevel: number;
    eligibleClasses: string[];
  };
  stats: ItemArticleStatRow[];
  crafting: null | {
    productionPerBatch: number;
    requiredWorkload: number;
    requiredSkill: { nameEn: string; level: number };
    materials: { nameEn: string; quantity: number }[];
  };
  evidence: {
    overview: "ingame-screenshot" | "community-reference" | "not-provided";
    stats: "ingame-screenshot" | "community-reference" | "not-provided";
    crafting: "ingame-screenshot" | "community-reference" | "not-provided";
    materials: "ingame-screenshot" | "community-reference" | "not-provided";
    references: {
      kind: "ingame-screenshot" | "community-reference";
      label: string;
      url?: string;
    }[];
  };
}

const entries = assertReviewedProfiles(profiles, EQUIPMENT_ITEM_NAMES_EN) as ItemArticleProfile[];
const byId = new Map(entries.map((record) => [record.id, record]));

export const ITEM_ARTICLE_PROFILE_COUNT = byId.size;

export function getReviewedItemProfile(id: string | number): ItemArticleProfile | undefined {
  return byId.get(String(id));
}
