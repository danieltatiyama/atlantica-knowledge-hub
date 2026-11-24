import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {LOCALE_IDS,localePrefix,localeTag} from "../src/i18n/locales.mjs";
import {sharedText} from "../src/i18n/shared-ui.mjs";
import {catalogText} from "../src/i18n/catalog-ui.mjs";
import {itemDbText} from "../src/i18n/item-db-ui.mjs";
import {monsterText} from "../src/i18n/monster-ui.mjs";
import {legacyLocale} from "../src/i18n/locales.mjs";
for(const lang of LOCALE_IDS){
 for(const path of ["/","/guides/"]){
  const file="dist"+localePrefix(lang)+path+"index.html";
  assert.ok(existsSync(file),"Missing generated page: "+file);
  const html=readFileSync(file,"utf8");
  for(const key of ["Search the Wiki","Image viewer","On this page","Unofficial community resource."])assert.ok(html.includes(sharedText(lang,key)),file+" missing localized shared text "+key);
  if(path==="/")for(const key of ["Search items, monsters and guides","All Items","Mercenaries","Equipment & Boxes"])assert.ok(html.includes(sharedText(lang,key).replaceAll("&","&amp;")),file+" missing localized home text "+key);
  assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file+" missing language tag");
  for(const alternate of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(alternate)+'"'),file+" missing alternate "+alternate);
 }
}
// All eight published versions of the two reviewed public guides must resolve.
for(const slug of ["vip-system","nation-dungeon-planning"]){
 for(const lang of LOCALE_IDS){
  const file="dist"+localePrefix(lang)+"/guides/"+slug+"/index.html";
  assert.ok(existsSync(file),"Missing translated guide: "+file);
  const html=readFileSync(file,"utf8");
  assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file+" missing language tag");
  for(const alternate of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(alternate)+'"'),file+" missing guide alternate "+alternate);
 }
}
for(const lang of LOCALE_IDS){
 assert.ok(!existsSync("dist"+localePrefix(lang)+"/guides/avalon-overview/index.html"),"Unreviewed Avalon must remain unpublished");
}
console.log("[IC] Verified 16 localized entry pages and 16 guide pages, eight hreflang tags per page, and Avalon draft exclusion.");

for(const lang of LOCALE_IDS){
 const prefix=localePrefix(lang),legacyPrefix=localePrefix(legacyLocale(lang));
 for(const [path,key] of [["/items/","Equipment Item Catalog"],["/events/","Events & Updates"],["/mercenaries/","Mercenaries"]]){
  const file="dist"+prefix+path+"index.html";
  assert.ok(existsSync(file),file);
  const html=readFileSync(file,"utf8");
  assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
  assert.ok(html.includes(catalogText(lang,key).replaceAll("&","&amp;")),file+" missing localized title");
  for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'),file+" missing alternate "+locale);
  if(path==="/items/"){
   assert.equal((html.match(/\bdata-item-row(?:[\s=>])/g)||[]).length,2462,file+" equipment count");
   assert.ok(html.includes('href="'+legacyPrefix+'/items/1/"'),file+" original detail link");
   assert.ok(html.includes(catalogText(lang,"Search name or ID")),file);
  }
 }
}
console.log("[IC] Verified 24 localized equipment, event and mercenary listings.");

for(const lang of LOCALE_IDS){
 const prefix=localePrefix(lang);
 const file="dist"+prefix+"/items/database/index.html";
 assert.ok(existsSync(file),file);
 const html=readFileSync(file,"utf8");
 assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
 for(const key of ["Full client item database","Search items","Identity status","Original client numeric attributes","Compare equipment source attributes","ITEM INFORMATION"])
  assert.ok(html.includes(itemDbText(lang,key)),file+" missing translated key "+key);
 assert.ok(html.includes('href="'+prefix+'/items/"'),file+" localized catalog breadcrumb");
 assert.ok(html.includes('data-lang="'+lang+'"'),file+" client locale");
 for(const alternate of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(alternate)+'"'),file+" missing alternate "+alternate);
}
console.log("[IC] Verified eight localized full item database pages.");

for(const lang of LOCALE_IDS){
 const file="dist"+localePrefix(lang)+"/monsters/index.html";
 assert.ok(existsSync(file),file);
 const html=readFileSync(file,"utf8");
 assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
 for(const [scope,key] of [["db","Client creatures and drop sources"],["db","Browse by creature"],["loot","LOOT CODEX"],["loot","Original item name or ID"]])
  assert.ok(html.includes(monsterText(lang,scope,key)),file+" missing localized "+key);
 for(const alternate of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(alternate)+'"'),file+" missing alternate "+alternate);
}
console.log("[IC] Verified eight localized bestiary and loot codex pages.");
