
export const SUBCATEGORY_IDS = [
  "avalon",
  "babel",
  "yggdrasil",
  "alcatraz",
  "pirate",
  "introduction",
  "skills",
  "builds-formations",
  "crafting",
  "equipment-enhancement",
  "others",
] as const;

export type GuideSubcategory =
  (typeof SUBCATEGORY_IDS)[number];

export type GuideCategory =
  | "nation-dungeons"
  | "mercenaries"
  | "game-systems";

type SubcategoryDefinition = {
  category: GuideCategory;
  labels: {
    en: string;
    "pt-br": string;
  };
};

export const GUIDE_SUBCATEGORIES: Record<
  GuideSubcategory,
  SubcategoryDefinition
> = {
  avalon: {
    category: "nation-dungeons",
    labels: { en: "Avalon", "pt-br": "Avalon" },
  },
  babel: {
    category: "nation-dungeons",
    labels: { en: "Babel", "pt-br": "Babel" },
  },
  yggdrasil: {
    category: "nation-dungeons",
    labels: { en: "Yggdrasil", "pt-br": "Yggdrasil" },
  },
  alcatraz: {
    category: "nation-dungeons",
    labels: { en: "Alcatraz", "pt-br": "Alcatraz" },
  },
  pirate: {
    category: "nation-dungeons",
    labels: { en: "Pirate", "pt-br": "Pirate" },
  },
  introduction: {
    category: "mercenaries",
    labels: { en: "Introduction", "pt-br": "Introdução" },
  },
  skills: {
    category: "mercenaries",
    labels: { en: "Skills", "pt-br": "Habilidades" },
  },
  "builds-formations": {
    category: "mercenaries",
    labels: {
      en: "Builds & Formations",
      "pt-br": "Builds e Formações",
    },
  },
  crafting: {
    category: "game-systems",
    labels: { en: "Crafting", "pt-br": "Fabricação" },
  },
  "equipment-enhancement": {
    category: "game-systems",
    labels: {
      en: "Equipment & Enhancement",
      "pt-br": "Equipamentos e Aprimoramento",
    },
  },
  others: {
    category: "game-systems",
    labels: { en: "Others", "pt-br": "Outros" },
  },
};

// Preserve existing bilingual taxonomy data; extra labels are presentation-only.
import type { Locale } from "../i18n/locales.mjs";
const localizedSubcategoryIds = ["introduction","skills","builds-formations","crafting","equipment-enhancement","others"] as const;
const extraSubcategoryLabels = {
  "fr": [
    "Introduction",
    "Compétences",
    "Configurations et formations",
    "Fabrication",
    "Équipement et amélioration",
    "Autres"
  ],
  "de": [
    "Einführung",
    "Fähigkeiten",
    "Builds und Formationen",
    "Herstellung",
    "Ausrüstung und Verbesserung",
    "Sonstiges"
  ],
  "es": [
    "Introducción",
    "Habilidades",
    "Configuraciones y formaciones",
    "Fabricación",
    "Equipamiento y mejoras",
    "Otros"
  ],
  "ko": [
    "소개",
    "스킬",
    "빌드 및 진형",
    "제작",
    "장비 및 강화",
    "기타"
  ],
  "zh-hans": [
    "入门",
    "技能",
    "配装与阵型",
    "制作",
    "装备与强化",
    "其他"
  ],
  "ja": [
    "入門",
    "スキル",
    "ビルドと陣形",
    "製造",
    "装備と強化",
    "その他"
  ]
};
export function guideSubcategoryLabel(id:GuideSubcategory,lang:Locale):string {
 const labels=GUIDE_SUBCATEGORIES[id].labels;
 if(lang==="en"||lang==="pt-br")return labels[lang];
 const index=localizedSubcategoryIds.findIndex(value=>value===id);
 return index<0?labels.en:extraSubcategoryLabels[lang][index];
}
