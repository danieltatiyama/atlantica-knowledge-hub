import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planGuidePublication} from "../scripts/guide-publication-plan.mjs";
const read=path=>readFileSync(path,"utf8");
const sample=["---",
 "title: VIP System","description: Test guide",
 "translationKey: vip-system","lang: en",
 "category: game-systems","subcategory: others",
 "updatedAt: 2026-11-24","draft: false","reviewStatus: approved","---",
 "## Screenshots",
 "![one](/images/guides/image-1.png)",
 "![again](/images/guides/image-1.png)",
 "![two](/images/guides/image-2.png)",
 ""].join("\n");
const originals=new Map([
 ["public/images/guides/image-1.png",Buffer.from("first image")],
 ["public/images/guides/image-2.png",Buffer.from("second image")],
]);
const readImage=path=>originals.get(path);

test("approved guide and screenshots are scoped without altering source bytes",()=>{
 const output=planGuidePublication({markdown:sample,lang:"en",slug:"vip-system",readSourceImage:readImage});
 assert.equal(output.articlePath,"src/content/guides/en/vip-system.md");
 assert.equal(output.imageCount,2);
 assert.equal(output.images[0].path,"public/images/guides/vip-system/image-1.png");
 assert.equal(output.images[1].path,"public/images/guides/vip-system/image-2.png");
 assert.equal(output.images[0].content,originals.get("public/images/guides/image-1.png"));
 assert.equal((output.content.match(/\/images\/guides\/vip-system\/image-1\.png/g)||[]).length,2);
 assert.ok(!output.content.includes("](/images/guides/image-1.png)"));
 assert.ok(output.content.includes("reviewStatus: approved"));
});

test("publication refuses drafts, unapproved content and mismatched identity",()=>{
 for(const markdown of [
  sample.replace("draft: false","draft: true"),
  sample.replace("reviewStatus: approved","reviewStatus: draft"),
  sample.replace("reviewStatus: approved",""),
  sample.replace("lang: en","lang: pt-br"),
  sample.replace("translationKey: vip-system","translationKey: other"),
 ]){
  assert.throws(()=>planGuidePublication({
   markdown,lang:"en",slug:"vip-system",readSourceImage:readImage,
  }));
 }
 assert.throws(()=>planGuidePublication({markdown:sample,lang:"en",slug:"../vip",readSourceImage:readImage}));
});

test("publication refuses unsafe image paths and missing images",()=>{
 assert.throws(()=>planGuidePublication({
  markdown:sample.replace("/images/guides/image-1.png","/images/guides/../secret.png"),
  lang:"en",slug:"vip-system",readSourceImage:readImage,
 }));
 assert.throws(()=>planGuidePublication({
  markdown:sample,lang:"en",slug:"vip-system",readSourceImage:()=>undefined,
 }));
 assert.throws(()=>planGuidePublication({
  markdown:sample,lang:"en",slug:"vip-system",readSourceImage:()=>Buffer.alloc(8000001),
 }));
});

test("CMS action offers an explicit PR, workflow never merges directly",()=>{
 const cms=read(".pages.yml");
 const action=read(".github/workflows/pages-cms-guide-publication.yml");
 const runner=read("scripts/request-guide-publication.mjs");
 assert.ok(cms.includes("name: request-guide-publication"));
 assert.ok(cms.includes("workflow: pages-cms-guide-publication.yml"));
 assert.ok(cms.includes("request a PR")||cms.includes("Request publication PR"));
 assert.ok(action.includes('ref: dev/i18n'));
 assert.ok(action.includes('GH_TOKEN:'));
 assert.ok(action.includes("workflow_dispatch:"));
 assert.ok(runner.includes('refs/heads/dev/i18n'));
 assert.ok(runner.includes('git(["checkout","-b",branchName,"origin/main"])'));
 assert.ok(runner.includes('git(["push","--set-upstream","origin",branchName])'));
 assert.ok(runner.includes('"pr","create"'));
 assert.ok(!runner.includes('"pr","merge"'));
 assert.ok(!runner.includes('"push","origin","HEAD:refs/heads/main"'));
});
