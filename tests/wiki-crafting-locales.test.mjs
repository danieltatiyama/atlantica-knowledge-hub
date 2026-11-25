import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS,NEW_GUIDE_LOCALES,localePrefix,catalogPath,languageDestination} from "../src/i18n/locales.mjs";
import {craftingRows,craftingText,hasCraftingMessage} from "../src/i18n/crafting-ui.mjs";
test("crafting messages have six additional translations and preserve original Portuguese",()=>{
 assert.equal(new Set(craftingRows.map(r=>r[0])).size,craftingRows.length);
 for(const row of craftingRows){
  assert.equal(row.length,7);
  for(const value of row)assert.ok(value.trim(),row[0]);
  for(const [i,lang] of NEW_GUIDE_LOCALES.entries())assert.equal(craftingText(lang,row[0]),row[i+1]);
 }
 const source=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 assert.doesNotMatch(source,/\bpt\s*\?/);
 for(const [,key] of source.matchAll(/craftingText\(lang,"([^"]+)"/g))assert.ok(hasCraftingMessage(key),key);
 assert.equal(craftingText("pt-br","Craft","Fabricar"),"Fabricar");
 assert.equal(craftingText("ko","Craft"),"제작");
 assert.equal(craftingText("ja","Shopping list"),"買い物リスト");
 assert.ok(craftingText("ko","{count} empty prices filled with NPC reference (not Market-verified).","",{count:7}).includes("7"));
 for(const marker of ["atlantica.crafting.prices.v1","atlantica.crafting.priceOrigins.v1",'locale:lang','["ItemID","Name","Quantity","UnitPrice","TotalCost"]',"strictTargetBatch:true","planClientCrafting({"])assert.ok(source.includes(marker),marker);
});
test("crafting routes preserve locale and selected ItemID",()=>{
 for(const lang of LOCALE_IDS){
  assert.equal(catalogPath(lang,"/tools/crafting/"),localePrefix(lang)+"/tools/crafting/");
  assert.equal(languageDestination({lang,path:"/pt-br/tools/crafting/"}),localePrefix(lang)+"/tools/crafting/");
 }
 assert.ok(readFileSync("src/components/Header.astro","utf8").includes("|| isCraftingPlanner"));
});
