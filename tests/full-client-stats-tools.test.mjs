import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
  RAW_STATS_FIELDS,summarizeRawNumericRows,comparableRawNumber,
  matchesRawStat,compareSourceStats,exportFilteredClientCsv,
} from "../src/data/full-client-stats-tools.mjs";

const raw=(...rows)=>summarizeRawNumericRows(rows);
const indexed=id=>[String(id),"=SUM(1+1)","Sword","3","NORMAL",2,"named",0,1];

test("stage 20.35 exposes only the 15 original source numeric fields",()=>{
  assert.equal(RAW_STATS_FIELDS.length,15);
  assert.equal(new Set(RAW_STATS_FIELDS.map(x=>x.key)).size,15);
  assert.ok(RAW_STATS_FIELDS.some(x=>x.key==="AC"));
  assert.ok(RAW_STATS_FIELDS.some(x=>x.key==="MagicDef"));
  assert.ok(RAW_STATS_FIELDS.some(x=>x.key==="MoveSpeed"));
  assert.ok(!RAW_STATS_FIELDS.some(x=>x.key==="Legendary"));
  assert.ok(!RAW_STATS_FIELDS.some(x=>x.key==="UpgradeEligible"));
});

test("missing, literal zero, partial and conflicts never become the same state",()=>{
  const a=raw(
    [101,{AC:"0",MagicDef:"-127",Str:"5",Vit:"10"}],
    [102,{AC:"0",Str:"7",Vit:"10"}],
  );
  assert.equal(a.sourceCount,2);
  assert.equal(a.fields.get("AC").status,"consistent");
  assert.equal(a.fields.get("AC").rawValue,"0");
  assert.equal(a.fields.get("MagicDef").status,"partial");
  assert.equal(a.fields.get("MagicDef").rawValue,"-127");
  assert.equal(a.fields.get("Str").status,"conflict");
  assert.equal(a.fields.get("Str").rawValue,null);
  assert.deepEqual(a.fields.get("Str").values,["5","7"]);
  assert.equal(a.fields.get("Vit").status,"consistent");
  assert.equal(a.fields.has("Dex"),false);
  assert.equal(comparableRawNumber(a,"Dex"),null);
  assert.equal(comparableRawNumber(a,"Str"),null);
  assert.equal(comparableRawNumber(a,"AC"),0);
  assert.equal(comparableRawNumber(a,"MagicDef"),-127);
  assert.equal(matchesRawStat(a,"AC",0,0),true);
  assert.equal(matchesRawStat(a,"AC",1,null),false);
  assert.equal(matchesRawStat(a,"Str",null,null),false);
  assert.equal(matchesRawStat(a,"Dex",null,null),false);
  assert.equal(matchesRawStat(a,"MagicDef",-127,-127),true);
  assert.equal(matchesRawStat(a,"MagicDef",-126,null),false);
});

test("the comparison's spread requires complete, non-conflicting client rows",()=>{
  const a=raw([1,{AC:"100",MagicDef:"25"}],[2,{AC:"100"}]);
  const b=raw([3,{AC:"150",MagicDef:"50"}],[4,{AC:"150",MagicDef:"50"}]);
  assert.equal(compareSourceStats([a,b],"AC").difference,50);
  assert.equal(compareSourceStats([a,b],"MagicDef").difference,null);
  const conflicting=raw([5,{AC:"9"}],[6,{AC:"12"}]);
  assert.equal(compareSourceStats([a,conflicting],"AC").difference,null);
  const missing=raw([7,{Vit:"1"}]);
  assert.equal(compareSourceStats([a,missing],"AC").difference,null);
  assert.equal(compareSourceStats([a,b],"Legendary"),null);
});

test("untrusted fields, invalid numeric values, and duplicate original row IDs are rejected",()=>{
  assert.throws(()=>raw([1,{Legendary:"1"}]),/Unapproved/);
  assert.throws(()=>raw([1,{AC:"Infinity"}]),/Unapproved/);
  assert.throws(()=>raw([1,{AC:"1e6"}]),/Unapproved/);
  assert.throws(()=>raw([1,{AC:"NaN"}]),/Unapproved/);
  assert.throws(()=>raw([1,{AC:100}]),/Unapproved/);
  assert.throws(()=>raw([1,{AC:"10"}],[1,{AC:"11"}]),/duplicate/);
  assert.throws(()=>raw(),/required/);
});

test("CSV exports all filtered rows, quotes safely, preserves source status and Excel safety",()=>{
  const a=raw([1,{AC:"0"}],[2,{AC:"0"}]);
  const csv=exportFilteredClientCsv([indexed(100),indexed(101)],{
    pt:true,field:"AC",summaries:new Map([["100",a]]),
  });
  assert.ok(csv.startsWith("\uFEFF"));
  assert.equal(csv.trimEnd().split("\r\n").length,3);
  assert.ok(csv.includes(";"));
  assert.ok(csv.includes('"\'=SUM(1+1)"'),"Excel formula must not execute");
  assert.ok(csv.includes('"0";"consistent"'));
  assert.ok(csv.includes('"";"absent"'),"Missing source field is not zero");
  assert.ok(!csv.includes("undefined"));
});

test("exported item names cannot inject CSV formulas or additional rows",()=>{
  const dangerous=["=HYPERLINK()",'+SUM(1)','-A2','@SUM(1)','"quoted"\r\nline'];
  const rows=dangerous.map((name,i)=>[
    String(i+1),name,"Sword","1","NORMAL",1,"named",0,0,
  ]);
  const csv=exportFilteredClientCsv(rows);
  assert.ok(csv.includes('"\'=HYPERLINK()"'));
  assert.ok(csv.includes('"\'-A2"'));
  assert.ok(csv.includes('"\'@SUM(1)"'));
  assert.ok(csv.includes('"""quoted""\r\nline"'));
  assert.throws(()=>exportFilteredClientCsv(rows,{field:"unapproved"}),/Unknown/);
});

test("all published 7,560 numeric source IDs and rows have valid status-preserving summaries",()=>{
  const root=resolve("public/data/client-items/stats");
  const meta=JSON.parse(readFileSync(resolve(root,"manifest.json"),"utf8"));
  assert.equal(meta.itemIds,7560);
  assert.equal(meta.sourceRows,9351);
  assert.equal(meta.files.length,28);
  const index=new Map();
  let rows=0,fields=0;
  for(const file of meta.files){
    const shard=JSON.parse(readFileSync(resolve(root,file),"utf8"));
    assert.equal(shard.snapshotId,1);
    assert.equal(shard.dataset,undefined);
    for(const [id,rawRows] of Object.entries(shard.items)){
      assert.ok(!index.has(id),"Duplicate source ID "+id);
      const stats=summarizeRawNumericRows(rawRows);
      index.set(id,stats);
      rows+=stats.sourceCount;
      for(const v of stats.fields.values()){
        fields+=v.observedIn;
        assert.ok(["consistent","partial","conflict"].includes(v.status));
      }
    }
  }
  assert.equal(index.size,7560);
  assert.equal(rows,9351);
  assert.equal(fields,71606);
});

test("full index page wires stat filters, export and comparison without dangerous HTML injection",()=>{
  const template=readFileSync("src/components/FullClientItemDatabasePage.astro","utf8");
  for(const id of ["db-stat-field","db-stat-min","db-stat-max","db-export",
    "db-compare-run","db-compare-clear","db-compare-selected","db-compare-result"]){
    assert.ok(template.includes('id="'+id+'"'),"Missing "+id);
  }
  assert.ok(template.includes("loadAllRawStats()"));
  assert.ok(template.includes("if(field&&!allStatsReady)"));
  assert.ok(template.includes("function runComparison()"));
  assert.ok(template.includes("compareSourceStats("));
  assert.ok(template.includes("exportFilteredClientCsv(visible"));
  assert.ok(template.includes("summarizeRawNumericRows(rawRows)"));
  assert.ok(template.includes("numeric-original-rows"));
  assert.ok(!template.includes(".innerHTML"));
});
