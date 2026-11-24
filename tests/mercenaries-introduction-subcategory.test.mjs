import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {SUBCATEGORY_IDS, GUIDE_SUBCATEGORIES, guideSubcategoryLabel} from "../src/data/guide-taxonomy.ts";

test("Introduction belongs to Mercenaries and precedes Skills",()=>{
 assert.equal(GUIDE_SUBCATEGORIES.introduction.category,"mercenaries");
 assert.equal(SUBCATEGORY_IDS.indexOf("introduction")+1,SUBCATEGORY_IDS.indexOf("skills"));
 const labels={en:"Introduction","pt-br":"Introdução",fr:"Introduction",de:"Einführung",es:"Introducción",ko:"소개","zh-hans":"入门",ja:"入門"};
 for(const [lang,label] of Object.entries(labels)) assert.equal(guideSubcategoryLabel("introduction",lang),label);
 assert.equal(guideSubcategoryLabel("skills","fr"),"Compétences");
 assert.equal(guideSubcategoryLabel("others","ja"),"その他");
});

test("Pages CMS offers Introduction in both actions and both guide collections",()=>{
 const cms=readFileSync(".pages.yml","utf8");
 assert.equal((cms.match(/label: "Mercenaries - Introduction"\s+value: introduction/g)||[]).length,2);
 assert.equal((cms.match(/name: introduction\s+label: "Mercenaries - Introduction"/g)||[]).length,1);
 assert.equal((cms.match(/name: introduction\s+label: "Mercenários - Introdução"/g)||[]).length,1);
});

function preview(lang,template){
 return spawnSync(process.execPath,["scripts/create-guide.mjs","--lang",lang,"--template",template,"--title","Introduction taxonomy test","--description","Mercenary introduction test","--translation-key","introduction-taxonomy-test","--subcategory","introduction"],{encoding:"utf8"});
}
test("generator accepts Introduction for Mercenaries only",()=>{
 for(const lang of ["en","pt-br"]){
  const r=preview(lang,"mercenaries");
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/subcategory: "introduction"/);
  assert.match(r.stdout,/category: "mercenaries"/);
  assert.match(r.stdout,/Mode: DRY-RUN/);
 }
 for(const template of ["nation-dungeon","game-systems"]){
  const r=preview("en",template);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/Subcategory does not match the selected template/);
 }
});
