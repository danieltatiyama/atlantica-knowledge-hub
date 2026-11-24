import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS,NEW_GUIDE_LOCALES,localePrefix,equipmentProfilePath,languageDestination,localizedPaths} from "../src/i18n/locales.mjs";
import {equipmentRows,equipmentText,hasEquipmentMessage} from "../src/i18n/equipment-ui.mjs";
import {equipmentSourceKeys} from "../src/i18n/equipment-source-key-inventory.mjs";
const components=["ItemDetailPage","ClientSourceEquipmentPage","ClientEquipmentFactsSection","ClientItemAttributesSection","ClientItemStatSummary","ClientCraftingSummary","AtlanticaItemInfoPanel","ClientCraftingBacklinks","ClientRawRequirementsSection","ItemKnowledgeSections"];
test("all equipment-specific messages and shared UI references are present",()=>{
 const keys=new Set(equipmentRows.map(row=>row[0]));
 assert.equal(keys.size,equipmentRows.length);
 for(const key of equipmentSourceKeys)assert.ok(keys.has(key),key);
 for(const row of equipmentRows){
  assert.equal(row.length,7,row[0]);
  for(const value of row)assert.ok(value.trim(),row[0]);
  for(const [i,lang] of NEW_GUIDE_LOCALES.entries())assert.equal(equipmentText(lang,row[0]),row[i+1]);
 }
 for(const name of components){
  const source=readFileSync("src/components/"+name+".astro","utf8");
  assert.doesNotMatch(source,/\bpt\s*\?/);
  for(const [,key] of source.matchAll(/equipmentText\(lang,"([^"]+)"/g))assert.ok(hasEquipmentMessage(key),name+" "+key);
 }
 assert.equal(equipmentText("ko","Equipment overview"),"장비 개요");
 assert.equal(equipmentText("ja","Magic Defense"),"魔法防御力");
 assert.equal(equipmentText("pt-br","Grade","Grau"),"Grau");
 assert.equal(equipmentText("ko","{count} conflicting field(s)","",{count:3}),"충돌 필드 3개");
});
test("all equipment IDs have a localized destination without proliferating source-only static files",()=>{
 for(const lang of LOCALE_IDS){
  assert.equal(equipmentProfilePath(lang,"1",true),localePrefix(lang)+"/items/1/");
  const expected=NEW_GUIDE_LOCALES.includes(lang)?localePrefix(lang)+"/items/database/?id=5100":localePrefix(lang)+"/items/5100/";
  assert.equal(equipmentProfilePath(lang,"5100",false),expected);
  assert.equal(languageDestination({lang,path:"/items/5100/"}),expected);
  assert.equal(languageDestination({lang,path:"/items/1/",itemAlternates:localizedPaths("/items/1/")}),localePrefix(lang)+"/items/1/");
 }
 const route=readFileSync("src/pages/[locale]/items/[id].astro","utf8");
 assert.ok(route.includes("EQUIPMENT_ITEM_CATALOG_BY_ID.keys()"));
 assert.ok(!route.includes("FULL_CLIENT_EQUIPMENT_CATALOG.map"));
});
