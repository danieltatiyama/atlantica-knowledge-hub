import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
import {planClientCrafting,priceCraftLeaves}
  from "../src/data/client-crafting-planner.mjs";
import {craftGameplayPolicy,isEquipmentSourceCategory}
  from "../src/data/client-crafting-gameplay-policy.mjs";
import {summarizeCraftBatch,planCraftBatchOperations} from "../src/data/client-craft-batch.mjs";
const json=path=>JSON.parse(readFileSync(path,"utf8"));
const recipe=id=>{
  const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
  const details=json("public/data/client-items/details/"+bucket+".json").items[id];
  assert.ok(details,"Client details required "+id);
  return buildClientRecipeViews(details.s);
};
const mk=(materials,batchSize=1)=>({materials,batchSize,sourceRows:[1]});
test("user gameplay rule overrides missing Unit for Apocalyptic Heavy Armor #18801",()=>{
 const rows=recipe("18801");
 assert.equal(rows.length,1);
 assert.equal(rows[0].batchSize,null);
 assert.equal(isEquipmentSourceCategory("Defence"),true);
 const plan=planClientCrafting({
   itemId:"18801",quantity:1,recipesById:{"18801":rows},
   itemCategories:{"18801":"Defence"},
 });
 assert.equal(plan.complete,true);
 assert.deepEqual(plan.issues,[]);
 assert.equal(plan.steps[0].batchSize,"1");
 assert.equal(plan.steps[0].batchSource,"confirmed-equipment-rule");
 assert.equal(plan.steps[0].maxPerOperation,"20");
 assert.equal(plan.steps[0].operations,"1");
 assert.ok(plan.leaves.length>=10,"The original recipe has several ingredients");
});
test("Judgment Heavy Armor #645 handles batches of 1 and 20 items per operation",()=>{
 const rows=recipe("645");
 assert.equal(rows[0].batchSize,1);
 const plan=planClientCrafting({
   itemId:"645",quantity:41,recipesById:{"645":rows},
   itemCategories:{"645":"Armor"},
 });
 assert.equal(plan.complete,true);
 assert.equal(plan.steps[0].batchSize,"1");
 assert.equal(plan.steps[0].output,"41");
 assert.equal(plan.steps[0].totalBatches,"41");
 assert.equal(plan.steps[0].operations,"3");
 assert.equal(plan.steps[0].maxPerOperation,"20");
 assert.equal(plan.leaves.find(x=>x.itemId==="8189").quantity,"41");
 assert.equal(plan.leaves.find(x=>x.itemId==="8165").quantity,"10250");
});
test("non-equipment material retains source Unit and 10,000 output cap",()=>{
 assert.equal(isEquipmentSourceCategory("Etc"),false);
 assert.equal(craftGameplayPolicy("Material").maxPerOperation,10000);
 const plan=planClientCrafting({itemId:"99",quantity:10001,
   recipesById:{"99":[mk([["88",2]],3)]},itemCategories:{"99":"Etc"}});
 assert.equal(plan.steps[0].batchSize,"3");
 assert.equal(plan.steps[0].operations,"2");
});
test("explicit Buy alternative replaces crafting for intermediate, without guessing prices",()=>{
 const graph={
  "1":[mk([["2",2],["3",1]])],
  "2":[mk([["4",5]])],
  "3":[mk([["4",1]])],
  "4":[mk([["5",2]],10)],
 };
 const all=planClientCrafting({itemId:"1",quantity:1,recipesById:graph});
 assert.equal(all.steps.find(x=>x.itemId==="4").requested,"11");
 assert.equal(all.steps.find(x=>x.itemId==="4").output,"20");
 assert.equal(all.leftoverRows.find(x=>x.itemId==="4").quantity,"9");
 assert.equal(all.leaves.find(x=>x.itemId==="5").quantity,"4");
 assert.ok(all.tree.some(x=>x.itemId==="4"&&x.sharedReference));
 const buy=planClientCrafting({itemId:"1",quantity:1,
  recipesById:graph,buyIds:["4"]});
 assert.ok(!buy.steps.some(x=>x.itemId==="4"));
 assert.ok(buy.leaves.some(x=>x.itemId==="4"&&x.quantity==="11"));
 assert.equal(buy.tree.find(x=>x.itemId==="4").mode,"buy");
 assert.equal(priceCraftLeaves(buy.leaves,{"4":"13"}).knownTotal,"143");
});
test("unknown batch stays unresolved for ordinary items but not equipment",()=>{
 const graph={"1":[mk([["2",1]],null)]};
 const plain=planClientCrafting({itemId:"1",quantity:1,recipesById:graph,
  itemCategories:{"1":"Etc"}});
 assert.equal(plain.issues[0].kind,"missing-batch");
 const equipped=planClientCrafting({itemId:"1",quantity:1,recipesById:graph,
  itemCategories:{"1":"Weapon"},batchOverrides:{"1":"999"}});
 assert.equal(equipped.complete,true,"Equipment gameplay rule must override any manual hint");
 assert.equal(equipped.steps[0].batchSize,"1");
 assert.equal(equipped.steps[0].maxPerOperation,"20");
});
test("calculator renders Jana4U-style independent tree and shopping tools across locales",()=>{
 const page=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 const ui=[
  'id="craft-tree"','id="craft-tree-expand"','id="craft-tree-collapse"',
  'id="craft-export-shopping"','id="craft-copy-shopping"',
  'id="craft-surplus"','id="craft-summary-output"',
  'renderCraftTree()','renderLeftovers()',
  'itemCategories,buyIds:[...buyIds]','itemCategories[row[0]]=row[2]',
  'buyIds.add(row.itemId)','buyIds.delete(row.itemId)',
  'maxOutputPerOperation','Equipment',
 ];
 for(const key of ui)assert.ok(page.includes(key),key);
 assert.ok(page.includes("atlantica.crafting.prices.v1"));
 assert.ok(page.includes('craftingText(lang,"Buy","Comprar")'));
 assert.ok(page.includes('craftingText(lang,"Craft","Fabricar")'));
 const legacy=readFileSync("tests/client-crafting-planner.test.mjs","utf8");
 assert.ok(legacy.includes("shared intermediate demand"));
});

test("equipment detail summary follows 1×20 without overwriting Unit evidence",()=>{
 const judgment=json("public/data/client-items/details/00.json").items["645"].s;
 const apocalyptic=json("public/data/client-items/details/18.json").items["18801"].s;
 const judgement=summarizeCraftBatch(judgment,{equipment:true});
 const missing=summarizeCraftBatch(apocalyptic,{equipment:true});
 assert.equal(judgement.batchSize,1);
 assert.equal(judgement.maxPerOperation,20);
 assert.equal(judgement.maxBatchesPerOperation,20);
 assert.equal(judgement.sourceValues[0],1);
 assert.equal(missing.batchSize,1);
 assert.equal(missing.maxPerOperation,20);
 assert.equal(missing.originalUnitStatus,"not-provided");
 assert.deepEqual(missing.sourceValues,[]);
 assert.equal(planCraftBatchOperations(41,1,{equipment:true}).totalOperations,3);
 const summary=readFileSync("src/components/ClientCraftingSummary.astro","utf8");
 assert.ok(summary.includes("summarizeCraftBatch(item.sourceDefinitions,{equipment:true})"));
 assert.ok(summary.includes("originalUnitStatus"));
 const full=readFileSync("src/components/FullClientItemDatabasePage.astro","utf8");
 assert.ok(full.includes('addCraftBatchInformation(details,data,row)'));
 assert.ok(full.includes('summarizeCraftBatch(data.s,{equipment})'));
 assert.ok(full.includes('if(equipment&&!hasMaterials)return'));

});
