import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {LOCALE_IDS,LOCALE_NAMES,NEW_GUIDE_LOCALES,localeTag,localePrefix,guidePath,localizedPaths,browserLocale,languageDestination,legacyLocale} from "../src/i18n/locales.mjs";
const read=path=>readFileSync(path,"utf8");
test("eight stable locale IDs, labels and BCP 47 tags",()=>{
 assert.deepEqual(LOCALE_IDS,["en","pt-br","fr","de","es","ko","zh-hans","ja"]);
 assert.deepEqual(Object.keys(LOCALE_NAMES),LOCALE_IDS);
 assert.equal(localeTag("pt-br"),"pt-BR");
 assert.equal(localeTag("zh-hans"),"zh-Hans");
 assert.equal(legacyLocale("de"),"en");
 assert.equal(legacyLocale("pt-br"),"pt-br");
 assert.deepEqual(NEW_GUIDE_LOCALES,LOCALE_IDS.slice(2));
 assert.equal(guidePath("en","vip-system"),"/guides/vip-system/");
 for(const lang of LOCALE_IDS.slice(1))assert.equal(guidePath(lang,"vip-system"),"/"+lang+"/guides/vip-system/");
 assert.equal(Object.keys(localizedPaths("/guides/")).length,8);
});
test("browser locale negotiation respects scripts, regional variants and unsupported languages",()=>{
 for(const [browser,expected] of [["pt-PT","pt-br"],["fr-CA","fr"],["de-DE","de"],["es-MX","es"],["ko-KR","ko"],["zh-CN","zh-hans"],["zh-Hans-SG","zh-hans"],["ja-JP","ja"],["en-US","en"],["zh-TW",null],["zh-Hant",null],["zh-HK",null],["ru-RU",null]])assert.equal(browserLocale(browser),expected,browser);
});
test("switching languages links only to real guide translations, listings, or supported legacy modules",()=>{
 const translations={en:"/guides/vip-system/","pt-br":"/pt-br/guides/vip-system/",ja:"/ja/guides/vip-system/"};
 assert.equal(languageDestination({lang:"ja",path:"/guides/vip-system/",guideAlternates:translations}),translations.ja);
 assert.equal(languageDestination({lang:"de",path:"/guides/vip-system/",guideAlternates:translations}),"/de/guides/");
 assert.equal(languageDestination({lang:"ko",path:"/fr/guides/"}),"/ko/guides/");
 assert.equal(languageDestination({lang:"fr",path:"/pt-br/items/database/"}),"/fr/items/database/");
 assert.equal(languageDestination({lang:"pt-br",path:"/items/database/"}),"/pt-br/items/database/");
 assert.equal(languageDestination({lang:"en",path:"/pt-br/mercenaries/some-slug/"}),"/mercenaries/");
 assert.equal(languageDestination({lang:"xx",path:"/"}),null);
});
test("all six extra dictionaries contain every existing English interface key",()=>{
 const original=read("src/i18n/ui.ts").split("const en = {")[1].split("} as const;")[0];
 const keys=[...original.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map(m=>m[1]).sort();
 assert.equal(keys.length,52);
 const extra=JSON.parse(read("src/i18n/extra-ui.ts").replace(/^export const extraUi = /,"").replace(/;\s*$/,""));
 for(const lang of NEW_GUIDE_LOCALES){
  assert.deepEqual(Object.keys(extra[lang]).sort(),keys,lang);
  for(const key of keys)assert.ok(extra[lang][key].trim(),lang+" "+key);
 }
});
test("new routes reuse components and original English/PT-BR paths remain unchanged",()=>{
 for(const path of ["src/pages/[locale]/index.astro","src/pages/[locale]/guides/index.astro","src/pages/[locale]/guides/[slug].astro"])
  assert.ok(read(path).includes("NEW_GUIDE_LOCALES"));
 for(const path of ["src/pages/index.astro","src/pages/pt-br/index.astro","src/pages/guides/[slug].astro","src/pages/pt-br/guides/[slug].astro"])
  assert.ok(existsSync(path),path);
 assert.ok(read("src/content.config.ts").includes("lang: z.enum(LOCALE_IDS)"));
 assert.ok(read("astro.config.mjs").includes("locales: [...LOCALE_IDS]"));
 assert.ok(read("src/components/Header.astro").includes("LOCALE_IDS.map(locale"));
 assert.ok(read("src/components/GuidesPage.astro").includes('localizedPaths("/guides/")'));
 assert.ok(read("src/components/HomePage.astro").includes('catalogPath(lang,"/tools/")'));
 assert.ok(read("src/components/GuideArticle.astro").includes("localeTag(lang)"));
});
