import {LOCALE_IDS} from "./locales.mjs";
export const aliasUiRows=[
  [
    "Wiki translation (unofficial)",
    "Tradução da Wiki (não oficial)",
    "Traduction du Wiki (non officielle)",
    "Wiki-Übersetzung (inoffiziell)",
    "Traducción de la Wiki (no oficial)",
    "위키 번역 (비공식)",
    "Wiki 译名（非官方）",
    "Wiki翻訳（非公式）"
  ],
  [
    "English client names are preserved. Some items and monsters have optional AI-assisted Wiki translations for search; these are not official regional names.",
    "Os nomes do cliente em inglês são preservados. Alguns itens e monstros têm traduções opcionais da Wiki, assistidas por IA, para pesquisa; não são nomes oficiais regionais.",
    "Les noms anglais du client sont conservés. Certains objets et monstres disposent de traductions facultatives du Wiki assistées par IA pour la recherche ; ce ne sont pas des noms régionaux officiels.",
    "Englische Clientnamen bleiben erhalten. Einige Gegenstände und Monster haben KI-gestützte optionale Wiki-Übersetzungen für die Suche; keine offiziellen regionalen Namen.",
    "Se conservan los nombres ingleses del cliente. Algunos objetos y monstruos tienen traducciones opcionales de la Wiki asistidas por IA para buscar; no son nombres regionales oficiales.",
    "영문 클라이언트 이름을 유지합니다. 일부 아이템과 몬스터는 검색용 AI 보조 위키 번역명이 있으며 공식 지역판 이름은 아닙니다.",
    "保留英文客户端名称。部分物品和怪物提供 AI 辅助 Wiki 译名供搜索，并非官方地区服名称。",
    "英語クライアント名を保持します。一部のアイテムとモンスターには検索用のAI補助Wiki翻訳名がありますが、地域版の公式名称ではありません。"
  ],
  [
    "English name, Wiki translation or ID",
    "Nome em inglês, tradução da Wiki ou ID",
    "Nom anglais, traduction du Wiki ou ID",
    "Englischer Name, Wiki-Übersetzung oder ID",
    "Nombre inglés, traducción de la Wiki o ID",
    "영문 이름, 위키 번역명 또는 ID",
    "英文名称、Wiki 译名或 ID",
    "英語名、Wiki翻訳名またはID"
  ],
  [
    "Enter at least 2 characters (or one CJK character).",
    "Digite pelo menos 2 caracteres (ou um caractere CJK).",
    "Saisissez au moins 2 caractères (ou un caractère CJK).",
    "Mindestens 2 Zeichen eingeben (oder ein CJK-Zeichen).",
    "Introduce al menos 2 caracteres (o un carácter CJK).",
    "2자 이상 입력하세요 (한중일 문자는 1자도 가능).",
    "请输入至少 2 个字符（或 1 个中日韩字符）。",
    "2文字以上入力してください（CJK文字は1文字でも可）。"
  ]
];
const map=new Map(aliasUiRows.map(row=>[row[0],row]));
export function aliasText(lang,key){return map.get(key)?.[LOCALE_IDS.indexOf(lang)]??key;}
