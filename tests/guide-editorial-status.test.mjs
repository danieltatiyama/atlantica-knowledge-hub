import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parse} from "yaml";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {editorialReport} from "../scripts/guide-translation-report.mjs";
const locales=LOCALE_IDS.filter(lang=>lang!=="en");
const states=["manual-untracked","missing","awaiting-review","current","stale-draft","stale-published","current"];
const sample=locales.map((lang,i)=>({
 slug:"vip-system",lang,state:states[i],published:[0,3,5,6].includes(i),
 ...(i===2||i===5?{candidate:{path:"review.md",sha256:"example"}}:{})
}));
test("report separates published coverage, synchronization state and pending candidates",()=>{
 const text=editorialReport(sample,[{reason:"unsupported syntax"}]);
 assert.match(text,/Approved English source guides: 1/);
 assert.match(text,/Translation slots: 7/);
 assert.match(text,/Published translations: 4 \/ 7/);
 assert.match(text,/Review candidates: 2/);
 assert.match(text,/Request export exceptions: 1/);
 assert.match(text,/\| Source guide \| EN \| PT-BR \| FR \| DE \| ES \| KO \| ZH-HANS \| JA \|/);
 assert.match(text,/\| vip-system \| Source \| Manual \/ untracked \(public\) \| Missing \| Draft \/ review \+ candidate \| Current \(public\) \| Stale draft \| Stale published \(public\) \+ candidate \| Current \(public\) \|/);
 assert.match(text,/\| Current \| 2 \|/);
 assert.match(editorialReport([]),/Approved English source guides: 0/);
});
test("matrix rejects duplicate, unknown and incomplete translation rows",()=>{
 assert.throws(()=>editorialReport([...sample,sample[0]]),/Duplicate/);
 assert.throws(()=>editorialReport(sample.slice(1)),/Incomplete/);
 assert.throws(()=>editorialReport([{...sample[0],slug:"bad|slug"}]),/Invalid/);
});
test("Pages CMS has a read-only main report action and both approval fields",()=>{
 const cms=parse(readFileSync(".pages.yml","utf8"));
 const action=cms.actions.find(row=>row.name==="guide-translation-status");
 assert.equal(action.workflow,"guide-translation-requests.yml");
 assert.equal(action.ref,"main");
 assert.match(action.confirm.message,/No content is changed/);
 for(const lang of ["en","pt-br"]){
  const collection=cms.content.find(row=>row.name==="guides-"+lang);
  assert.ok(collection.view.fields.includes("reviewStatus"));
  assert.ok(collection.view.fields.includes("translationKey"));
  const approval=collection.fields.find(row=>row.name==="reviewStatus");
  assert.deepEqual(approval.options.values.map(row=>row.name),["draft","in-review","approved"]);
  assert.equal(approval.default,"draft");
  assert.equal(collection.fields.find(row=>row.name==="draft").default,true);
 }
 const workflow=readFileSync(".github/workflows/guide-translation-requests.yml","utf8");
 assert.match(workflow,/contents: read/);
 assert.match(workflow,/payload:\s*\n/);
 assert.match(workflow,/summary\.md.*GITHUB_STEP_SUMMARY/);
 assert.doesNotMatch(workflow,/contents: write|pull-requests: write|git push/);
});
