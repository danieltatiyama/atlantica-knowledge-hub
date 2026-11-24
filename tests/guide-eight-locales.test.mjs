import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {localeIds,localeNames,localeTags,localePaths,localePrefix,additionalLocales,isFullLocale,moduleLocale,browserLocale} from "../src/i18n/locales.mjs";
const read=path=>readFileSync(path,"utf8");
const images=text=>[...text.matchAll(/!\[[^\]]*\]\((\/images\/guides\/vip-system\/[^)\s]+)\)/g)].map(x=>x[1]);

test("eight stable locale IDs, native names, valid language tags and EN module fallback",()=>{
 assert.deepEqual(localeIds,["en","pt-br","fr","de","es","ko","zh-hans","ja"]);
 assert.equal(new Set(localeIds).size,8);
 for(const id of localeIds){
  assert.ok(localeNames[id]);
  assert.ok(Intl.getCanonicalLocales(localeTags[id]).length===1);
  assert.equal(localePaths("/guides/")[id],localePrefix(id)+"/guides/");
 }
 assert.equal(browserLocale(["it-IT","fr-FR"]),"fr");
 assert.equal(browserLocale(["zh-TW"]),"zh-hans");
 assert.equal(browserLocale(["pt-PT"]),"pt-br");
 assert.equal(browserLocale(["ja-JP"]),"ja");
 assert.equal(browserLocale(["en-GB","ja-JP"]),"en");
 assert.equal(browserLocale(["ru-RU"]),"en");
 for(const id of additionalLocales){
  assert.equal(isFullLocale(id),false);assert.equal(moduleLocale(id),"en");
 }
 assert.equal(moduleLocale("pt-br"),"pt-br");
});

test("all translated interface dictionaries cover every original key",()=>{
 const src=read("src/i18n/ui.ts");
 const en=src.slice(src.indexOf("const en ="),src.indexOf("const ptBr ="));
 const expected=[...en.matchAll(/"([^"]+)":/g)].map(x=>x[1]).sort();
 const extra=read("src/i18n/additional-ui.ts");
 const dictionaries=JSON.parse(extra.slice(extra.indexOf(" = ")+3,extra.indexOf(" satisfies")));
 assert.equal(expected.length,52);
 assert.deepEqual(Object.keys(dictionaries).sort(),[...additionalLocales].sort());
 for(const id of additionalLocales){
  assert.deepEqual(Object.keys(dictionaries[id]).sort(),expected);
  assert.ok(Object.values(dictionaries[id]).every(x=>typeof x==="string"&&x.trim().length));
 }
});

test("each locale has home, guide listing and article routes",()=>{
 for(const id of additionalLocales){
  assert.match(read("src/pages/"+id+"/index.astro"),new RegExp('HomePage lang="'+id+'"'));
  assert.match(read("src/pages/"+id+"/guides/index.astro"),new RegExp('GuidesPage lang="'+id+'"'));
  const detail=read("src/pages/"+id+"/guides/[slug].astro");
  assert.ok(detail.includes('data.lang === "'+id+'" && !data.draft'));
 }
 const header=read("src/components/Header.astro");
 const layout=read("src/layouts/BaseLayout.astro");
 assert.ok(header.includes("data-language-targets={JSON.stringify"));
 assert.ok(header.includes("localeIds.map"));
 assert.ok(header.includes("if (!isFullLocale(targetLang)) return prefix"));
 assert.ok(layout.includes("supportedLocales: localeIds"));
 assert.ok(layout.includes("localeTags[locale as Lang]"));
 assert.ok(read("src/content.config.ts").includes("lang: z.enum(localeIds)"));
 assert.ok(read("astro.config.mjs").includes("locales: [...localeIds]"));
 assert.ok(read("src/components/GlobalSearch.astro").includes('href:localePrefix(lang)+"/guides/"'));
});

test("VIP translations retain category, approval, original numeric claims and exactly 16 shared image references",()=>{
 const source=read("src/content/guides/en/vip-system.md");
 const expected=images(source);
 assert.equal(expected.length,16);
 assert.equal(expected[0],"/images/guides/vip-system/vip-menu.png");
 for(const id of localeIds){
  const guide=read("src/content/guides/"+id+"/vip-system.md");
  for(const field of ["translationKey: vip-system","lang: "+id,"category: game-systems","subcategory: others","draft: false","reviewStatus: approved"])
   assert.ok(guide.includes(field),id+": "+field);
  assert.deepEqual(images(guide),expected,id);
  const body=guide.split(/^---$/m).at(-1);
  assert.ok(body.includes("22")&&body.includes("12")&&body.includes("GC"),id);
  for(const term of ["Aca VIP Shop","ALVL","Olympus Tower","HOT","Buff Item Auto-Consume Slots","Atlantica VIP Material Bag","F2P"])
   assert.ok(body.includes(term),id+": "+term);
 }
 for(const image of expected)assert.ok(existsSync("public"+image),image);
 assert.ok(!existsSync("public/images/guides/vip-system/image-1.png"));
});
