
export const SUBCATEGORY_IDS = [
  "avalon",
  "babel",
  "yggdrasil",
  "alcatraz",
  "pirate",
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

const extraLabels: Record<string, Partial<Record<GuideSubcategory,string>>> = {
  "fr": {
    "skills": "Compétences",
    "builds-formations": "Formations et builds",
    "crafting": "Fabrication",
    "equipment-enhancement": "Équipement et amélioration",
    "others": "Autres"
  },
  "de": {
    "skills": "Fähigkeiten",
    "builds-formations": "Builds und Formationen",
    "crafting": "Herstellung",
    "equipment-enhancement": "Ausrüstung und Aufwertung",
    "others": "Sonstiges"
  },
  "es": {
    "skills": "Habilidades",
    "builds-formations": "Configuraciones y formaciones",
    "crafting": "Fabricación",
    "equipment-enhancement": "Equipo y mejoras",
    "others": "Otros"
  },
  "ko": {
    "skills": "스킬",
    "builds-formations": "빌드 및 진형",
    "crafting": "제작",
    "equipment-enhancement": "장비 및 강화",
    "others": "기타"
  },
  "zh-hans": {
    "skills": "技能",
    "builds-formations": "配装与阵型",
    "crafting": "制作",
    "equipment-enhancement": "装备与强化",
    "others": "其他"
  },
  "ja": {
    "skills": "スキル",
    "builds-formations": "ビルドと編成",
    "crafting": "製造",
    "equipment-enhancement": "装備と強化",
    "others": "その他"
  }
};
export function guideSubcategoryLabel(id: GuideSubcategory, lang: string): string {
  return lang === "pt-br" ? GUIDE_SUBCATEGORIES[id].labels["pt-br"] : extraLabels[lang]?.[id] ?? GUIDE_SUBCATEGORIES[id].labels.en;
}
