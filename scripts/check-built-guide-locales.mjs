import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {LOCALE_IDS,localePrefix,localeTag} from "../src/i18n/locales.mjs";
for(const lang of LOCALE_IDS){
 for(const path of ["/","/guides/"]){
  const file="dist"+localePrefix(lang)+path+"index.html";
  assert.ok(existsSync(file),"Missing generated page: "+file);
  const html=readFileSync(file,"utf8");
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
