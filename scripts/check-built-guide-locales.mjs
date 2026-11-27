import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {LOCALE_IDS,localePrefix,localeTag} from "../src/i18n/locales.mjs";
import {aliasText} from "../src/i18n/name-alias-ui.mjs";
import {sharedText} from "../src/i18n/shared-ui.mjs";
import {catalogText} from "../src/i18n/catalog-ui.mjs";
import {itemDbText} from "../src/i18n/item-db-ui.mjs";
import {monsterText} from "../src/i18n/monster-ui.mjs";
import {legacyLocale,NEW_GUIDE_LOCALES} from "../src/i18n/locales.mjs";
import {marketAuditText} from "../src/i18n/market-audit-ui.mjs";
import {craftingText} from "../src/i18n/crafting-ui.mjs";
import {toolText} from "../src/i18n/tools-ui.mjs";
import {equipmentText} from "../src/i18n/equipment-ui.mjs";
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
   assert.ok(html.includes('href="'+prefix+'/items/1/"'),file+" original detail link");
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
 for(const key of ["Full client item database","Search items","Identity status","Additional filters","Compare equipment source attributes","ITEM INFORMATION"])
  assert.ok(html.includes(itemDbText(lang,key)),file+" missing translated key "+key);
 assert.ok(html.includes('href="'+prefix+'/items/"'),file+" localized catalog breadcrumb");
 assert.ok(html.includes('data-lang="'+lang+'"'),file+" client locale");
 for(const cls of ["stats-workbench","catalog-info"]){
  const tag=html.match(new RegExp('<details[^>]*class="'+cls+'"[^>]*>'))?.[0];
  assert.ok(tag,file+" missing disclosure "+cls);
  assert.ok(!/\bopen(?:[\s=>])/.test(tag),file+" disclosure must start collapsed: "+cls);
 }

 for(const alternate of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(alternate)+'"'),file+" missing alternate "+alternate);
}
console.log("[IC] Verified eight localized full item database pages.");

for(const lang of LOCALE_IDS){
 const file="dist"+localePrefix(lang)+"/monsters/index.html";
 assert.ok(existsSync(file),file);
 const html=readFileSync(file,"utf8");
 assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
 for(const [scope,key] of [["db","Client creatures and drop sources"],["db","Browse by creature"],["loot","LOOT CODEX"]])
  assert.ok(html.includes(monsterText(lang,scope,key)),file+" missing localized "+key);
 for(const alternate of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(alternate)+'"'),file+" missing alternate "+alternate);
}
console.log("[IC] Verified eight localized bestiary and loot codex pages.");
for(const lang of LOCALE_IDS){const file="dist"+localePrefix(lang)+"/monsters/index.html";assert.ok(readFileSync(file,"utf8").includes(aliasText(lang,"English name, Wiki translation or ID")),file); }

for(const lang of LOCALE_IDS){
 const path="dist"+localePrefix(lang)+"/items/";
 const ids=readdirSync(path,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&/^[1-9]\d*$/.test(entry.name));
 assert.equal(ids.length,NEW_GUIDE_LOCALES.includes(lang)?551:2462,path+" equipment profiles");
 const html=readFileSync(path+"1/index.html","utf8");
 assert.ok(html.includes('lang="'+localeTag(lang)+'"'),path);
 for(const [en,pt] of [["EQUIPMENT ITEM CATALOG","CATÁLOGO DE EQUIPAMENTOS"],["Item sections","Seções do item"],["CLIENT SOURCE","DADOS DO CLIENTE"]])
  assert.ok(html.includes(equipmentText(lang,en,pt)),path+" missing "+en);
 for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'),path+" missing alternate "+locale);
 const catalog=readFileSync(path+"index.html","utf8");
 if(NEW_GUIDE_LOCALES.includes(lang))assert.ok(catalog.includes('href="/'+lang+'/items/profile/?id='),path+" source-only localized link");
}
function countFiles(directory){
 return readdirSync(directory,{withFileTypes:true}).reduce((sum,entry)=>sum+(entry.isDirectory()?countFiles(directory+"/"+entry.name):1),0);
}
const assetCount=countFiles("dist");
assert.ok(assetCount<=20000,"Static asset budget exceeded: "+assetCount);
console.log("[IC] Verified localized reviewed profiles and source-only explorer links. Static assets: "+assetCount+"/20000.");

for(const lang of LOCALE_IDS){
 const prefix=localePrefix(lang);
 for(const path of ["/items/boxes/","/items/boxes/spirit-equipment-box/","/items/legendary/","/items/legendary/dell-artes-ambition/"]){
  const file="dist"+prefix+path+"index.html";
  assert.ok(existsSync(file),file);
  const html=readFileSync(file,"utf8");
  assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
  for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'),file+" missing alternate "+locale);
 }
 const html=readFileSync("dist"+prefix+"/items/index.html","utf8");
 for(const path of ["/items/boxes/","/items/legendary/"])assert.ok(html.includes('href="'+prefix+path+'"'),prefix+" missing link "+path);
}
console.log("[IC] Verified localized boxes, legendary research and extended equipment pages.");

for(const lang of LOCALE_IDS){
 const prefix=localePrefix(lang);
 for(const [path,labels] of [["/tools/",[["Tools & calculators","Ferramentas e calculadoras"]]],["/tools/nation-dungeons/",[["Nation Dungeon calendar","Calendário de Nation Dungeons"],["Viewing timezone","Fuso horário da visualização"],["Save run","Salvar run"],["Ready","Disponível"]]]]){
 const file="dist"+prefix+path+"index.html";
 assert.ok(existsSync(file),file);
 const html=readFileSync(file,"utf8");
 assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
 for(const [en,pt] of labels)assert.ok(html.includes(toolText(lang,en,pt).replaceAll("&","&amp;")),file+" missing "+en);
 for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'),file+" missing alternate "+locale);
 }
 const hub=readFileSync("dist"+prefix+"/tools/index.html","utf8");
 assert.ok(hub.includes('href="'+prefix+'/tools/nation-dungeons/"'),prefix+" missing calendar link");
}
console.log("[IC] Verified eight localized tools hubs and nation dungeon calendars.");

for(const lang of LOCALE_IDS){
 const prefix=localePrefix(lang),file="dist"+prefix+"/tools/crafting/index.html";
 assert.ok(existsSync(file),file);
 const html=readFileSync(file,"utf8");
 for(const [en,pt] of [["Crafting calculator","Calculadora de fabricação"],["Calculate materials","Calcular materiais"],["Crafting tree","Árvore de receitas"]])
  assert.ok(html.includes(craftingText(lang,en,pt)),file+" missing "+en);
 for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'),file+" missing alternate "+locale);
 assert.ok(readFileSync("dist"+prefix+"/tools/index.html","utf8").includes('href="'+prefix+'/tools/crafting/"'),file);
}
console.log("[IC] Verified eight localized crafting planner pages.");

for(const lang of LOCALE_IDS){
 const prefix=localePrefix(lang);
 for(const [path,labels] of [["/tools/market-prices/",[["Market price catalog","Catálogo de preços do Market"],["Find item prices","Pesquisar itens"]]],["/tools/market-prices/research/",[["Market price research","Pesquisa de preços do Market"],["Candidates to check","Candidatos para verificação"]]],["/tools/data-quality/",[["Client data quality audit","Auditoria dos dados do cliente"],["Limitations","Ressalvas"]]]]){
 const file="dist"+prefix+path+"index.html";
 assert.ok(existsSync(file),file);
 const html=readFileSync(file,"utf8");
 assert.ok(html.includes('lang="'+localeTag(lang)+'"'),file);
 for(const [en,pt] of labels)assert.ok(html.includes(marketAuditText(lang,en,pt)),file+" missing "+en);
 for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'),file+" missing alternate "+locale);
 }
 const hub=readFileSync("dist"+prefix+"/tools/index.html","utf8");
 for(const path of ["/tools/market-prices/","/tools/data-quality/"])assert.ok(hub.includes('href="'+prefix+path+'"'),prefix+" missing "+path);
}
console.log("[IC] Verified eight localized market catalogs, observation workbenches and source audit pages.");

for(const lang of LOCALE_IDS){
 const html=readFileSync("dist"+localePrefix(lang)+"/items/profile/index.html","utf8");
 assert.ok(html.includes('data-profile="true"'));
 for(const locale of LOCALE_IDS)assert.ok(html.includes('hreflang="'+localeTag(locale)+'"'));
}
console.log("[IC] Verified eight dedicated item profile pages.");
