import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {prepareGuidePublication} from "../scripts/guide-publication-contract.mjs";

const read=path=>readFileSync(path,"utf8");
const example=(language="en",extra={})=>[
 "---",
 "title: Example Guide",
 "description: An approved test article",
 "translationKey: test-guide",
 "lang: "+language,
 "category: game-systems",
 "subcategory: others",
 "draft: "+(extra.draft??"false"),
 "reviewStatus: "+(extra.reviewStatus??"approved"),
 "---",
 "## Guide",
 "Some genuine player-authored guide text.",
 "![screenshot](/images/guides/image-1.png)",
 "![more](/images/guides/image-2.png)",
].join("\n");

test("approved public guide is relocated without rewriting user-authored text",()=>{
 const prepared=prepareGuidePublication(example(),{language:"en",translationKey:"test-guide"});
 assert.equal(prepared.path,"src/content/guides/en/test-guide.md");
 assert.match(prepared.markdown,/Some genuine player-authored guide text/);
 assert.match(prepared.markdown,/^draft: false$/m);
 assert.match(prepared.markdown,/^reviewStatus: approved$/m);
 assert.equal(prepared.imageCopies.length,2);
 assert.deepEqual(prepared.imageCopies,[
  {from:"public/images/guides/image-1.png",to:"public/images/guides/test-guide/image-1.png"},
  {from:"public/images/guides/image-2.png",to:"public/images/guides/test-guide/image-2.png"},
 ]);
 assert.ok(prepared.markdown.includes("](/images/guides/test-guide/image-1.png)"));
 assert.ok(!prepared.markdown.includes("](/images/guides/image-1.png)"));
});

test("both languages support properly approved Game Systems guides",()=>{
 for(const lang of ["en","pt-br"]){
  const prepared=prepareGuidePublication(example(lang),{language:lang,translationKey:"test-guide"});
  assert.equal(prepared.path,"src/content/guides/"+lang+"/test-guide.md");
  assert.equal(prepared.imageCopies.length,2);
 }
});

test("saving a draft or selecting review status alone cannot publish",()=>{
 for(const [draft,status] of [["true","approved"],["false","in-review"],["false","draft"]]){
  assert.throws(
   ()=>prepareGuidePublication(example("en",{draft,reviewStatus:status}),
     {language:"en",translationKey:"test-guide"}),
   /Draft = false and Editorial Status = Approved/,
  );
 }
});

test("reject mismatched identity and unsafe filenames or image paths",()=>{
 const valid=example();
 assert.throws(()=>prepareGuidePublication(valid,{language:"pt-br",translationKey:"test-guide"}));
 assert.throws(()=>prepareGuidePublication(valid,{language:"en",translationKey:"../other"}));
 assert.throws(()=>prepareGuidePublication(valid,{language:"en",translationKey:"test-guide/child"}));
 assert.throws(()=>prepareGuidePublication(valid,{language:"en",translationKey:"a".repeat(81)}));
 assert.throws(()=>prepareGuidePublication(valid.replace(
  "/images/guides/image-1.png","/images/guides/../image-1.png"),
  {language:"en",translationKey:"test-guide"}),
  /unsafe guide image URL/);
 assert.throws(()=>prepareGuidePublication(valid.replace(
  "/images/guides/image-2.png","/images/guides/another/image-1.png"),
  {language:"en",translationKey:"test-guide"}),
  /same target filename/);
});

test("CMS action is explicit about submitting a PR rather than direct publication",()=>{
 const cms=read(".pages.yml");
 const workflow=read(".github/workflows/pages-cms-guide-submit.yml");
 assert.equal((cms.match(/- name: submit-guide-publication/g)||[]).length,1);
 assert.ok(cms.includes("workflow: pages-cms-guide-submit.yml"));
 assert.ok(cms.includes("Create publication PR"));
 assert.ok(cms.includes("website updates only after review, merge and deployment"));
 assert.ok(cms.includes('Set Draft')===false,"CMS descriptions should use actual field instructions");
 assert.ok(workflow.includes('refs/heads/dev/i18n'));
 assert.ok(workflow.includes('prepareGuidePublication(authored,{language,translationKey})'));
 assert.ok(workflow.includes('gh pr create'));
 assert.ok(workflow.includes('--base main'));
 assert.ok(workflow.includes('gh workflow run validate-pr.yml'));
 assert.ok(!workflow.includes('git push origin "HEAD:refs/heads/main"'));
});
