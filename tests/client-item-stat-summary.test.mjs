import test from "node:test";
import assert from "node:assert/strict";
import attributes from "../src/data/client-item-attributes.json" with {type:"json"};
import {
  withClientMovementSpeed,getMoveSpeedFromSourceRow,
  CLIENT_MOVEMENT_SOURCE_ROW_COUNT
} from "../src/data/client-movement-speed.mjs";
import {
  CLIENT_FIELDS,FIXED_ENCHANT_FIELDS,
  summarizeClientRawFields,
  buildHistoricalClientProjection,
  labelForClientField,
} from "../src/data/client-item-stat-summary.mjs";

const enriched=withClientMovementSpeed(attributes.records,attributes.snapshotId);
const get=id=>enriched.find(x=>x.id===String(id));

test("source-aware summaries preserve 551/551 matching client IDs, 1,031 source rows",()=>{
  assert.equal(attributes.records.length,551);
  assert.equal(attributes.records.reduce((sum,x)=>sum+x.sourceRows.length,0),1031);
  assert.equal(CLIENT_FIELDS.length,13);
  assert.deepEqual(FIXED_ENCHANT_FIELDS,["MagicDef","EV","MoveSpeed"]);
  let conflicting=0,partial=0;
  for(const item of enriched){
    const summary=summarizeClientRawFields(item);
    assert.equal(summary.sourceCount,item.sourceRows.length);
    assert.equal(summary.conflictCount,0,`conflicting field: ${item.nameEn}`);
    assert.equal(summary.allSourceRowNumbers.length,item.sourceRows.length);
    conflicting+=summary.conflictCount;
    partial+=summary.partialCount;
    for(const field of summary.fields){
      if(field.status==="consistent")assert.equal(field.observedIn,item.sourceRows.length);
      if(field.status==="partial")assert.ok(field.observedIn<item.sourceRows.length);
      assert.ok(field.status!=="conflict" || field.value===null);
    }
  }
  assert.equal(conflicting,0);
  assert.ok(partial>0);
});

test("Spirit Sword presents client base stats and a historical +1..+10 table without L",()=>{
  const item=get("1");
  const summary=summarizeClientRawFields(item);
  assert.equal(summary.byKey.get("MinDamage").value,"60");
  assert.equal(summary.byKey.get("MaxDamage").value,"90");
  assert.equal(summary.byKey.get("Str").value,"5");
  assert.equal(summary.byKey.get("Vit").value,"5");
  assert.equal(summary.byKey.get("MagicDef").value,"0");
  assert.ok(!summary.visibleGroups.some(group=>group.fields.some(field=>
    field.key==="MagicDef"&&field.value==="0")));
  const projection=buildHistoricalClientProjection(item);
  assert.equal(projection.rows.length,11);
  assert.deepEqual(projection.rows.map(row=>row.grade),[0,1,2,3,4,5,6,7,8,9,10]);
  assert.ok(projection.rows.every(row=>row.grade!=="L"));
  assert.equal(projection.rows[0].values.MinDamage,60);
  assert.equal(projection.rows[0].status,"client-raw-baseline");
  assert.equal(projection.rows[1].values.MinDamage,72);
  assert.equal(projection.rows[5].values.MaxDamage,189);
  assert.equal(projection.rows[10].values.MinDamage,240);
  assert.equal(projection.rows[10].values.MaxDamage,360);
  assert.equal(projection.rows[10].values.Str,20);
  assert.equal(projection.rows[10].status,"historical-estimate");
  assert.equal(projection.rows[10].values.MagicDef,"0");
  assert.ok(projection.fixedFields.some(f=>f.key==="MagicDef"));
});

test("physical AC scales in the historical preview, fixed EV and MagicDef never do",()=>{
  const shield=get("196");
  const view=summarizeClientRawFields(shield);
  assert.equal(view.byKey.get("AC").value,"15570");
  assert.equal(view.byKey.get("EV").value,"85");
  assert.equal(view.byKey.get("MagicDef").value,"198");
  const projection=buildHistoricalClientProjection(shield);
  assert.equal(projection.rows[10].values.AC,62280);
  assert.equal(projection.rows[10].values.Vit,1152);
  assert.equal(projection.rows[10].values.MagicDef,"198");
  assert.equal(projection.rows[10].values.EV,"85");
  assert.equal(projection.rows[0].values.MagicDef,"198");
  assert.equal(projection.rows[0].values.EV,"85");
  assert.equal(projection.rows[10].values.MoveSpeed,"0");
  assert.equal(projection.rows[10].values.CriticalPlus,undefined);
});

test("source Mag is projected only when integer, never by coercing decimals",()=>{
  const fractional=get("363");
  const summary=summarizeClientRawFields(fractional);
  assert.equal(summary.byKey.get("Mag").value,"292.5");
  const projection=buildHistoricalClientProjection(fractional);
  assert.ok(projection.excluded.includes("Mag"));
  assert.ok(projection.rows.every(row=>!Object.hasOwn(row.values,"Mag")));
  const phoenix=get("1420");
  assert.equal(summarizeClientRawFields(phoenix).byKey.get("Mag").value,"252");
  assert.equal(buildHistoricalClientProjection(phoenix).rows[10].values.Mag,1008);
});

test("missing source fields never turn into zero or a false divergence",()=>{
  const sample={
    id:"999",sourceRows:[
      {sourceRowNumber:10,fieldsRaw:{MinDamage:"50",AC:"0",MagicDef:"50"}},
      {sourceRowNumber:20,fieldsRaw:{MinDamage:"50",EV:"12",MagicDef:"50"}},
    ],
  };
  const view=summarizeClientRawFields(sample);
  assert.equal(view.conflictCount,0);
  assert.equal(view.byKey.get("AC").status,"partial");
  assert.equal(view.byKey.get("AC").value,"0");
  assert.equal(view.byKey.get("EV").status,"partial");
  assert.equal(view.byKey.get("EV").value,"12");
  assert.equal(view.byKey.get("MagicDef").status,"consistent");
  assert.equal(view.byKey.get("MinDamage").value,"50");
  const estimate=buildHistoricalClientProjection(sample);
  assert.equal(estimate.rows[10].values.MinDamage,200);
  assert.equal(estimate.rows[10].values.AC,undefined);
  assert.equal(estimate.rows[10].values.EV,"12");
  assert.ok(estimate.fixedFields.some(x=>x.key==="EV"&&x.status==="partial"));
});

test("actual conflicts must remain visible; no arbitrary definition wins",()=>{
  const sample={id:"10",sourceRows:[
    {sourceRowNumber:11,fieldsRaw:{MinDamage:"50",MaxDamage:"100",MagicDef:"100"}},
    {sourceRowNumber:12,fieldsRaw:{MinDamage:"60",MaxDamage:"100",MagicDef:"101"}},
  ]};
  const view=summarizeClientRawFields(sample);
  assert.equal(view.conflictCount,2);
  assert.deepEqual(view.byKey.get("MinDamage").observedValues,["50","60"]);
  assert.equal(view.byKey.get("MinDamage").value,null);
  assert.equal(view.byKey.get("MaxDamage").value,"100");
  assert.ok(view.visibleGroups.some(group=>group.fields.some(x=>x.status==="conflict")));
  const projection=buildHistoricalClientProjection(sample);
  assert.equal(projection.rows[10].values.MinDamage,undefined);
  assert.equal(projection.rows[10].values.MaxDamage,400);
  assert.equal(projection.rows[10].values.MagicDef,undefined);
  assert.ok(projection.excluded.includes("MinDamage"));
  assert.ok(projection.fixedConflicts.includes("MagicDef"));
});

test("invalid projected values and empty source rows are rejected or safely omitted",()=>{
  assert.throws(()=>summarizeClientRawFields({sourceRows:[]}),TypeError);
  assert.throws(()=>summarizeClientRawFields({sourceRows:[{sourceRowNumber:1,fieldsRaw:{Str:12}}]}),TypeError);
  assert.deepEqual(buildHistoricalClientProjection({
    sourceRows:[{sourceRowNumber:7,fieldsRaw:{Mag:"292.5",AC:"0"}}],
  }).rows,[]);
  assert.equal(labelForClientField("Str",true),"Força");
  assert.equal(labelForClientField("Str",false),"Strength");
});

test("MoveSpeed original Items.csv values: 381 verified source rows, no invented zeros",()=>{
  assert.equal(CLIENT_MOVEMENT_SOURCE_ROW_COUNT,381);
  assert.equal(getMoveSpeedFromSourceRow(17576),"0");
  assert.equal(getMoveSpeedFromSourceRow(1043),"10");
  assert.equal(getMoveSpeedFromSourceRow(1004),"4");
  assert.equal(getMoveSpeedFromSourceRow(999999),undefined);
  const found=enriched.filter(item=>item.sourceRows.some(r=>"MoveSpeed" in r.fieldsRaw));
  const nonzero=found.filter(item=>item.sourceRows.some(r=>Number(r.fieldsRaw.MoveSpeed)>0));
  assert.equal(found.length,329);
  assert.equal(nonzero.length,34);
  assert.equal(found.reduce((n,item)=>n+item.sourceRows.filter(r=>"MoveSpeed" in r.fieldsRaw).length,0),381);

  const boots=get("1506");
  assert.equal(summarizeClientRawFields(boots).byKey.get("MoveSpeed").value,"10");
  const bootGrades=buildHistoricalClientProjection(boots);
  assert.equal(bootGrades.rows.length,11);
  assert.ok(bootGrades.rows.every(row=>row.values.MoveSpeed==="10"));
  assert.equal(bootGrades.rows[10].values.MoveSpeed,bootGrades.rows[0].values.MoveSpeed);
  assert.ok(bootGrades.rows[10].values.AC>bootGrades.rows[0].values.AC);
  const conq=get("1516");
  assert.equal(buildHistoricalClientProjection(conq).rows[10].values.MoveSpeed,"4");
});

test("all 551 items expose +0..+10; fixed MagicDef/EV/MoveSpeed never multiply",()=>{
  for(const item of enriched){
    const preview=buildHistoricalClientProjection(item);
    assert.equal(preview.rows.length,11,item.nameEn+" lacks enhancement model");
    assert.deepEqual(preview.rows.map(row=>row.grade),[0,1,2,3,4,5,6,7,8,9,10]);
    assert.ok(preview.rows.every(row=>row.grade!=="L"),item.nameEn+" received an unauthorized L");
    for(const fixed of preview.fixedFields){
      assert.ok(FIXED_ENCHANT_FIELDS.includes(fixed.key));
      assert.equal(preview.rows[0].values[fixed.key],fixed.value);
      for(const row of preview.rows){
        assert.equal(row.values[fixed.key],fixed.value,
          item.nameEn+" incorrectly scaled fixed "+fixed.key);
      }
    }
    const core=new Set(["MinDamage","MaxDamage","AC","Str","Dex","Vit","Mag"]);
    for(const row of preview.rows){
      assert.ok(Object.keys(row.values).every(key=>
        core.has(key)||FIXED_ENCHANT_FIELDS.includes(key)));
      assert.ok(!Object.hasOwn(row.values,"HitRate"));
      assert.ok(!Object.hasOwn(row.values,"MagicSkillPlus"));
      assert.ok(!Object.hasOwn(row.values,"CriticalPlus"));
    }
  }
});

test("raw explicit zero is a FIXED source value, but absent fields stay absent",()=>{
  const fake={sourceRows:[
    {sourceRowNumber:101,fieldsRaw:{Str:"10",MagicDef:"0",EV:"0"}},
    {sourceRowNumber:102,fieldsRaw:{Str:"10",MagicDef:"0"}},
  ]};
  const model=buildHistoricalClientProjection(fake);
  assert.equal(model.rows[0].values.MagicDef,"0");
  assert.equal(model.rows[10].values.MagicDef,"0");
  assert.equal(model.rows[10].values.EV,"0");
  assert.ok(model.fixedFields.some(f=>f.key==="EV"&&f.status==="partial"));
  assert.equal(model.rows[10].values.MoveSpeed,undefined);
  assert.equal(model.rows[10].values.Str,40);
});
