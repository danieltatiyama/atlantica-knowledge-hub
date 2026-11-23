import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
import {planClientCrafting,splitCraftOperations}
 from "../src/data/client-crafting-planner.mjs";

const mk=(materials,batchSize=1)=>({materials,batchSize,sourceRows:[1]});
const recipe=id=>{
 const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
 const file=JSON.parse(readFileSync("public/data/client-items/details/"+bucket+".json","utf8"));
 return buildClientRecipeViews(file.items[id].s);
};
const step=(p,id)=>p.steps.find(x=>x.itemId===id);
const find=(p,id)=>p.leaves.find(x=>x.itemId===id);

test("Strong Fishing Line: 200 Thread per batch 20 caps each operation at 1,000 output",()=>{
 const source=recipe("2320");
 assert.equal(source.length,1);
 assert.equal(source[0].batchSize,20);
 assert.deepEqual(source[0].materials,[["2170",20],["7044",50],["7081",200]]);
 const p=planClientCrafting({itemId:"2320",quantity:10000,strictTargetBatch:true,
  recipesById:{"2320":source},itemCategories:{"2320":"FISH"}});
 const s=step(p,"2320");
 assert.equal(s.totalBatches,"500");
 assert.equal(s.maxPerOperation,"10000","Raw output cap is retained as evidence");
 assert.equal(s.maxOutputPerOperation,"1000","Ingredient limit is stricter");
 assert.equal(s.maxBatchesPerOperation,"50");
 assert.equal(s.operations,"10");
 assert.deepEqual(s.operationGroups,[{
  operations:"10",batchesEach:"50",outputEach:"1000",
 }]);
 assert.deepEqual(s.limitingIngredients,[{
  itemId:"7081",perBatch:"200",batchesMax:"50",
 }]);
 assert.equal(find(p,"7081").quantity,"100000");
 assert.equal(find(p,"7044").quantity,"25000");
 assert.equal(find(p,"2170").quantity,"10000");
});
test("Strong Fishhook: 100 Large Animal Bones per batch 20 caps 2,000 output",()=>{
 const source=recipe("2321");
 assert.equal(source[0].batchSize,20);
 assert.deepEqual(source[0].materials,[["5342",20],["8003",100]]);
 const p=planClientCrafting({itemId:"2321",quantity:10000,strictTargetBatch:true,
  recipesById:{"2321":source},itemCategories:{"2321":"FISH"}});
 const s=step(p,"2321");
 assert.equal(s.maxOutputPerOperation,"2000");
 assert.equal(s.maxBatchesPerOperation,"100");
 assert.equal(s.operations,"5");
 assert.deepEqual(s.operationGroups,[{
  operations:"5",batchesEach:"100",outputEach:"2000",
 }]);
 assert.deepEqual(s.limitingIngredients,[{
  itemId:"8003",perBatch:"100",batchesMax:"100",
 }]);
 assert.equal(find(p,"8003").quantity,"50000");
});
test("ingredient limit applies also to Titanium Fishing Rod and its crafted intermediates",()=>{
 const p=planClientCrafting({itemId:"2318",quantity:10000,strictTargetBatch:true,
  recipesById:{"2318":recipe("2318"),"2320":recipe("2320"),"2321":recipe("2321")},
  itemCategories:{"2318":"FISH","2320":"FISH","2321":"FISH"}});
 const root=step(p,"2318"),line=step(p,"2320"),hook=step(p,"2321");
 assert.equal(root.maxOutputPerOperation,"5000");
 assert.equal(root.operations,"2");
 assert.equal(root.requested,"10000");
 assert.equal(line.requested,"10000");
 assert.equal(line.operations,"10");
 assert.equal(hook.requested,"20000");
 assert.equal(hook.operations,"10");
 assert.equal(p.totalOperations,"22");
 for(const row of p.steps){
  for(const group of row.operationGroups){
   assert.ok(BigInt(group.outputEach)<=BigInt(row.maxPerOperation));
   assert.ok(BigInt(group.outputEach)<=BigInt(row.maxOutputPerOperation));
  }
 }
 const lineTree=p.tree.find(x=>x.itemId==="2320");
 assert.deepEqual(lineTree.consumptionGroups,[{
  operations:"2",consumedEach:"5000",totalConsumed:"10000",
 }]);
});
test("unworkable single batch with >10k ingredient is not offered as executable craft",()=>{
 assert.throws(()=>splitCraftOperations({
  batches:1,batchSize:20,maxPerOperation:10000,
  ingredients:[["2",10001]],
 }),/Ingredient 2 exceeds/);
 const p=planClientCrafting({
  itemId:"1",quantity:1,recipesById:{"1":[mk([["2",10001]])]},
 });
 assert.equal(p.complete,false);
 assert.equal(p.issues[0].kind,"ingredient-over-limit");
 assert.equal(p.steps.length,0);
});
test("250 required, batch 20, ingredient cap 10k: still 260 produced with full batch inputs",()=>{
 const p=planClientCrafting({itemId:"1",quantity:1,
  recipesById:{"1":[mk([["2",250]])],"2":[mk([["3",200]],20)]}});
 const intermediate=step(p,"2");
 assert.equal(intermediate.requested,"250");
 assert.equal(intermediate.output,"260");
 assert.equal(intermediate.totalBatches,"13");
 assert.equal(intermediate.maxBatchesPerOperation,"50");
 assert.equal(intermediate.operations,"1");
 assert.equal(find(p,"3").quantity,"2600");
});
test("Done on one intermediate prunes its subtree without removing shared inputs of other branches",()=>{
 const graph={
  "1":[mk([["2",2],["3",1]])],
  "2":[mk([["4",3],["5",1]])],
  "3":[mk([["4",4]])],
  "4":[mk([["6",2]])],
 };
 const base=planClientCrafting({itemId:"1",quantity:1,recipesById:graph});
 assert.equal(find(base,"6").quantity,"20");
 assert.equal(find(base,"5").quantity,"2");
 const done=planClientCrafting({itemId:"1",quantity:1,recipesById:graph,doneIds:["2"]});
 assert.ok(!done.tree.some(row=>row.itemId==="2"||row.itemId==="5"));
 assert.equal(done.steps.some(x=>x.itemId==="2"),false);
 assert.equal(done.leaves.some(x=>x.itemId==="5"),false);
 assert.equal(find(done,"6").quantity,"8","Remaining recipe still crafts shared material #4");
 assert.equal(done.tree.find(x=>x.itemId==="4").totalRequired,"4");
 assert.deepEqual(done.completedRows,[{itemId:"2",quantity:"2"}]);
 const undo=planClientCrafting({itemId:"1",quantity:1,recipesById:graph,doneIds:[]});
 assert.deepEqual(undo.leaves,base.leaves);
});
test("marking a base ingredient done removes its purchase but leaves other needs",()=>{
 const graph={"1":[mk([["2",2],["3",4]])]};
 const p=planClientCrafting({itemId:"1",quantity:1,recipesById:graph,doneIds:["2"]});
 assert.deepEqual(p.completedRows,[{itemId:"2",quantity:"2"}]);
 assert.deepEqual(p.leaves,[{itemId:"3",quantity:"4"}]);
 assert.deepEqual(p.tree.map(x=>x.itemId),["1","3"]);
});
test("marking root complete preserves a reversible completion record without pending jobs",()=>{
 const graph={"1":[mk([["2",5]])]};
 const p=planClientCrafting({itemId:"1",quantity:2,recipesById:graph,doneIds:["1"]});
 assert.equal(p.complete,true);
 assert.deepEqual(p.completedRows,[{itemId:"1",quantity:"2"}]);
 assert.deepEqual(p.tree,[]);
 assert.deepEqual(p.steps,[]);
 assert.deepEqual(p.leaves,[]);
 assert.equal(p.totalOperations,"0");
});
test("UI shows Done/Undo, recenters numerical values and uses the effective operation cap",()=>{
 const code=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 for(const s of [
  'id="craft-completed-section"',
  'id="craft-completed-list"',
  'id="craft-undo-all"',
  'doneIds:[...doneIds]',
  'doneIds.add(row.itemId)',
  'doneIds.delete(row.itemId)',
  'doneIds.clear();redraw();',
  'renderCompleted();',
  'step.operations,step.maxOutputPerOperation',
  'limitingIngredients',
  'ingredient-over-limit',
  'pt?"Feito":"Done"',
  '.craft-tree-actions .craft-done-button',
  'text-align:center;',
 ])assert.ok(code.includes(s),s);
});
