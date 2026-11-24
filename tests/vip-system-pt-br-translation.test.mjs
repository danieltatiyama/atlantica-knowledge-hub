import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const english=readFileSync("src/content/guides/en/vip-system.md","utf8");
const portuguese=readFileSync("src/content/guides/pt-br/vip-system.md","utf8");
const getImages=source=>[...source.matchAll(/!\[[^\]]*\]\((\/images\/guides\/vip-system\/(?:image-\d+|vip-menu)\.png)\)/g)].map(x=>x[1]);

test("Portuguese VIP System is a published and approved translation of the same article",()=>{
 for(const field of ["translationKey: vip-system","category: game-systems",
   "subcategory: others","draft: false","reviewStatus: approved",
   "updatedAt: 2026-11-24"]){
  assert.ok(english.includes(field),field+" missing from English");
  assert.ok(portuguese.includes(field),field+" missing from Portuguese");
 }
 assert.match(english,/^lang: en$/m);
 assert.match(portuguese,/^lang: pt-br$/m);
 assert.match(portuguese,/^title: Sistema VIP$/m);
 assert.match(portuguese,/^## Visão geral$/m);
 assert.match(portuguese,/^## Como funciona$/m);
 assert.match(portuguese,/22 pontos de experiência gratuitos por dia/);
 assert.match(portuguese,/níveis VIP de 0 a 12/);
 assert.match(portuguese,/mercenária arqueira Sylvia/);
 assert.match(portuguese,/jogadores F2P/);
 assert.match(portuguese,/Aca VIP Shop/);
 assert.match(portuguese,/Olympus Tower/);
 assert.match(portuguese,/Buff Item Auto-Consume Slots/);
 assert.match(portuguese,/Atlantica VIP Material Bag/);
});

test("the Portuguese article shares the 16 exact image paths in the same order, without duplicating assets",()=>{
 const enImages=getImages(english);
 const ptImages=getImages(portuguese);
 assert.equal(enImages.length,16);
 assert.deepEqual(ptImages,enImages);
 assert.equal(new Set(ptImages).size,16);
 for(const url of ptImages)assert.ok(existsSync("public"+url),"Missing shared image: "+url);
 assert.ok(!portuguese.includes("](/images/guides/image-"),"Use article-scoped original assets");
});

test("the existing public route and language switch automatically discover both translations",()=>{
 const enRoute=readFileSync("src/pages/guides/[slug].astro","utf8");
 const ptRoute=readFileSync("src/pages/pt-br/guides/[slug].astro","utf8");
 const article=readFileSync("src/components/GuideArticle.astro","utf8");
 const index=readFileSync("src/components/GuidesPage.astro","utf8");
 assert.match(enRoute,/data\.lang === "en" && !data\.draft/);
 assert.match(ptRoute,/data\.lang === "pt-br" && !data\.draft/);
 assert.match(article,/data\.translationKey === guide\.data\.translationKey/);
 assert.match(article,/alternatePaths=\{alternatePaths\}/);
 assert.ok(index.includes("!guide.data.draft"));
});
