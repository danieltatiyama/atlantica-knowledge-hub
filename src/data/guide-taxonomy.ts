
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
};
