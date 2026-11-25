// AI-assisted Wiki search aliases, not official regional client strings.
// Each row binds to an exact source kind, ID and English name (snapshot 1).
import {LOCALE_IDS} from "../i18n/locales.mjs";
import {materialAliasRows} from "./wiki-name-aliases-materials.mjs";
import {consumableAliasRows} from "./wiki-name-aliases-consumables.mjs";
import {equipmentAliasRows} from "./wiki-name-aliases-equipment.mjs";
export const nameAliasRows=[
  [
    "item",
    "2000",
    "Ginseng",
    "Ginseng",
    "Ginseng",
    "Ginseng",
    "Ginseng",
    "인삼",
    "人参",
    "高麗人参"
  ],
  [
    "item",
    "2012",
    "Green Mold",
    "Mofo verde",
    "Moisissure verte",
    "Grüner Schimmel",
    "Moho verde",
    "녹색 곰팡이",
    "绿色霉菌",
    "緑のカビ"
  ],
  [
    "item",
    "2031",
    "Chrysanthemum",
    "Crisântemo",
    "Chrysanthème",
    "Chrysantheme",
    "Crisantemo",
    "국화",
    "菊花",
    "菊"
  ],
  [
    "item",
    "2149",
    "Water of Life",
    "Água da Vida",
    "Eau de vie",
    "Wasser des Lebens",
    "Agua de Vida",
    "생명의 물",
    "生命之水",
    "生命の水"
  ],
  [
    "item",
    "3130",
    "Wheat",
    "Trigo",
    "Blé",
    "Weizen",
    "Trigo",
    "밀",
    "小麦",
    "小麦"
  ],
  [
    "item",
    "3135",
    "Pork",
    "Carne de porco",
    "Porc",
    "Schweinefleisch",
    "Carne de cerdo",
    "돼지고기",
    "猪肉",
    "豚肉"
  ],
  [
    "item",
    "3200",
    "Sesame Oil",
    "Óleo de gergelim",
    "Huile de sésame",
    "Sesamöl",
    "Aceite de sésamo",
    "참기름",
    "芝麻油",
    "ごま油"
  ],
  [
    "item",
    "3305",
    "Dumpling",
    "Bolinho recheado",
    "Ravioli",
    "Teigtasche",
    "Empanadilla",
    "만두",
    "饺子",
    "餃子"
  ],
  [
    "item",
    "3310",
    "Grilled Pork",
    "Carne de porco grelhada",
    "Porc grillé",
    "Gegrilltes Schweinefleisch",
    "Cerdo a la parrilla",
    "구운 돼지고기",
    "烤猪肉",
    "焼き豚"
  ],
  [
    "item",
    "5002",
    "Oil",
    "Óleo",
    "Huile",
    "Öl",
    "Aceite",
    "기름",
    "油",
    "油"
  ],
  [
    "item",
    "5020",
    "Copper Ore",
    "Minério de cobre",
    "Minerai de cuivre",
    "Kupfererz",
    "Mineral de cobre",
    "구리 광석",
    "铜矿石",
    "銅鉱石"
  ],
  [
    "item",
    "5045",
    "Gold Ingot",
    "Lingote de ouro",
    "Lingot d’or",
    "Goldbarren",
    "Lingote de oro",
    "금괴",
    "金锭",
    "金のインゴット"
  ],
  [
    "item",
    "5055",
    "Silver Ingot",
    "Lingote de prata",
    "Lingot d’argent",
    "Silberbarren",
    "Lingote de plata",
    "은괴",
    "银锭",
    "銀のインゴット"
  ],
  [
    "item",
    "5335",
    "Ruby",
    "Rubi",
    "Rubis",
    "Rubin",
    "Rubí",
    "루비",
    "红宝石",
    "ルビー"
  ],
  [
    "item",
    "5344",
    "Iron Ore",
    "Minério de ferro",
    "Minerai de fer",
    "Eisenerz",
    "Mineral de hierro",
    "철광석",
    "铁矿石",
    "鉄鉱石"
  ],
  [
    "item",
    "7050",
    "Thread",
    "Linha",
    "Fil",
    "Faden",
    "Hilo",
    "실",
    "线",
    "糸"
  ],
  [
    "item",
    "7070",
    "Gold Thread",
    "Linha de ouro",
    "Fil d’or",
    "Goldfaden",
    "Hilo de oro",
    "금실",
    "金线",
    "金糸"
  ],
  [
    "item",
    "7080",
    "Silver Thread",
    "Linha de prata",
    "Fil d’argent",
    "Silberfaden",
    "Hilo de plata",
    "은실",
    "银线",
    "銀糸"
  ],
  [
    "item",
    "7914",
    "Chinese Paper",
    "Papel chinês",
    "Papier chinois",
    "Chinesisches Papier",
    "Papel chino",
    "중국 종이",
    "中国纸",
    "中国紙"
  ],
  [
    "item",
    "16000",
    "Salt",
    "Sal",
    "Sel",
    "Salz",
    "Sal",
    "소금",
    "盐",
    "塩"
  ],
  [
    "monster",
    "289",
    "Huge Crocodile",
    "Crocodilo gigante",
    "Crocodile géant",
    "Riesenkrokodil",
    "Cocodrilo gigante",
    "거대 악어",
    "巨型鳄鱼",
    "巨大ワニ"
  ],
  ...materialAliasRows,
  ...consumableAliasRows,
  ...equipmentAliasRows
];
const aliases=new Map(nameAliasRows.map(row=>[row[0]+":"+row[1],row]));
export function wikiNameAlias(kind,id,sourceName,lang){
 const i=LOCALE_IDS.indexOf(lang);
 const row=aliases.get(kind+":"+String(id));
 if(i<=0||!row||row[2]!==sourceName)return null;
 return row[i+2]||null;
}
export function foldNameAlias(value){return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en").replace(/\s+/g," ").trim();}
export function matchesAliasText(alias,query){
 const haystack=foldNameAlias(alias),needle=foldNameAlias(query);
 return !!haystack&&!!needle&&(haystack.includes(needle)||needle.split(" ").every(word=>haystack.includes(word)));
}
export function matchesWikiNameAlias(kind,id,sourceName,lang,query){return matchesAliasText(wikiNameAlias(kind,id,sourceName,lang),query);}
