import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseGuide,readEnglishGuide,prepareTranslation,translationRequest,finishTranslation,translationState,TARGET_LOCALES,sha256} from "../scripts/guide-translation-contract.mjs";
const read=slug=>readFileSync("src/content/guides/en/"+slug+".md","utf8");
const source=read("vip-system"),slug="vip-system";
const images=s=>[...s.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]);
test("every target can prepare an approved English guide; all 16 images remain identical",()=>{
 for(const lang of TARGET_LOCALES){
  const plan=prepareTranslation(source,slug,lang),req=translationRequest(plan);
  const generated=finishTranslation(plan,req.segments,{provider:"test",model:"identity"});
  const {meta}=parseGuide(generated);
  assert.equal(meta.lang,lang);
  assert.equal(meta.translationKey,slug);
  assert.equal(meta.draft,true);
  assert.equal(meta.reviewStatus,"in-review");
  assert.equal(meta.translationSourceHash,sha256(source));
  assert.deepEqual(images(generated),images(source));
  assert.equal(images(generated).length,16);
  assert.ok(generated.includes("22 free experience"));
  assert.ok(generated.includes("Aca VIP Shop"));
 }
});
test("source approval, identity, reserved markup and protected tokens are enforced",()=>{
 assert.throws(()=>prepareTranslation(source.replace("draft: false","draft: true"),slug,"fr"));
 assert.throws(()=>prepareTranslation(source,"different","fr"));
 assert.throws(()=>prepareTranslation(source,slug,"en"));
 assert.throws(()=>prepareTranslation(source+"\n<script>alert(1)</script>\n",slug,"fr"));
 const p=prepareTranslation(source,slug,"fr"),segments=translationRequest(p).segments;
 const id=Object.keys(segments).find(k=>segments[k].includes("⟦AO"));
 assert.throws(()=>finishTranslation(p,{...segments,[id]:segments[id].replace(/⟦AO\d{5}⟧/,"")}));
 assert.throws(()=>finishTranslation(p,{...segments,s0:"<script>"}));
 assert.throws(()=>finishTranslation(p,{...segments,s0:segments.s0+" 999"}));
 assert.throws(()=>finishTranslation(p,{...segments,extra:"Injected"}));
 assert.throws(()=>finishTranslation(p,{...segments,s0:segments.s0+"\n# New heading"}));
});
test("plain English source and existing manual Portuguese article are protected",()=>{
 assert.equal(translationState(null,sha256(source)),"missing");
 const pt=readFileSync("src/content/guides/pt-br/vip-system.md","utf8");
 assert.equal(translationState(pt,sha256(source)),"manual-untracked");
 const p=prepareTranslation(source,slug,"ja"),draft=finishTranslation(p,translationRequest(p).segments);
 assert.equal(translationState(draft,sha256(source)),"awaiting-review");
 assert.equal(translationState(draft,"different"),"stale-draft");
 const published=draft.replace("draft: true","draft: false").replace("reviewStatus: in-review","reviewStatus: approved");
 assert.equal(translationState(published,sha256(source)),"current");
 assert.equal(translationState(published,"different"),"stale-published");
 assert.doesNotThrow(()=>prepareTranslation(read("nation-dungeon-planning"),"nation-dungeon-planning","de"));
 assert.throws(()=>readEnglishGuide(read("avalon-overview"),"avalon-overview"));
});
test("table structure and numbers are retained",()=>{
 const p=prepareTranslation(source+"\n| Name | Value |\n| --- | ---: |\n| Sylvia | 123 |\n",slug,"es");
 const output=finishTranslation(p,translationRequest(p).segments);
 assert.ok(output.includes("| --- | ---: |"));
 assert.ok(output.includes("| Sylvia | 123 |"));
});
