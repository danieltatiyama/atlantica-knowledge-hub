import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS,NEW_GUIDE_LOCALES,catalogPath,localePrefix,languageDestination,localizedPaths} from "../src/i18n/locales.mjs";
import {complementaryRows,complementaryText,hasComplementaryMessage} from "../src/i18n/complementary-ui.mjs";
import {complementarySourceKeys} from "../src/i18n/complementary-source-key-inventory.mjs";
test("all complementary messages have six additional locale translations",()=>{
 for(const row of complementaryRows){assert.equal(row.length,7);for(const v of row)assert.ok(v.trim());}
 for(const key of complementarySourceKeys)assert.ok(hasComplementaryMessage(key),key);
 for(const name of ["BoxCatalogPage","BoxArticle","EquipmentBoxOverview","LegendaryEnhancementPage","ExtendedEquipmentPage"]){
 const s=readFileSync("src/components/"+name+".astro","utf8");
 for(const match of s.matchAll(/complementaryText\(lang,"([^"]+)"/g))assert.ok(hasComplementaryMessage(match[1]),name+": "+match[1]);
 }
});
test("localized complementary destinations preserve exact supported paths",()=>{
 for(const lang of LOCALE_IDS){
 for(const path of ["/items/boxes/","/items/legendary/","/items/legendary/dell-artes-ambition/"]){
 assert.equal(catalogPath(lang,path),localePrefix(lang)+path);
 assert.equal(languageDestination({lang,path}),localePrefix(lang)+path);
 }
 const path="/items/boxes/spirit-equipment-box/";
 assert.equal(languageDestination({lang,path,itemAlternates:localizedPaths(path)}),localePrefix(lang)+path);
 }
});
test("dynamic messages keep values and source evidence",()=>{
 for(const lang of NEW_GUIDE_LOCALES){
 const key=complementaryRows.find(row=>row[0].startsWith("{unique} unique"))[0];
 const msg=complementaryText(lang,key,key,{unique:11,ambiguous:22,missing:33});
 for(const n of [11,22,33])assert.ok(msg.includes(String(n)));
 assert.notEqual(complementaryText(lang,"No outcome percentages are confirmed for this box. Raw client weights are not verified drop rates."),"No outcome percentages are confirmed for this box. Raw client weights are not verified drop rates.");
 }
});
