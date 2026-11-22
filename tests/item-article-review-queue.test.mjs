import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "../scripts/read-reviewed-equipment-names.mjs";
import {buildArticleReviewQueue} from "../scripts/item-article-review-queue.mjs";

const fixture=(path)=>JSON.parse(readFileSync(fileURLToPath(new URL(path,import.meta.url)),"utf8"));
const registry=loadReviewedEquipmentNames();
const profiles=fixture("../src/data/reviewed-equipment-profiles.json");
const approved=fixture("../src/data/approved-equipment-metadata.json");
const extended=fixture("../src/data/extended-equipment-facts.json");

test("every existing item gets one source-aware detail review record, without made-up stats",()=>{
  const {items,report}=buildArticleReviewQueue(registry,profiles,approved,extended);
  assert.equal(items.length,551);
  assert.equal(report.publicReviewedItems,551);
  assert.equal(new Set(items.map(x=>x.itemId)).size,551);
  assert.equal(report.editorialFullProfiles,7);
  assert.equal(report.editorialIncompleteProfiles,544);
  assert.equal(report.reviewedResearchItemsWithoutCatalogId,1);
  assert.equal(report.fieldCoverage.overview,7);
  assert.equal(report.fieldCoverage.enchantStats,7);
  assert.equal(report.fieldCoverage.crafting,7);
  assert.equal(report.fieldCoverage.materials,7);
  assert.equal(report.fieldCoverage.legendary,0);
  assert.equal(report.fieldCoverage.detailedEffects,0);
});

test("wikidot pages in review queue are strictly CANDIDATES, not verified links",()=>{
  const {items}=buildArticleReviewQueue(registry,profiles,approved,extended);
  const sword=items.find(x=>x.itemId==="1");
  assert.equal(sword.nameEn,"Spirit Sword");
  assert.equal(sword.completeness.enchantStats,true);
  assert.equal(sword.completeness.crafting,true);
  assert.equal(sword.wikidotUrlVerified,false);
  assert.equal(sword.wikidotCandidateUrl,"https://atlantica-online.wikidot.com/item:spirit-sword");
  const other=items.find(x=>x.itemId!=="1" && !x.completeness.overview);
  assert.equal(other.completeness.enchantStats,false);
  assert.equal(other.publication,"review-required");
});

test("Stage 20.11 local source groups provide classification, never field approval",()=>{
  const groupFile={
    reviewVersion:"20.11-private",snapshotId:1,
    items:[{itemId:"1",classification:"general-and-specific-overlap"}]
  };
  const {items,report}=buildArticleReviewQueue(registry,profiles,approved,extended,groupFile);
  assert.equal(report.sourceGroupsJoined,1);
  const first=items.find(x=>x.itemId==="1");
  assert.equal(first.sourceClassification,"general-and-specific-overlap");
  assert.equal(first.completeness.approvedClientFields,false);
  assert.equal(first.publication,"review-required");
});

test("queue rejects invalid curated source dataset or injected client files",()=>{
  for(const invalid of [
    ()=>buildArticleReviewQueue(registry,profiles,approved,
      {...extended,records:[{...extended.records[0],itemId:"192767"}]}),
    ()=>buildArticleReviewQueue(registry,profiles,approved,extended,
      {reviewVersion:"20.11-private",snapshotId:1,items:[{itemId:"1",classification:"single"},{itemId:"1",classification:"duplicate"}]}),
    ()=>buildArticleReviewQueue(registry,profiles,
      {...approved,records:[{id:"1",names:{en:"HACK"},fields:{recipe:"SECRET"},evidence:{status:"Verified",sources:[]}}]},
      extended),
  ]) assert.throws(invalid);
});
