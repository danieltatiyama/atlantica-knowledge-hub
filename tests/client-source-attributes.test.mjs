import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {EQUIPMENT_ITEM_NAMES_EN} from "../src/data/equipment-item-names-en.ts";
import legends from "../src/data/legendary-eligibility-reference.json" with {type:"json"};
import {checkLegendaryClientCandidates}
  from "../src/data/legendary-client-name-candidates-gate.mjs";
import {validateClientItemAttributes}
  from "../src/data/client-item-attributes-gate.mjs";

const read=p=>JSON.parse(readFileSync(fileURLToPath(new URL(p,import.meta.url)),"utf8"));
const candidates=read("../src/data/legendary-client-name-candidates.json");
const attrs=read("../src/data/client-item-attributes.json");
const clone=x=>JSON.parse(JSON.stringify(x));

test("47 Fandom names are cross-referenced against all Miner client identities",()=>{
  const validated=checkLegendaryClientCandidates(candidates,legends);
  assert.equal(validated.ok,true,validated.errors.join("; "));
  assert.deepEqual(validated.counts,{exact:44,ambiguous:2,missing:1});
  const lookup=new Map(candidates.entries.map(row=>[row.nameEn,row]));
  assert.deepEqual(lookup.get("Excalibur").clientCandidates.map(x=>x.itemId),["151"]);
  assert.deepEqual(lookup.get("Guardian Sheath").clientCandidates.map(x=>x.itemId),["152"]);
  assert.deepEqual(lookup.get("Dell'arte's Ambition").clientCandidates.map(x=>x.itemId),["23810"]);
  assert.deepEqual(lookup.get("Immortal Bow").clientCandidates.map(x=>x.itemId),["429","437"]);
  assert.deepEqual(lookup.get("Lucifer's Rifle").clientCandidates.map(x=>x.itemId),["528","536"]);
  assert.deepEqual(lookup.get("Spartacus' Great Sword").clientCandidates,[]);
  assert.equal(lookup.get("Jupiter's Sword").clientCandidates[0].clientLevelRaw,"140");
  assert.equal(lookup.get("Jupiter's Sword").clientCandidates[0].recordIds[0],113340);
  assert.equal(lookup.get("Dell'arte's Ambition").clientCandidates[0].clientLevelRaw,"150");
  assert.ok(candidates.entries.every(e=>!Object.hasOwn(e,"canReachLegendary")));
});

test("client source candidate gate blocks fabricated IDs, guessed L status and provenance loss",()=>{
  for(const mutate of [
    x=>{x.entries[0].clientCandidates[0].itemId="0";},
    x=>{x.entries[0].clientCandidates[0].recordIds=[-1];},
    x=>{x.entries[0].clientCandidates[0].clientLevelRaw="<script>";},
    x=>{x.entries[0].clientCandidates[0].clientGradeRaw="DROP";},
    x=>{x.entries[0].clientCandidates[0].recordIds=[112681,112681];},
    x=>{x.entries[0].clientCandidates[0].canReachLegendary=true;},
    x=>{x.entries[0].clientMatchStatus="verified";},
    x=>{x.entries[0].nameEn="Fake Item";},
    x=>{x.entries[0].clientCandidates[0].itemId="151";},
    x=>{x.entries[0].clientCandidates=[];},
    x=>{x.entries.pop();},
  ]){
    const source=clone(candidates);mutate(source);
    assert.equal(checkLegendaryClientCandidates(source,legends).ok,false);
  }
});

const sample={
  schemaVersion:"1.0",dataset:"client-item-attributes",sourceDataset:"Items.csv",
  snapshotId:1,records:[
    {id:"1",nameEn:"Spirit Sword",identity:"exact-official-english-source-name",
      sourceRows:[
        {sourceRowNumber:1,fieldsRaw:{MinDamage:"125",MaxDamage:"300",AC:"-9",MagicDef:"0"}},
        {sourceRowNumber:2,fieldsRaw:{MinDamage:"126",MaxDamage:"310",Str:"15"}},
      ]}
  ]
};

test("raw client attributes are absent until actual local Items.csv export",()=>{
  const valid=validateClientItemAttributes(attrs,EQUIPMENT_ITEM_NAMES_EN);
  assert.equal(valid.ok,true,valid.errors.join("; "));
  assert.equal(valid.records.length,0);
  assert.equal(attrs.snapshotId,null);
});

test("source-row schema preserves only official raw numeric fields",()=>{
  const valid=validateClientItemAttributes(sample,EQUIPMENT_ITEM_NAMES_EN);
  assert.equal(valid.ok,true,valid.errors.join("; "));
  assert.equal(valid.records.length,1);
  assert.equal(valid.records[0].sourceRows.length,2);
  for(const mutation of [
    x=>{x.records[0].id="152";},
    x=>{x.records[0].nameEn="Fake";},
    x=>{x.records[0].sourceRows[0].fieldsRaw.AC="<script>";},
    x=>{x.records[0].sourceRows[0].fieldsRaw.AC="NaN";},
    x=>{x.records[0].sourceRows[0].fieldsRaw.AC="1e9";},
    x=>{x.records[0].sourceRows[0].fieldsRaw.RawPath="C:\\private";},
    x=>{x.records[0].sourceRows[0].sourceRowNumber=0;},
    x=>{x.records[0].sourceRows[1].sourceRowNumber=1;},
    x=>{x.records[0].sourceRows=[];},
    x=>{x.snapshotId=null;},
    x=>{x.records[0].isLiveServerValue=true;},
  ]){
    const broken=clone(sample);mutation(broken);
    assert.equal(validateClientItemAttributes(broken,EQUIPMENT_ITEM_NAMES_EN).ok,false);
  }
});
