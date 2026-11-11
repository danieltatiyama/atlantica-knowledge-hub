
export const defaultLang = "en" as const;

export const languages = {
  en: "English",
  "pt-br": "Português (Brasil)",
} as const;

const en = {
  // Navigation
  "nav.home": "Home",
  "nav.guides": "Guides",
  "nav.explore": "Explore",

  // Home
  "home.eyebrow": "COMMUNITY KNOWLEDGE BASE",
  "home.title": "Explore the world of Atlantica Online",
  "home.description":
    "Guides, resources, and interactive tools built for the Atlantica Online community.",
  "home.explore": "Explore Topics",
  "home.discover": "Discover",

  // Home Sections
  "home.gameGuides": "Game Guides",
  "home.nationDungeons": "Nation Dungeons",
  "home.tools": "Tools & Calculators",

  // Guides
  "guides.title": "Game Guides",
  "guides.latest": "Latest Guides",
  "guides.categories": "Categories",
  "guides.all": "All Guides",
  "guides.empty":
    "No guides available in this category yet.",
  "guides.back": "Back to guides",

  // Articles
  "article.toc": "On this page",
  "article.updated": "Last updated",

  // Shared
  "shared.comingSoon": "Coming soon",

  "home.gameGuidesDesc":
    "Explore game mechanics, strategies, and tutorials.",
  "home.nationDungeonsDesc":
    "Learn about dungeons, cooldowns, and schedules.",
  "home.toolsDesc":
    "Interactive tools to help plan your adventures.",
  "home.openGuides": "Explore Guides →",

  "home.gameGuidesAlt":
    "Mercenary archer artwork from Atlantica Online",
  "home.nationDungeonsAlt":
    "Ancient temple environment from Atlantica Online",
  "home.toolsAlt":
    "Character artwork from Atlantica Online",

  "guides.eyebrow": "KNOWLEDGE BASE",
  "guides.intro":
    "Explore guides, strategies, and useful information to improve your Atlantica Online experience.",

  "guides.categoryNationDungeons": "Nation Dungeons",
  "guides.categoryMercenaries": "Mercenaries & Builds",
  "guides.categoryGameSystems": "Game Systems",

  "guides.nationDungeonsDesc":
    "Dungeon mechanics, strategies, cooldowns, and rewards.",
  "guides.mercenariesDesc":
    "Mercenary information, skills, formations, and builds.",
  "guides.gameSystemsDesc":
    "Crafting, equipment, enhancement, and other systems.",

  "guides.filterLabel": "Filter guides by category",
  "guides.filterMercenaries": "Mercenaries",
  "guides.noArticles":
    "No guides have been published in this language yet.",
  "guides.browseEnglish": "Browse English guides",

} as const;

const ptBr = {
  // Navigation
  "nav.home": "Início",
  "nav.guides": "Guias",
  "nav.explore": "Explorar",

  // Home
  "home.eyebrow": "BASE DE CONHECIMENTO DA COMUNIDADE",
  "home.title": "Explore o mundo de Atlantica Online",
  "home.description":
    "Guias, informações e ferramentas interativas para a comunidade de Atlantica Online.",
  "home.explore": "Explorar conteúdos",
  "home.discover": "Descubra",

  // Home Sections
  "home.gameGuides": "Guias do Jogo",
  "home.nationDungeons": "Dungeons da Nação",
  "home.tools": "Ferramentas e Calculadoras",

  // Guides
  "guides.title": "Guias do Jogo",
  "guides.latest": "Guias Recentes",
  "guides.categories": "Categorias",
  "guides.all": "Todos os Guias",
  "guides.empty":
    "Ainda não há guias disponíveis nesta categoria.",
  "guides.back": "Voltar aos guias",

  // Articles
  "article.toc": "Nesta página",
  "article.updated": "Última atualização",

  // Shared
  "shared.comingSoon": "Em breve",

  "home.gameGuidesDesc":
    "Explore mecânicas do jogo, estratégias e tutoriais.",
  "home.nationDungeonsDesc":
    "Conheça as dungeons, seus tempos de espera e calendários.",
  "home.toolsDesc":
    "Ferramentas interativas para planejar suas aventuras.",
  "home.openGuides": "Explorar guias →",

  "home.gameGuidesAlt":
    "Arte de uma arqueira mercenária de Atlantica Online",
  "home.nationDungeonsAlt":
    "Cenário de um templo antigo de Atlantica Online",
  "home.toolsAlt":
    "Arte de personagem de Atlantica Online",

  "guides.eyebrow": "BASE DE CONHECIMENTO",
  "guides.intro":
    "Explore guias, estratégias e informações para melhorar sua experiência em Atlantica Online.",

  "guides.categoryNationDungeons": "Dungeons da Nação",
  "guides.categoryMercenaries": "Mercenários e Formações",
  "guides.categoryGameSystems": "Sistemas do Jogo",

  "guides.nationDungeonsDesc":
    "Mecânicas, estratégias, tempos de espera e recompensas das dungeons.",
  "guides.mercenariesDesc":
    "Informações sobre mercenários, habilidades, formações e builds.",
  "guides.gameSystemsDesc":
    "Crafting, equipamentos, aprimoramentos e outros sistemas.",

  "guides.filterLabel": "Filtrar guias por categoria",
  "guides.filterMercenaries": "Mercenários",
  "guides.noArticles":
    "Ainda não há guias publicados neste idioma.",
  "guides.browseEnglish": "Consultar guias em inglês",

} satisfies Record<keyof typeof en, string>;

export const ui = {
  en,
  "pt-br": ptBr,
};

export type Lang = keyof typeof ui;
export type TranslationKey = keyof typeof en;
