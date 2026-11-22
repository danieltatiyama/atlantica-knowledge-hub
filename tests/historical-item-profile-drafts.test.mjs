import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import {loadReviewedEquipmentNames} from "../scripts/read-reviewed-equipment-names.mjs";
import {wikidotCandidateUrl} from "../scripts/suggest-wikidot-item-pages.mjs";
import {makeHistoricalDraft} from "../scripts/prepare-historical-item-profile-drafts.mjs";
import {validateReviewedProfiles} from "../src/data/reviewed-equipment-profiles-gate.mjs";

const registry=loadReviewedEquipmentNames();
const existing=JSON.parse(readFileSync(fileURLToPath(
  new URL("../src/data/reviewed-equipment-profiles.json",import.meta.url)),"utf8"));
const candidate=Object.entries(registry).find(([id])=>
  !existing.records.some(x=>x.id===id));
if(!candidate)throw Error("All 551 items already have profiles");
const [id,name]=candidate;
const url=wikidotCandidateUrl(name);
const hash="a".repeat(64);
const audit={
  reviewVersion:"20.17-private",
  generatedAtUtc:"2026-11-22T22:00:00Z",
  sourceSite:"https://atlantica-online.wikidot.com",
  sourceLicenseNotice:"CC BY-SA 3.0 historical community",
  mode:"local-html",
  allRowsAreHistoricalUnverified:true,
  entries:[{
    itemId:id,reviewedNameEn:name,sourceUrl:url,
    sourceKind:"historical-community",
    editoriallyApproved:false,wikidotUrlVerified:false,
    status:"historical-draft",titleMatches:true,sourceSha256:hash,
    overview:{typeEn:"Sword",minimumLevel:1,eligibleClasses:["Swordsman"]},
    stats:[
      {enchantLevel:0,attackMin:40,attackMax:60,strength:5},
      {enchantLevel:1,attackMin:48,attackMax:72,strength:6},
      {enchantLevel:"L",attackMin:172,attackMax:258,strength:21},
    ],
    crafting:{productionPerBatch:1,requiredWorkload:450,
      requiredSkill:{nameEn:"Sword",level:1}},
    materials:[{nameEn:"Maple",quantity:4}],
  }],
  summary:{itemsRequested:1,parsedHistoricalDrafts:1,pendingReview:1,fetchedAndTitleMatched:0},
};
const one={
  itemId:id,sourceUrl:url,sourceSha256:hash,
  reviewerNote:"Source and original item name confirmed manually in browser.",
  approvedSections:["overview","stats","crafting","materials"],
  approvedStatLevels:[0,1],
  legendaryEligibleApproved:false,
  reviewerCheckedSource:true,
  acknowledgeHistoricalNotCurrent:true,
};
const approvals={manifestVersion:"20.18-approvals",items:[one]};
const clone=x=>JSON.parse(JSON.stringify(x));

test("explicit human selection yields a strict public-schema-valid DRAFT only",()=>{
  const result=makeHistoricalDraft(existing,audit,approvals,registry);
  assert.equal(result.existing,3);
  assert.equal(result.added,1);
  assert.equal(result.dataset.records.length,4);
  assert.equal(validateReviewedProfiles(result.dataset,registry).ok,true);
  const output=result.dataset.records.find(x=>x.id===id);
  assert.equal(output.nameEn,name);
  assert.deepEqual(output.stats,audit.entries[0].stats.slice(0,2));
  assert.equal(output.enchantmentProjectionModel,null);
  assert.equal(output.legendaryEligible,false);
  assert.equal(output.legendaryProjectionModel,null);
  assert.equal(output.evidence.stats,"community-reference");
  assert.equal(output.evidence.projections,"not-provided");
  assert.equal(output.evidence.references[0].url,url);
  assert.ok(!JSON.stringify(output).includes("reviewerNote"));
  assert.equal(output.stats.some(x=>x.enchantLevel==="L"),false);
});

test("no automatic approvals, no source hash changes, no replacements",()=>{
  for(const mutate of [
    (a,p)=>{p.items=[];},
    (a,p)=>{p.items[0].reviewerCheckedSource=false;},
    (a,p)=>{p.items[0].acknowledgeHistoricalNotCurrent=false;},
    (a,p)=>{p.items[0].reviewerNote="short";},
    (a,p)=>{p.items[0].sourceSha256="b".repeat(64);},
    (a,p)=>{p.items[0].sourceUrl="https://malicious.example";},
    (a,p)=>{p.items[0].approvedStatLevels=[5];},
    (a,p)=>{p.items[0].approvedSections=["stats","stats"];},
    (a,p)=>{p.items[0].approvedSections=["materials"];},
    (a,p)=>{a.entries[0].titleMatches=false;},
    (a,p)=>{a.entries[0].status="title-mismatch";},
    (a,p)=>{a.entries[0].editoriallyApproved=true;},
    (a,p)=>{a.entries[0].reviewedNameEn="Unrelated sword";},
    (a,p)=>{p.items[0].itemId="1";},
    (a,p)=>{p.items.push(clone(p.items[0]));},
    (a,p)=>{p.items[0].approvedStatLevels=["L"];},
    (a,p)=>{p.items[0].legendaryEligibleApproved=true;},
    (a,p)=>{p.items[0].approvedSections.push("recipe");},
  ]){
    const localAudit=clone(audit), localApproval=clone(approvals);
    mutate(localAudit,localApproval);
    assert.throws(()=>makeHistoricalDraft(existing,localAudit,localApproval,registry));
  }
});

test("source-reviewed L grade requires explicit per-item eligibility acknowledgement",()=>{
  const ready=clone(approvals);
  ready.items[0].approvedStatLevels=[0,1,"L"];
  ready.items[0].legendaryEligibleApproved=true;
  const result=makeHistoricalDraft(existing,audit,ready,registry);
  const selected=result.dataset.records.find(x=>x.id===id);
  assert.equal(selected.legendaryEligible,true);
  assert.equal(selected.legendaryProjectionModel,null);
  assert.equal(selected.evidence.legendary,"community-reference");
  assert.equal(selected.stats.at(-1).enchantLevel,"L");
});

test("partial approvals keep unknown sections genuinely empty",()=>{
  const only=clone(approvals);
  only.items[0].approvedSections=["stats"];
  only.items[0].approvedStatLevels=[0];
  const drafted=makeHistoricalDraft(existing,audit,only,registry);
  const rec=drafted.dataset.records.find(x=>x.id===id);
  assert.equal(rec.overview,null);
  assert.equal(rec.crafting,null);
  assert.equal(rec.evidence.overview,"not-provided");
  assert.equal(rec.evidence.materials,"not-provided");
});

test("category index row may contribute source-attributed +0 ONLY after explicit review",()=>{
  const indexAudit=clone(audit);
  indexAudit.entries[0].sourceScope="category-index";
  indexAudit.entries[0].itemNameMatchedInIndex=true;
  indexAudit.entries[0].categoryLabel="Axe";
  indexAudit.entries[0].indexedMinimumLevel=1;
  indexAudit.entries[0].overview=null;
  indexAudit.entries[0].crafting=null;
  indexAudit.entries[0].materials=[];
  indexAudit.entries[0].stats=[{enchantLevel:0,attackMin:60,attackMax:130,strength:7,vitality:6}];
  indexAudit.entries[0].sourceUrl="https://atlantica-online.wikidot.com/item:axe";
  const indexApproval=clone(approvals);
  indexApproval.items[0].sourceUrl=indexAudit.entries[0].sourceUrl;
  indexApproval.items[0].approvedSections=["stats"];
  indexApproval.items[0].approvedStatLevels=[0];
  const result=makeHistoricalDraft(existing,indexAudit,indexApproval,registry);
  const profile=result.dataset.records.find(x=>x.id===id);
  assert.equal(profile.overview,null);
  assert.equal(profile.crafting,null);
  assert.equal(profile.stats[0].attackMax,130);
  assert.equal(profile.evidence.references[0].url,"https://atlantica-online.wikidot.com/item:axe");
  assert.equal(profile.evidence.stats,"community-reference");
  indexAudit.entries[0].itemNameMatchedInIndex=false;
  assert.throws(()=>makeHistoricalDraft(existing,indexAudit,indexApproval,registry));
});

test("offline historical batch review page has no external scripts, network or storage APIs",()=>{
  const html=readFileSync(fileURLToPath(new URL("../tools/wikidot-batch-review.html",import.meta.url)),"utf8");
  assert.match(html,/connect-src 'none'/);
  assert.doesNotMatch(html,/<script[^>]+src=/);
  assert.doesNotMatch(html,/\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage)\s*\(/);
  const script=html.match(/<script>\s*([\s\S]*?)<\/script>/i);
  assert.ok(script);
  assert.doesNotThrow(()=>new vm.Script(script[1]));
  assert.match(script[1],/reviewerCheckedSource/);
  assert.match(script[1],/acknowledgeHistoricalNotCurrent/);
  assert.match(script[1],/legendaryEligibleApproved/);
  assert.match(script[1],/sourceSha256/);
  assert.match(script[1],/new Blob/);
});
