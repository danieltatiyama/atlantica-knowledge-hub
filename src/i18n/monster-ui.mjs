import {LOCALE_IDS} from "./locales.mjs";
import {monsterDbRows} from "./monster-db-rows.mjs";
import {monsterLootRows} from "./monster-loot-rows.mjs";
import {monsterSourceRows} from "./monster-source-rows.mjs";
export const monsterRowsByScope={db:monsterDbRows,loot:monsterLootRows,source:monsterSourceRows};
const maps=Object.fromEntries(Object.entries(monsterRowsByScope).map(([scope,rows])=>[scope,new Map(rows.map(row=>[row[0],row]))]));
export function monsterText(lang,scope,key){
 return maps[scope]?.get(key)?.[Math.max(0,LOCALE_IDS.indexOf(lang))]??key;
}
