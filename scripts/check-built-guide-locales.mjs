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
for(const file of ["dist/guides/vip-system/index.html","dist/pt-br/guides/vip-system/index.html"])
 assert.ok(existsSync(file),"Missing pre-existing VIP route "+file);
console.log("[IC] Verified 16 generated home/guide-list pages, all eight hreflang tags and both existing VIP articles.");
