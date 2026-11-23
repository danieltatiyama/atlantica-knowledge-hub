import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  MAX_CRAFT_OUTPUT_PER_OPERATION,
  summarizeCraftBatch,
  planCraftBatchOperations,
} from "../src/data/client-craft-batch.mjs";

function original(id){
  const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
  return JSON.parse(readFileSync(
    "public/data/client-items/details/"+bucket+".json","utf8")).items[id]?.s;
}

test("Abyssal Oriharukon 4819 has original source Unit 500, not invented 1",()=>{
  const rows=original("4819");
  assert.equal(rows.length,1);
  assert.equal(rows[0][1],"ItemTypeStone.ndt");
  assert.equal(rows[0][7],500);
  assert.deepEqual(rows[0][9],[["8494",1],["20339",1000]]);
  const unit=summarizeCraftBatch(rows);
  assert.equal(unit.status,"consistent");
  assert.equal(unit.batchSize,500);
  assert.equal(unit.minCraftQuantity,500);
  assert.equal(unit.increment,500);
  assert.equal(unit.maxPerOperation,10000);
  assert.equal(unit.maxBatchesPerOperation,20);
  assert.equal(unit.maxCraftQuantityPerOperation,10000);
  assert.equal(unit.unitSource,"game-client-itemtype-unitRaw");
  assert.equal(unit.ruleSource,"user-reported-gameplay");
});

test("future craft planner rounds to batches without exceeding 10000 per operation",()=>{
  assert.deepEqual(planCraftBatchOperations(1,500),{
    requested:1,batch:500,totalBatches:1,totalOutput:500,excess:499,
    totalOperations:1,
    operations:[{count:1,batchesEach:1,outputEach:500}],
  });
  assert.equal(planCraftBatchOperations(501,500).totalOutput,1000);
  assert.equal(planCraftBatchOperations(10000,500).totalBatches,20);
  assert.deepEqual(planCraftBatchOperations(10501,500).operations,[
    {count:1,batchesEach:20,outputEach:10000},
    {count:1,batchesEach:2,outputEach:1000},
  ]);
  const nonDivisor=summarizeCraftBatch([[1,"file","specific","Stone",null,null,100,300,"none",[]]]);
  assert.equal(nonDivisor.maxCraftQuantityPerOperation,9900);
  assert.equal(nonDivisor.maxBatchesPerOperation,33);
  assert.equal(planCraftBatchOperations(10000,300).totalOperations,2);
  assert.equal(MAX_CRAFT_OUTPUT_PER_OPERATION,10000);
});

test("missing, partial and conflicting original Unit values stay different",()=>{
  const no=summarizeCraftBatch([
    [1,"general","general","Weapon","1","NORMAL",30,null,"none",[]],
  ]);
  assert.equal(no.status,"not-provided");
  assert.equal(no.batchSize,null);
  const partial=summarizeCraftBatch([
    [1,"general","general","Weapon","1","NORMAL",30,null,"none",[]],
    [2,"specific","specific","Sword","1","NORMAL",30,1,"none",[]],
  ]);
  assert.equal(partial.status,"partial");
  assert.equal(partial.batchSize,1);
  assert.equal(partial.observedIn,1);
  assert.equal(partial.sourceCount,2);
  const mismatch=summarizeCraftBatch([
    [3,"file","specific","Stone","1","NORMAL",10,500,"none",[]],
    [4,"file","specific","Stone","1","NORMAL",10,1000,"none",[]],
  ]);
  assert.equal(mismatch.status,"conflict");
  assert.equal(mismatch.batchSize,null);
  assert.deepEqual(mismatch.sourceValues,[500,1000]);
  assert.equal(mismatch.maxBatchesPerOperation,null);
  assert.throws(()=>summarizeCraftBatch([
    [3,"file","specific","Stone","1","NORMAL",10,500,"none",[]],
    [3,"file","specific","Stone","1","NORMAL",10,500,"none",[]],
  ]),/Duplicate/);
  assert.equal(summarizeCraftBatch([
    {recordId:1,unitRaw:null},
    {recordId:2,unitRaw:500},
  ]).batchSize,500);
});

test("invalid original units are not silently treated as zero or one",()=>{
  assert.equal(summarizeCraftBatch([
    {recordId:1,unitRaw:0},
  ]).status,"invalid");
  assert.equal(summarizeCraftBatch([
    {recordId:1,unitRaw:"not-a-number"},
  ]).batchSize,null);
  assert.equal(summarizeCraftBatch([
    {recordId:1,unitRaw:"500"},
  ]).batchSize,500);
  assert.throws(()=>planCraftBatchOperations(1,0),RangeError);
  assert.throws(()=>planCraftBatchOperations(1,10001),RangeError);
  assert.throws(()=>planCraftBatchOperations(0,500),RangeError);
});

test("game-inspired tooltip is source-only and appears for 551 and 1911 equipment profiles",()=>{
  const tooltip=readFileSync("src/components/AtlanticaItemInfoPanel.astro","utf8");
  const reviewed=readFileSync("src/components/ItemDetailPage.astro","utf8");
  const additional=readFileSync("src/components/ClientSourceEquipmentPage.astro","utf8");
  const crafting=readFileSync("src/components/ClientCraftingSummary.astro","utf8");
  const database=readFileSync("src/components/FullClientItemDatabasePage.astro","utf8");
  assert.ok(tooltip.includes("getClientEquipmentSourceProfile(itemId)"));
  assert.ok(tooltip.includes("summarizeCraftBatch(detail.s)"));
  assert.ok(tooltip.includes("Source records")&&tooltip.includes("original"));
  assert.ok(tooltip.includes("linear-gradient"));
  assert.ok(!tooltip.includes("innerHTML"));
  assert.ok(reviewed.includes('<AtlanticaItemInfoPanel lang={lang} itemId={item.id} />'));
  assert.ok(additional.includes('<AtlanticaItemInfoPanel lang={lang} itemId={item.id} />'));
  assert.ok(crafting.includes("batch.maxBatchesPerOperation"));
  assert.ok(additional.includes("craftBatch.maxBatchesPerOperation"));
  assert.ok(database.includes("addCraftBatchInformation(details,data,row)"));
  assert.ok(database.includes("summarizeCraftBatch(data.s,{equipment})"));
});
