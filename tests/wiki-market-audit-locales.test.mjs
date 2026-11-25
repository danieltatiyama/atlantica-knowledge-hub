import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS,NEW_GUIDE_LOCALES,localePrefix,catalogPath,languageDestination,LOCALIZED_TOOL_PATHS} from "../src/i18n/locales.mjs";
import {marketAuditRows,marketAuditText,hasMarketAuditMessage} from "../src/i18n/market-audit-ui.mjs";
test("market and audit messages are translated, with preserved counts and source caveats",()=>{
 for(const row of marketAuditRows){
  assert.equal(row.length,7,row[0]);
  for(const value of row)assert.ok(value.trim(),row[0]);
  for(const [i,lang] of NEW_GUIDE_LOCALES.entries())assert.equal(marketAuditText(lang,row[0]),row[i+1]);
 }
 for(const name of ["MarketPriceCatalogPage","MarketPriceResearchPage","DataQualityPage"]){
  const source=readFileSync("src/components/"+name+".astro","utf8");
  assert.doesNotMatch(source,/\bpt\s*\?/);
  for(const [,key] of source.matchAll(/marketAuditText\(lang,"([^"]+)"/g))assert.ok(hasMarketAuditMessage(key),name+" "+key);
 }
 const key="Found {count} of 421 items";
 assert.equal(marketAuditText("ko",key,"",{count:15}),"421개 중 15개 검색됨");
 const warning="The 197 unmatched group references remain unresolved and are not inferred.";
 assert.ok(marketAuditText("ja",warning).includes("197"));
 assert.notEqual(marketAuditText("ja",warning),warning);
 const report="128/128 prices reported as matching the Market · source: player statement, Nov 23, 2026";
 for(const lang of NEW_GUIDE_LOCALES)assert.ok(marketAuditText(lang,report).includes("128/128"));
});
test("every tool has an explicit route for every locale",()=>{
 assert.equal(LOCALIZED_TOOL_PATHS.length,6);
 for(const lang of LOCALE_IDS)for(const path of LOCALIZED_TOOL_PATHS){
  assert.equal(catalogPath(lang,path),localePrefix(lang)+path);
  assert.equal(languageDestination({lang,path:"/pt-br"+path}),localePrefix(lang)+path);
  if(NEW_GUIDE_LOCALES.includes(lang))assert.ok(readFileSync("src/pages/[locale]"+path+"index.astro","utf8").includes("NEW_GUIDE_LOCALES"));
 }
});
