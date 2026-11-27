import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {itemDbRows,itemDbText} from "../src/i18n/item-db-ui.mjs";
import {CLIENT_FIELDS} from "../src/data/client-item-stat-summary.mjs";
import {formatLevelResolvedPercent} from "../src/data/client-monster-drop-resolver.mjs";

const page=readFileSync("src/components/FullClientItemDatabasePage.astro","utf8");
const tokens=text=>[...text.matchAll(/\{([a-z]+)\}/g)].map(m=>m[1]).sort();
test("all item database UI messages and field labels have eight translations",()=>{
 const keys=new Set(itemDbRows.map(r=>r[0]));
 assert.equal(keys.size,itemDbRows.length);
 for(const row of itemDbRows){
  assert.equal(row.length,LOCALE_IDS.length,row[0]);
  for(const [i,lang] of LOCALE_IDS.entries()){
   assert.ok(row[i].trim(),lang+" "+row[0]);
   assert.deepEqual(tokens(row[i]),tokens(row[0]),lang+" "+row[0]);
   assert.equal(itemDbText(lang,row[0]),row[i]);
  }
 }
 for(const [,key] of page.matchAll(/itemDbText\(lang,"([^"]+)"(?:,|\))/g))assert.ok(keys.has(key),key);
 for(const f of CLIENT_FIELDS)assert.ok(keys.has(f.en),f.key);
 assert.doesNotMatch(page,/\bpt\s*\?/);
 assert.equal(itemDbText("ko","Crafting materials"),"제작 재료");
 assert.equal(itemDbText("ja","Magic Defense"),"魔法防御力");
});
test("dynamic templates support word order and retain raw numbers and IDs",()=>{
 const args={found:"12",total:"23,586",named:"22,702"};
 for(const lang of LOCALE_IDS){
  const msg=itemDbText(lang,"{found} of {total} IDs found. {named} reconciled names.",args);
  for(const value of Object.values(args))assert.ok(msg.includes(value),lang);
  assert.equal(tokens(msg).length,0);
 }
 assert.equal(itemDbText("ko","Produces {count} per batch",{count:500}),"배치당 500개 생산");
 assert.equal(itemDbText("ja","ID {id} not found",{id:"7080"}),"ID 7080が見つかりません");
 assert.equal(formatLevelResolvedPercent(0.1234,"de"),"0,1234%");
 assert.equal(formatLevelResolvedPercent(0.1234,"ko"),"0.1234%");
 assert.equal(formatLevelResolvedPercent(null,"ja"),"—");
});
test("localized database preserves client source values, detail navigation and CSV format",()=>{
 for(const marker of ["manifest.totalIds!==23586","manifest.namedIds!==22702","matchesRawStat(indexedStats.get(row[0]),field,min,max)","summarizeCraftBatch(data.s,{equipment})","buildClientRecipeViews(data.s)","estimatedTwoStagePercent(r[5],r[6])","exportFilteredClientCsv(visible","pt,field:statField.value","a.href=localePrefix(lang)+\"/items/profile/?id=\"+encodeURIComponent(id)","prefix=localePrefix(legacyLocale(lang))","fmtRaw(row[3])","compareSourceStats(summaries,key)"])
  assert.ok(page.includes(marker),marker);
 const header=readFileSync("src/components/Header.astro","utf8");
 assert.ok(header.includes("isMonsterCatalog || isItemDatabase"));
 assert.ok(page.includes('CSV export uses the original English or Portuguese column format.'));
 assert.ok(page.includes('NOT verified live-server drop odds.'));
});
