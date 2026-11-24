import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {sharedRows,sharedText,sectionAction} from "../src/i18n/shared-ui.mjs";
const components=["HomePage","GlobalSearch","FloatingWikiNavigator","ArticleImageLightbox","Header","Footer","GuideArticle","GuidesPage"].map(name=>"src/components/"+name+".astro").concat("src/layouts/BaseLayout.astro");
test("shared interface has complete translations and no duplicate keys",()=>{
 assert.equal(new Set(sharedRows.map(row=>row[0])).size,sharedRows.length);
 for(const row of sharedRows){
  assert.equal(row.length,LOCALE_IDS.length,row[0]);
  for(const [i,locale] of LOCALE_IDS.entries()){
   assert.ok(row[i].trim(),locale+" "+row[0]);
   assert.equal(sharedText(locale,row[0]),row[i]);
  }
 }
 for(const locale of ["ko","zh-hans","ja"]){
  for(const row of sharedRows) assert.match(sharedText(locale,row[0]),/[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,row[0]);
 }
});
test("all shared component calls reference registered strings",()=>{
 const keys=new Set(sharedRows.map(row=>row[0]));
 for(const path of components){
  const source=readFileSync(path,"utf8");
  const calls=[...source.matchAll(/sharedText\((?:lang|uiLang),"([^"]+)"\)/g)];
  assert.ok(calls.length,path);
  for(const [,key] of calls)assert.ok(keys.has(key),path+" "+key);
 }
 for(const path of ["src/components/GlobalSearch.astro","src/components/FloatingWikiNavigator.astro","src/components/ArticleImageLightbox.astro"]){
  const source=readFileSync(path,"utf8").replace('pt?"pt-br":"en"',"");
  assert.ok(source.includes("dataset.lang"),path);
  assert.doesNotMatch(source,/\bpt\s*\?\s*"[^"]*"\s*:\s*"[^"]*"/g,path+" untranslated conditional");
 }
});
test("section action labels preserve the heading and natural word order",()=>{
 assert.equal(sectionAction("ko",true,"VIP"),"VIP 펼치기");
 assert.equal(sectionAction("ja",false,"VIP"),"VIPを折りたたむ");
 assert.equal(sectionAction("de",true,"VIP"),"VIP ausklappen");
 for(const lang of LOCALE_IDS)for(const expanded of [true,false])assert.ok(sectionAction(lang,expanded,"VIP").includes("VIP"));
});
