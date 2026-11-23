import test from "node:test";
import assert from "node:assert/strict";
import {generateClientGradeCSV,GRADE_EXPORT_KEYS}
  from "../scripts/generate-client-grade-csv.mjs";

const csv=generateClientGradeCSV();
const lines=csv.trimEnd().split("\n");
const header=lines[0].split(",");
const find=(id,grade)=>{
  const match=lines.slice(1).find(line=>line.startsWith(id+",")&&
    line.split(",")[2]==="+"+grade);
  assert.ok(match,"Missing CSV "+id+" +"+grade);
  return Object.fromEntries(header.map((k,i)=>[k,match.split(",")[i]]));
};

test("static CSV output includes 551 × 11 grades, complete explicit provenance",()=>{
  assert.equal(lines.length,6062);
  assert.equal(header.length,18);
  assert.deepEqual(header.slice(5,15),GRADE_EXPORT_KEYS);
  assert.ok(lines.every(line=>!line.includes("PRIVATE")&&!line.includes("C:\\\\")));
  const everyID=new Map();
  for(const line of lines.slice(1)){
    assert.ok(!line.endsWith(",L"));
    const id=line.split(",")[0],grade=line.split(",")[2];
    everyID.set(id,(everyID.get(id)??0)+1);
    assert.match(grade,/^\+(?:10|[0-9])$/);
  }
  assert.equal(everyID.size,551);
  assert.ok([...everyID.values()].every(n=>n===11));
  const source= find("1",0);
  assert.equal(source.item_name_en,"Spirit Sword");
  assert.equal(source.MinDamage,"60");
  assert.equal(source.MaxDamage,"90");
  assert.equal(source.scalable_values_origin,"client-raw-baseline");
  assert.match(source.original_source_rows,/11299/);
  assert.equal(find("1",10).MinDamage,"240");
  assert.equal(find("1",10).MaxDamage,"360");
  assert.equal(find("1",10).scalable_values_origin,"historical-estimate");
});

test("CSV fixed client values NEVER change from +0 through +10",()=>{
  const keys=["MagicDef","EV","MoveSpeed"];
  for(const [id,expectation]of [
    ["196",{MagicDef:"198",EV:"85",MoveSpeed:"0"}],
    ["1506",{MoveSpeed:"10"}],
    ["1516",{MoveSpeed:"4"}],
    ["1",{MagicDef:"0",EV:"",MoveSpeed:""}]
  ]){
    const initial=find(id,0);
    for(const [key,value]of Object.entries(expectation))
      assert.equal(initial[key],value);
    for(let grade=1;grade<=10;grade++){
      const next=find(id,grade);
      for(const key of keys){
        assert.equal(next[key],initial[key],id+" "+key+" upgraded at +"+grade);
      }
    }
  }
});

test("fractional Mag stays raw only at +0; later grades are empty, never invented",()=>{
  assert.equal(find("363",0).Mag,"292.5");
  for(let grade=1;grade<=10;grade++)assert.equal(find("363",grade).Mag,"");
  assert.equal(find("1420",0).Mag,"252");
  assert.equal(find("1420",10).Mag,"1008");
});

test("CSV is deterministic and blocks datasets outside existing reviewed snapshot",()=>{
  assert.equal(generateClientGradeCSV(),csv);
  assert.throws(()=>generateClientGradeCSV({snapshotId:2,records:[]}));
  assert.throws(()=>generateClientGradeCSV({snapshotId:1,records:[]}));
  assert.ok(!csv.includes("\nL,"));
  assert.ok(!csv.includes("drop_probability"));
});
