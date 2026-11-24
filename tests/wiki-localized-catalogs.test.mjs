import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {LOCALE_IDS,NEW_GUIDE_LOCALES,LOCALIZED_CATALOG_PATHS,catalogPath,languageDestination,localePrefix,legacyLocale} from "../src/i18n/locales.mjs";
import {catalogRows,catalogText} from "../src/i18n/catalog-ui.mjs";
import {sharedRows} from "../src/i18n/shared-ui.mjs";
const read=path=>readFileSync(path,"utf8");
test("catalog dictionaries have a unique label in every locale",()=>{
 assert.equal(new Set(catalogRows.map(row=>row[0])).size,catalogRows.length);
 for(const row of catalogRows){
  assert.equal(row.length,8,row[0]);
  for(const [i,lang] of LOCALE_IDS.entries()){
   assert.ok(row[i].trim(),lang+" "+row[0]);
   assert.equal(catalogText(lang,row[0]),row[i]);
  }
 }
 assert.equal(catalogText("ko","Equipment Item Catalog"),"장비 도감");
 const keys=new Set([...catalogRows,...sharedRows].map(row=>row[0]));
 for(const path of ["ItemCatalogPage","EditorialHubPage","HomePage"]){
  const source=read("src/components/"+path+".astro");
  for(const [,key] of source.matchAll(/catalogText\(lang,"([^"]+)"\)/g))
   assert.ok(keys.has(key),path+" "+key);
 }
});
test("localized listing routes preserve locale and unsupported detail paths do not pretend to be translated",()=>{
 assert.deepEqual(LOCALIZED_CATALOG_PATHS,["/items/","/events/","/mercenaries/","/items/database/","/monsters/"]);
 for(const lang of LOCALE_IDS){
  for(const path of LOCALIZED_CATALOG_PATHS){
   assert.equal(catalogPath(lang,path),localePrefix(lang)+path);
   for(const from of LOCALE_IDS)assert.equal(languageDestination({lang,path:localePrefix(from)+path}),localePrefix(lang)+path);
  }
  assert.equal(catalogPath(lang,"/items/1/"),localePrefix(legacyLocale(lang))+"/items/1/");
 }
 for(const path of LOCALIZED_CATALOG_PATHS){
  assert.ok(read("src/pages/[locale]"+path+"index.astro").includes("NEW_GUIDE_LOCALES"));
  assert.ok(existsSync("src/pages"+path+"index.astro"));
  assert.ok(existsSync("src/pages/pt-br"+path+"index.astro"));
 }
 for(const page of ["Header","HomePage"]){
  const source=read("src/components/"+page+".astro");
  for(const path of LOCALIZED_CATALOG_PATHS)assert.ok(source.includes('catalogPath(lang,"'+path+'")'),page+path);
 }
});
test("equipment raw values and English identity remain unchanged and editorial fallback is gated",()=>{
 const catalog=read("src/components/ItemCatalogPage.astro");
 assert.ok(catalog.includes('const prefix=localePrefix(legacyLocale(lang))'));
 assert.ok(catalog.includes('href={prefix + "/items/" + item.id + "/"}'));
 assert.ok(catalog.includes('{item.nameEn}'));
 assert.ok(catalog.includes('data-category={item.sourceIndex.category}'));
 assert.ok(catalog.includes('data-level={item.sourceIndex.rawLevel??""}'));
 assert.ok(catalog.includes('Some linked pages and game names are still in English.'));
 const hub=read("src/components/EditorialHubPage.astro");
 assert.equal((hub.match(/!data.draft && data.reviewStatus === "approved" && data.evidenceStatus !== "client-config" && data.lang === contentLang/g)||[]).length,2);
 assert.ok(hub.includes('const contentLang=legacyLocale(lang)'));
 assert.ok(hub.includes('English articles are shown until reviewed translations are available.'));
});
