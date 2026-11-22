import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {EQUIPMENT_ITEM_NAMES_EN} from "../src/data/equipment-item-names-en.ts";
import {validateClientEquipmentFacts} from "../src/data/client-equipment-facts-gate.mjs";
import {validateLegendaryEligibility,crossReferenceLegendaryNames}
  from "../src/data/legendary-eligibility-reference-gate.mjs";

const read=(p)=>JSON.parse(readFileSync(fileURLToPath(new URL(p,import.meta.url)),"utf8"));
const client=read("../src/data/client-equipment-facts.json");
const legends=read("../src/data/legendary-eligibility-reference.json");
const clone=x=>JSON.parse(JSON.stringify(x));
const general={
  recordId:112473,file:"ItemTypeWeapon.ndt",role:"general",category:"Weapon",
  levelRaw:"1",gradeRaw:"NORMAL",workRaw:450,unitRaw:null,
  ingredientsStatus:"parsed-client-material",
  ingredients:[{itemId:"5100",quantity:5},{itemId:"6080",quantity:4}],
};
const specific={
  ...general,recordId:192767,file:"ItemTypeSword.ndt",role:"specific",
  category:"Sword",unitRaw:1,ingredientsStatus:"parsed-client-recipe",
};
const fixture={
  schemaVersion:"1.0",dataset:"client-equipment-facts",snapshotId:1,
  records:[{
    id:"1",nameEn:"Spirit Sword",origin:"game-client-extracted",
    identity:"official-base-name-match",
    sourceDefinitions:[general,specific],
    variantSourceSets:[
      {variantIndex:1,recordIds:[112473]},
      {variantIndex:2,recordIds:[192767]},
    ],
  }],
};

test("four prior Miner source-sample items are now populated with source-specific data",()=>{
  const r=validateClientEquipmentFacts(client,EQUIPMENT_ITEM_NAMES_EN);
  assert.equal(r.ok,true,r.errors.join("; "));
  assert.equal(r.records.length,4);
  assert.equal(client.snapshotId,1);
  assert.deepEqual(r.records.map(x=>x.id),["1","192","650","1211"]);
  const sword=r.records[0];
  assert.equal(sword.sourceDefinitions.length,2);
  assert.deepEqual(sword.sourceDefinitions[1].ingredients,[
    {itemId:"5100",quantity:5},{itemId:"6080",quantity:4}]);
  const twilight=r.records[1];
  assert.equal(twilight.sourceDefinitions[0].levelRaw,"165");
  assert.equal(twilight.sourceDefinitions[0].workRaw,550000000);
  assert.equal(twilight.sourceDefinitions[0].ingredients.length,6);
  const greaves=r.records[3];
  assert.equal(greaves.sourceDefinitions[1].category,"Pants");
  assert.equal(greaves.sourceDefinitions[1].ingredients.length,10);
  assert.ok(!JSON.stringify(client).includes("SECRET_PRIVATE_KOREAN"));
  assert.ok(!JSON.stringify(client).includes("5100(5)"));
});

test("a future empty client source layer remains schema-valid",()=>{
  const empty={schemaVersion:"1.0",dataset:"client-equipment-facts",snapshotId:null,records:[]};
  const checked=validateClientEquipmentFacts(empty,EQUIPMENT_ITEM_NAMES_EN);
  assert.equal(checked.ok,true,checked.errors.join("; "));
});

test("general and specific source facts remain separate under ONE reviewed item page",()=>{
  const r=validateClientEquipmentFacts(fixture,EQUIPMENT_ITEM_NAMES_EN);
  assert.equal(r.ok,true,r.errors.join("; "));
  assert.equal(r.records.length,1);
  assert.equal(r.records[0].variantSourceSets.length,2);
  assert.equal(r.records[0].sourceDefinitions[1].ingredients[1].quantity,4);
  assert.ok(!JSON.stringify(fixture).includes("5100(5)"));
});

test("rejects fake client IDs, invented fields, paths and missing variant definitions",()=>{
  for(const mut of [
    x=>{x.records[0].id="999999999";},
    x=>{x.records[0].nameEn="Different Sword";},
    x=>{x.snapshotId=null;},
    x=>{x.records[0].sourceDefinitions[0].file="C:\\PRIVATE\\ItemTypeWeapon.ndt";},
    x=>{x.records[0].sourceDefinitions[0].levelRaw="<script>";},
    x=>{x.records[0].sourceDefinitions[0].workRaw=-1;},
    x=>{x.records[0].sourceDefinitions[0].rawRecipe="5100(5)";},
    x=>{x.records[0].sourceDefinitions[0].ingredients[0].quantity=0;},
    x=>{x.records[0].variantSourceSets=[];},
    x=>{x.records[0].variantSourceSets[0].recordIds=[999];},
    x=>{x.records[0].variantSourceSets[1].recordIds=[112473];},
    x=>{x.records.push(clone(x.records[0]));},
  ]){
    const d=clone(fixture);mut(d);
    assert.equal(validateClientEquipmentFacts(d,EQUIPMENT_ITEM_NAMES_EN).ok,false);
  }
});

test("Fandom list has 47 historically eligible entries across 12 types",()=>{
  const check=validateLegendaryEligibility(legends);
  assert.equal(check.ok,true,check.errors.join("; "));
  assert.equal(check.records.length,47);
  assert.equal(new Set(check.records.map(x=>x.category)).size,12);
  assert.ok(check.records.some(x=>x.nameEn==="Guardian Sheath"&&x.category==="Shield"));
  assert.ok(check.records.some(x=>x.nameEn==="Excalibur"&&x.category==="Sword"));
  assert.ok(check.records.some(x=>x.nameEn==="Immortal Bow"&&x.category==="Bow"));
  assert.ok(check.records.some(x=>x.nameEn==="Dell'arte's Ambition"&&x.minimumLevel===180));
  assert.ok(check.records.every(x=>x.acquisition==="unknown"&&x.craftability==="unknown"));
  assert.ok(check.records.some(x=>x.nameEn==="Grimms' Magic Source"&&x.minimumLevel===null));
});

test("all 47 historic Legendary names remain unbound to the 551 box-only IDs",()=>{
  const joined=crossReferenceLegendaryNames(legends,EQUIPMENT_ITEM_NAMES_EN);
  assert.equal(joined.length,47);
  assert.equal(joined.filter(x=>x.identityStatus==="no-reviewed-id").length,47);
  assert.ok(joined.every(x=>x.matchingReviewedIds.length===0));
  assert.deepEqual(crossReferenceLegendaryNames(legends,{"901":"Excalibur"})
    .find(x=>x.nameEn==="Excalibur").matchingReviewedIds,["901"]);
});

test("Legendary reference gate rejects fake event sources and guessed client IDs",()=>{
  for(const mutate of [
    x=>{x.items[0].itemId="12345";},
    x=>{x.items[0].acquisition="event-only";},
    x=>{x.items[0].craftability="yes";},
    x=>{x.items[0].nameEn="Excalibur";},
    x=>{x.items[0].minimumLevel=-1;},
    x=>{x.source.url="https://untrusted.example";},
    x=>{x.items.push(clone(x.items[0]));},
  ]){
    const d=clone(legends);mutate(d);
    assert.equal(validateLegendaryEligibility(d).ok,false);
  }
});
