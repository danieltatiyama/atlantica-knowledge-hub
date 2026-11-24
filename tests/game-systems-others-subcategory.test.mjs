import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const read=(path)=>readFileSync(path,"utf8");

test("Game Systems registers Others/Outros in the canonical guide taxonomy",()=>{
 const taxonomy=read("src/data/guide-taxonomy.ts");
 assert.match(taxonomy,/"others",\s*\] as const/);
 assert.match(taxonomy,/others:\s*\{\s*category: "game-systems",\s*labels: \{ en: "Others", "pt-br": "Outros" \}/);
 const content=read("src/content.config.ts");
 assert.ok(content.includes("z.enum(SUBCATEGORY_IDS)"));
 assert.ok(content.includes("GUIDE_SUBCATEGORIES[data.subcategory].category"));
 const list=read("src/components/GuidesPage.astro");
 assert.ok(list.includes("SUBCATEGORY_IDS.map"));
 assert.ok(list.includes("data-parent-category={subcategory.category}"));
 assert.ok(list.includes("data-guide-subcategory={guide.data.subcategory ??"));
});

test("Pages CMS exposes Others for preview/create and both editorial languages",()=>{
 const cms=read(".pages.yml");
 assert.equal((cms.match(/label: "Game Systems - Others"\s+value: others/g)||[]).length,2);
 assert.equal((cms.match(/name: others\s+label: "Game Systems - Others"/g)||[]).length,1);
 assert.equal((cms.match(/name: others\s+label: "Sistemas do Jogo - Outros"/g)||[]).length,1);
 assert.ok(cms.includes("name: equipment-enhancement"));
});

function preview(lang,template){
 return spawnSync(process.execPath,[
  "scripts/create-guide.mjs",
  "--lang",lang,
  "--template",template,
  "--title","Others taxonomy test",
  "--description","A short description for a game system",
  "--translation-key","others-taxonomy-test",
  "--subcategory","others",
 ],{encoding:"utf8"});
}

test("draft generator accepts Others under Game Systems in both languages",()=>{
 for(const lang of ["en","pt-br"]){
  const r=preview(lang,"game-systems");
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/subcategory: "others"/);
  assert.match(r.stdout,/category: "game-systems"/);
  assert.match(r.stdout,/Mode: DRY-RUN/);
 }
});

test("draft generator refuses to put Others under unrelated categories",()=>{
 for(const template of ["nation-dungeon","mercenaries"]){
  const r=preview("en",template);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/Subcategory does not match the selected template/);
 }
});
