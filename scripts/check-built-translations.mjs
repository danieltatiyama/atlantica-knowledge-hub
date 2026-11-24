import {readFileSync,existsSync,readdirSync} from "node:fs";
import assert from "node:assert/strict";
import {TARGET_LOCALES,parseGuide} from "./guide-translation-contract.mjs";
for(const lang of TARGET_LOCALES){
 const dir="src/content/guides/"+lang;
 if(!existsSync(dir))continue;
 for(const file of readdirSync(dir).filter(n=>n.endsWith(".md"))){
  const {meta}=parseGuide(readFileSync(dir+"/"+file,"utf8"));
  if(!meta.translationSourceHash)continue;
  const path="dist/"+lang+"/guides/"+file.slice(0,-3)+"/index.html";
  if(meta.draft)assert.ok(!existsSync(path),"Draft must not be publicly generated: "+path);
  else{
   assert.equal(meta.reviewStatus,"approved");
   assert.ok(existsSync(path),"Approved translation missing from build: "+path);
  }
 }
}
console.log("[IC] Verified managed translation publication gates in generated Astro output.");
