import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
import {planClientCrafting,splitCraftOperations}
  from "../src/data/client-crafting-planner.mjs";

const mk=(materials,batchSize=1)=>({materials,batchSize,sourceRows:[1]});
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const sourceRecipe=id=>{
 const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
 return buildClientRecipeViews(
  read("public/data/client-items/details/"+bucket+".json").items[id].s);
};
const step=(plan,id)=>plan.steps.find(row=>row.itemId===id);

test("250 units of intermediate with batch 20 produces 260, consuming 13 full batches of ingredients",()=>{
 const p=planClientCrafting({
  itemId:"1",quantity:1,strictTargetBatch:true,
  recipesById:{
   "1":[mk([["2",250]])],
   "2":[mk([["3",4]],20)],
  },
  itemCategories:{"1":"Etc","2":"Food"},
 });
 assert.equal(step(p,"2").requested,"250");
 assert.equal(step(p,"2").batchSize,"20");
 assert.equal(step(p,"2").totalBatches,"13");
 assert.equal(step(p,"2").output,"260");
 assert.equal(step(p,"2").excess,"10");
 assert.equal(step(p,"2").operations,"1");
 assert.deepEqual(step(p,"2").operationGroups,
  [{operations:"1",batchesEach:"13",outputEach:"260"}]);
 assert.deepEqual(p.leaves,[{itemId:"3",quantity:"52"}],
  "4 ingredients per full batch requires 4×13 = 52, not 4×12.5");
 assert.deepEqual(p.leftoverRows,[{itemId:"2",quantity:"10"}]);
 const treeRow=p.tree.find(row=>row.itemId==="2");
 assert.deepEqual([treeRow.totalRequired,treeRow.output,treeRow.batchSize,treeRow.totalBatches],
  ["250","260","20","13"]);
});
test("real client: 10,000 Albert's Special Bait requires 35,000 Dumplings and 35,000 Grilled Pork",()=>{
 const recipesById={
  "2319":sourceRecipe("2319"),
  "3305":sourceRecipe("3305"),
  "3310":sourceRecipe("3310"),
 };
 const p=planClientCrafting({
  itemId:"2319",quantity:10000,strictTargetBatch:true,
  recipesById,itemCategories:{"2319":"FISH","3305":"Food","3310":"Food"},
 });
 assert.equal(p.complete,true);
 assert.deepEqual([step(p,"2319").totalBatches,step(p,"2319").output],["100","10000"]);
 assert.equal(step(p,"2319").operations,"4");
 assert.deepEqual(step(p,"2319").operationGroups,[
  {operations:"3",batchesEach:"28",outputEach:"2800"},
  {operations:"1",batchesEach:"16",outputEach:"1600"},
 ]);
 for(const id of ["3305","3310"]){
  const s=step(p,id);
  assert.equal(s.requested,"35000");
  assert.equal(s.batchSize,"10");
  assert.equal(s.totalBatches,"3500");
  assert.equal(s.output,"35000");
  assert.equal(s.operations,"4","10,000 cap applies individually to every intermediate");
  assert.deepEqual(s.operationGroups,[
   {operations:"3",batchesEach:"1000",outputEach:"10000"},
   {operations:"1",batchesEach:"500",outputEach:"5000"},
  ]);
 }
 const items=Object.fromEntries(p.leaves.map(x=>[x.itemId,x.quantity]));
 assert.deepEqual(items,{"3200":"5000","3130":"21000","3135":"42000","16000":"14000"});
 assert.equal(p.totalOperations,"12"); // 4 bait (ingredient cap), 4 dumpling, 4 grilled pork
 const porkRows=p.tree.filter(x=>x.itemId==="3135");
 assert.equal(porkRows.length,2);
 assert.equal(porkRows.filter(x=>x.sharedReference).length,1);
 assert.equal(porkRows[0].totalRequired,"42000");
 assert.ok(porkRows[0].path.startsWith("/2319/"));
 assert.notEqual(porkRows[0].path,porkRows[1].path);
});
test("non-divisor batch caps produce 35,100 for 35,000 demand, across legal chunks",()=>{
 const p=planClientCrafting({
  itemId:"1",quantity:35000,
  recipesById:{"1":[mk([["2",1]])],"2":[mk([["3",2]],300)]},
 });
 const item=step(p,"2");
 assert.equal(item.requested,"35000");
 assert.equal(item.output,"35100");
 assert.equal(item.excess,"100");
 assert.equal(item.totalBatches,"117");
 assert.equal(item.operations,"4");
 assert.deepEqual(item.operationGroups,[
  {operations:"3",batchesEach:"33",outputEach:"9900"},
  {operations:"1",batchesEach:"18",outputEach:"5400"},
 ]);
 assert.deepEqual(p.leaves,[{itemId:"3",quantity:"234"}]);
 assert.equal(item.operationGroups.every(group=>Number(group.outputEach)<=10000),true);
});
test("equipment intermediate uses 20-per-operation even inside another recipe",()=>{
 const p=planClientCrafting({
  itemId:"1",quantity:1,
  recipesById:{"1":[mk([["2",41]])],"2":[mk([["3",3]],1)]},
  itemCategories:{"2":"Armor"},
 });
 const s=step(p,"2");
 assert.equal(s.totalBatches,"41");
 assert.equal(s.maxPerOperation,"20");
 assert.equal(s.operations,"3");
 assert.deepEqual(s.operationGroups,[
  {operations:"2",batchesEach:"20",outputEach:"20"},
  {operations:"1",batchesEach:"1",outputEach:"1"},
 ]);
 assert.deepEqual(p.leaves,[{itemId:"3",quantity:"123"}]);
});
test("operation groups preserve total output without materializing enormous operation arrays",()=>{
 const info=splitCraftOperations({
  batches:"1300000000000",batchSize:"20",maxPerOperation:"10000",
 });
 assert.equal(info.operations,"2600000000");
 assert.deepEqual(info.groups,[
  {operations:"2600000000",batchesEach:"500",outputEach:"10000"},
 ]);
 assert.throws(()=>splitCraftOperations({
  batches:1,batchSize:10001,maxPerOperation:10000,
 }),/exceeds/);
});
test("tree is an aligned data table with eight depth levels and accessible collapse buttons",()=>{
 const page=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 for(const token of [
  '<table class="craft-tree-table">',
  '<tbody id="craft-tree-rows">',
  'id="craft-tree-expand"','id="craft-tree-collapse"',
  'function updateCraftTreeVisibility()',
  'collapsedTreePaths',
  'row.operationGroups.map',
  'treeRows.replaceChildren()',
  'scope="col"',
  'name.scope="row"',
  'craft-tree-depth-',
  'maxOutputPerOperation',
  'craftingText(lang,"Per batch","Por batch")',
  'craftingText(lang,"Total needed","Total necessário")',
  'craftingText(lang,"Operation breakdown","Divisão das operações")',
 ])assert.ok(page.includes(token),token);
 for(let i=0;i<8;i++)
  assert.ok(page.includes(".craft-tree-depth-"+i+"{--craft-level:"),"Depth "+i);
 for(const theme of ["light","parchment","contrast"])
  assert.ok(page.includes('html[data-theme="'+theme+'"]'),theme);
});
