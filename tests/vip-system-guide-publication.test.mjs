import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";

const guide=readFileSync("src/content/guides/en/vip-system.md","utf8");
const sourceImageFiles=["vip-menu.png",2,3,4,6,7,8,9,10,11,12,13,14,15,16,17].map(x=>typeof x==="number"?"image-"+x+".png":x);
const sourceImageHashes=["c0341bdaa2f9a4748ec8d26e7b7118f58363c96d","c81877a22e8ba04af0960751316b2e013480c101","fa8b62e28c38a79a6ad7b5412574893b54ba7d4e","370b446bace84b07c3c79229c1aa5071761ac40c","8340fd6ac82fcd1435c7d6e605af333de179a1ce","cd979f4675dc4bb4f0927fff0ab28da79676d4e6","9e3688cd264bdda8fa09e6c4bdd24f1bc083a166","d1938acaba0a507bc7f7c8e49b8be6ee4be16cc7","9d36e35278442ef6eaf6460b6bd0ce14ce2d012a","ad871cdf8156f5d938ff44f05429795d3da80bc6","0e0c347aae8e12b43dc6ff026036c3c2037eee12","f560344647cb1874a7d3555cd13009f2f547743f","42a5b9f288a58b17b51294ba0c2dcbcdf9dce58e","5ecc435b787bd36000d157bb433790a30dc8db2a","bb3c26e47859450f8b80e67de9ea71c16c931eff","a14b9c0f1a2b070e31521b21a4aba4045c6fd1e0"];

test("VIP System guide is explicitly approved and published in Others, Game Systems",()=>{
 assert.match(guide,/^title: VIP System$/m);
 assert.match(guide,/^translationKey: vip-system$/m);
 assert.match(guide,/^lang: en$/m);
 assert.match(guide,/^category: game-systems$/m);
 assert.match(guide,/^subcategory: others$/m);
 assert.match(guide,/^draft: false$/m);
 assert.match(guide,/^reviewStatus: approved$/m);
 assert.ok(!guide.includes("](/images/guides/image-"),"No generic unscoped image references");
});

test("all 16 guide images exist and match approved Git blobs (safe replacement + 15 originals)",()=>{
 const linked=[...guide.matchAll(/!\[[^\]]*\]\((\/images\/guides\/vip-system\/(?:image-\d+|vip-menu)\.png)\)/g)]
   .map(x=>x[1]);
 assert.equal(linked.length,sourceImageFiles.length);
 assert.equal(new Set(linked).size,sourceImageIds.length);
 for(let i=0;i<sourceImageFiles.length;i++){
  const filename=sourceImageFiles[i];
  const path="public/images/guides/vip-system/"+filename;
  assert.ok(linked.includes("/images/guides/vip-system/"+filename),filename);
  const data=readFileSync(path);
  assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a",filename);
  const blobHash=createHash("sha1")
    .update(Buffer.from("blob "+data.length+"\0"))
    .update(data).digest("hex");
  assert.equal(blobHash,sourceImageHashes[i],filename+" differs from reviewed file");
 }
 assert.ok(!existsSync("public/images/guides/vip-system/image-1.png"),
  "Remove the former publicly served screenshot containing player details");
});

test("the correct bilingual guide taxonomy and publishing schema remain intact",()=>{
 const taxonomy=readFileSync("src/data/guide-taxonomy.ts","utf8");
 const schema=readFileSync("src/content.config.ts","utf8");
 assert.match(taxonomy,/others:\s*\{\s*category: "game-systems"/);
 assert.match(schema,/data\.reviewStatus !== "approved"/);
 const listing=readFileSync("src/components/GuidesPage.astro","utf8");
 assert.ok(listing.includes("!guide.data.draft"));
});
