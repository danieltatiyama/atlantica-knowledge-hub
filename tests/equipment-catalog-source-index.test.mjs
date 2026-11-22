import test from "node:test";
import assert from "node:assert/strict";
import sources from "../src/data/client-equipment-facts.json" with {type:"json"};
import attrs from "../src/data/client-item-attributes.json" with {type:"json"};
import {withClientMovementSpeed}
  from "../src/data/client-movement-speed.mjs";
import {getClientItemSourceOverview}
  from "../src/data/equipment-catalog-source-index.mjs";

const enriched=withClientMovementSpeed(attrs.records,attrs.snapshotId);
const byFacts=new Map(sources.records.map(item=>[item.id,item]));
const byAttrs=new Map(enriched.map(item=>[item.id,item]));
const get=id=>getClientItemSourceOverview(
  {id:String(id)},byFacts.get(String(id)),byAttrs.get(String(id)));

test("all 551 catalog items obtain source-based categories and raw levels",()=>{
  const counts=new Map();
  assert.equal(sources.records.length,551);
  for(const item of sources.records){
    const index=get(item.id);
    assert.ok(index.category);
    assert.match(index.rawLevel,/^(0|[1-9]\d*)$/);
    assert.equal(index.sourceConflictCount,0);
    counts.set(index.category,(counts.get(index.category)??0)+1);
  }
  assert.equal(counts.get("Sword"),20);
  assert.equal(counts.get("Boots"),52);
  assert.equal(counts.get("Defence"),46);
  assert.equal(counts.get("Weapon"),25);
  assert.equal(counts.size,20);
});

test("indexed raw +0 values are the client data, not scaled estimates",()=>{
  assert.deepEqual(
    Object.fromEntries(Object.entries(get(1)).filter(([key])=>
      ["category","rawLevel","minDamage","maxDamage","physicalAC"].includes(key))),
    {category:"Sword",rawLevel:"1",minDamage:"60",maxDamage:"90",physicalAC:"0"}
  );
  assert.equal(get(196).category,"Defence");
  assert.equal(get(196).physicalAC,"15570");
  assert.equal(get(196).magicDef,"198");
  assert.equal(get(196).evasion,"85");
  assert.equal(get(196).movement,"0");
  assert.equal(get(1506).category,"Boots");
  assert.equal(get(1506).movement,"10");
  assert.equal(get(1420).category,"Guitar"); // Original client category, not inferred taxonomy
  assert.equal(get(1420).rawLevel,"113");    // Raw client level, not a gameplay requirement
});

test("source index never invents missing fields, source categories or canonicalized conflicts",()=>{
  assert.throws(()=>getClientItemSourceOverview(
    {id:"1"},byFacts.get("196"),byAttrs.get("1")),TypeError);
  const item={id:"1",sourceDefinitions:[
    {role:"general",category:"Weapon",levelRaw:"10"},
    {role:"specific",category:"Axe",levelRaw:"10"},
    {role:"specific",category:"Sword",levelRaw:"11"},
  ]};
  const attrs={id:"1",sourceRows:[
    {sourceRowNumber:1,fieldsRaw:{MinDamage:"10"}},
    {sourceRowNumber:2,fieldsRaw:{MinDamage:"20"}},
  ]};
  const d=getClientItemSourceOverview({id:"1"},item,attrs);
  assert.equal(d.category,"Multiple sources");
  assert.equal(d.rawLevel,null);
  assert.equal(d.minDamage,null);
  assert.equal(d.sourceConflictCount,1);
  assert.equal(d.maxDamage,null);
  assert.equal(d.physicalAC,null);
  assert.equal(d.magicDef,null);
  assert.equal(d.evasion,null);
  assert.equal(d.movement,null);
});
