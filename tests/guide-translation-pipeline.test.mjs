import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseGuide,readEnglishGuide,prepareTranslation,translationRequest,finishTranslation,translationState,TARGET_LOCALES,sha256,approveTranslation} from "../scripts/guide-translation-contract.mjs";
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

import {providerConfig,translateViaProvider} from "../scripts/guide-translation-provider.mjs";
test("pilot has six real translated drafts with unchanged shared image references",()=>{
 const pilot=JSON.parse(readFileSync("translation-pilot/vip-system.responses.json","utf8"));
 for(const lang of ["fr","de","es","ko","zh-hans","ja"]){
  const target=readFileSync("src/content/guides/"+lang+"/vip-system.md","utf8"),actual=parseGuide(target);
  assert.equal(actual.meta.lang,lang);
  assert.equal(actual.meta.translationKey,slug);
  if(actual.meta.translationSourceHash===sha256(source))assert.deepEqual(images(target),images(source));
  // The pilot response fixture is for one English revision. Editors can improve
  // or approve the generated articles without invalidating future builds.
  if(sha256(source)==="41c197718027a02a290828bdb974ca35ade0a903d69d8a54d0d42c95a7ce4ebe"){
   const p=prepareTranslation(source,slug,lang);
   const generated=finishTranslation(p,pilot.responses[lang],pilot);
   assert.deepEqual(images(generated),images(source));
   assert.notEqual(parseGuide(generated).meta.title,parseGuide(source).meta.title);
  }
 }
});
test("approval requires exact reviewed hashes and cannot replace manual or stale content",()=>{
 const p=prepareTranslation(source,slug,"fr");
 const candidate=finishTranslation(p,translationRequest(p).segments);
 const args={english:source,slug,lang:"fr",candidate,expectedCandidateHash:sha256(candidate),currentTarget:candidate,expectedTargetHash:sha256(candidate)};
 const approved=approveTranslation(args);
 assert.equal(parseGuide(approved).meta.draft,false);
 assert.equal(parseGuide(approved).meta.reviewStatus,"approved");
 assert.deepEqual(images(approved),images(source));
 assert.throws(()=>approveTranslation({...args,expectedCandidateHash:"wrong"}));
 assert.throws(()=>approveTranslation({...args,expectedTargetHash:"wrong"}));
 assert.throws(()=>approveTranslation({...args,english:source+"\nChanged source."}));
 const manual=candidate.replace(/^translationSourceHash:.*\n/m,"");
 assert.throws(()=>approveTranslation({...args,currentTarget:manual,expectedTargetHash:sha256(manual)}));
 const tampered=candidate.replace("/vip-menu.png","/wrong.png");
 assert.throws(()=>approveTranslation({...args,candidate:tampered,expectedCandidateHash:sha256(tampered),currentTarget:tampered,expectedTargetHash:sha256(tampered)}));
});
test("provider is disabled unless configured, bounded, and uses a mock rather than network",async()=>{
 assert.throws(()=>providerConfig({}));
 assert.throws(()=>providerConfig({GUIDE_TRANSLATION_ENABLED:"true"}));
 assert.throws(()=>providerConfig({GUIDE_TRANSLATION_ENABLED:"true",GUIDE_TRANSLATION_API_URL:"http://example.org",GUIDE_TRANSLATION_MODEL:"test"}));
 const config=providerConfig({GUIDE_TRANSLATION_ENABLED:"true",GUIDE_TRANSLATION_API_URL:"http://127.0.0.1:11434/v1/chat/completions",GUIDE_TRANSLATION_MODEL:"test",GUIDE_TRANSLATION_MAX_REQUESTS:"2"});
 assert.equal(config.limit,2);
 const req={targetLanguage:"fr",instructions:"Translate",segments:{s0:"Hello"}};
 const result=await translateViaProvider(req,config,async(url,options)=>{
  assert.equal(url,config.endpoint);
  assert.equal(options.redirect,"error");
  assert.ok(JSON.parse(options.body).messages[0].content.includes("Français"));
  assert.ok(!options.headers.Authorization);
  return {ok:true,text:async()=>JSON.stringify({choices:[{finish_reason:"stop",message:{content:'{"s0":"Bonjour"}'}}]})};
 });
 assert.equal(result.segments.s0,"Bonjour");
 await assert.rejects(()=>translateViaProvider(req,config,async()=>({ok:true,text:async()=>JSON.stringify({choices:[{message:{content:'{"s0":"Hello"}'}}]})})));
 await assert.rejects(()=>translateViaProvider(req,config,async()=>({ok:false,status:429})),/429/);
});

test("chat-assisted initial release retains source hashes, approved status and guide structure",()=>{
 for(const guideSlug of ["vip-system","nation-dungeon-planning"]){
  const en=read(guideSlug),original=parseGuide(en);
  for(const lang of ["fr","de","es","ko","zh-hans","ja"]){
   const raw=readFileSync("src/content/guides/"+lang+"/"+guideSlug+".md","utf8");
   const {meta,body}=parseGuide(raw);
   assert.equal(meta.translationKey,guideSlug);
   assert.equal(meta.lang,lang);
   assert.equal(meta.category,original.meta.category);
   assert.equal(meta.subcategory,original.meta.subcategory);
   assert.equal(meta.draft,false);
   assert.equal(meta.reviewStatus,"approved");
   assert.match(meta.translationSourceHash,/^[a-f0-9]{64}$/);
   const originalRevision=guideSlug==="vip-system"?"41c197718027a02a290828bdb974ca35ade0a903d69d8a54d0d42c95a7ce4ebe":"31e442c755913bb47bd64260bfd1eff5d1b1d12ff66b4b4f2009df728204a51a";
   if(sha256(en)===originalRevision){
    assert.equal(meta.translationSourceHash,sha256(en));
    assert.deepEqual(images(body),images(original.body));
    assert.equal((body.match(/^## /gm)??[]).length,(original.body.match(/^## /gm)??[]).length);
    assert.equal((body.match(/^- /gm)??[]).length,(original.body.match(/^- /gm)??[]).length);
    if(guideSlug==="vip-system"){
     assert.deepEqual(body.match(/\b\d+\b/g),original.body.match(/\b\d+\b/g));
     for(const term of ["Aca VIP Shop","Olympus Tower","HOT","ALVL","Buff Item Auto-Consume Slots","Atlantica VIP Material Bag","F2P","GC"])assert.ok(body.includes(term),lang+" "+term);
    }
   }
  }
 }
});
