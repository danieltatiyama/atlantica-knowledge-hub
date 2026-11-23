import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
import {planClientCrafting} from "../src/data/client-crafting-planner.mjs";
import {CRAFT_PLAN_MAX_OUTPUT,isSourceRecipeCandidate,resolveRootCraftBatch,isAllowedCraftQuantity}
 from "../src/data/client-crafting-quantity.mjs";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const detail=id=>{
 const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
 return read("public/data/client-items/details/"+bucket+".json").items[id];
};
const recipes=id=>buildClientRecipeViews(detail(id).s);
const allRows=read("public/data/client-items/manifest.json").indexShards
 .flatMap(file=>read("public/data/client-items/"+file).rows);
const byId=new Map(allRows.map(row=>[row[0],row]));

test("autocomplete candidates must be named + have source materials, then parsed recipes confirmed",()=>{
 assert.equal(allRows.length,23586);
 for(const id of ["645","18801","4819","1"]){
  const row=byId.get(id);
  assert.equal(isSourceRecipeCandidate(row),true,id);
  assert.ok(recipes(id).length>0,id);
 }
 assert.equal(isSourceRecipeCandidate(byId.get("4322")),false,
  "Riederan's Soul Stone has no client recipe");
 assert.equal(isSourceRecipeCandidate(byId.get("3890")),false,
  "Identity collisions must be excluded");
 const candidates=allRows.filter(isSourceRecipeCandidate);
 assert.ok(candidates.length>200,"Source should have more than a handful of parsed candidates");
 assert.ok(candidates.length<22702,"Do not show all named items in the recipe autocomplete");
});
test("equipment uses batch=1 and allows desired 1..10000, with 20 per operation",()=>{
 const batch=resolveRootCraftBatch({
  recipes:recipes("18801"),category:"Defence",
 });
 assert.equal(batch.ready,true);
 assert.equal(batch.min,1);
 assert.equal(batch.max,10000);
 assert.equal(batch.step,1);
 assert.equal(batch.maxPerOperation,20);
 assert.equal(batch.source,"confirmed-equipment-rule");
 const p=planClientCrafting({
  itemId:"645",quantity:10000,recipesById:{"645":recipes("645")},
  itemCategories:{"645":"Armor"},strictTargetBatch:true,
 });
 assert.equal(p.steps[0].operations,"500");
 assert.equal(p.rootOutput,"10000");
});
test("source batch 500 (Abyssal Oriharukon) admits only 500, 1000, … 10000",()=>{
 const batch=resolveRootCraftBatch({
  recipes:recipes("4819"),category:"Stone",
 });
 assert.equal(batch.ready,true);
 assert.deepEqual([batch.min,batch.max,batch.step],[500,10000,500]);
 for(const q of [500,1000,4500,10000])
  assert.equal(isAllowedCraftQuantity(q,batch.batch),true,String(q));
 for(const q of [1,499,501,10001,0,-500,50.5])
  assert.equal(isAllowedCraftQuantity(q,batch.batch),false,String(q));
});
test("non-divisor batches 50 and 300 have exact discrete slider stops",()=>{
 const mk=(batchSize)=>[{materials:[["77",2]],batchSize,sourceRows:[1]}];
 const fifty=resolveRootCraftBatch({recipes:mk(50),category:"Etc"});
 assert.deepEqual([fifty.min,fifty.max,fifty.step],[50,10000,50]);
 const three=resolveRootCraftBatch({recipes:mk(300),category:"Etc"});
 assert.deepEqual([three.min,three.max,three.step],[300,9900,300]);
 assert.equal(isAllowedCraftQuantity(10000,300),false);
 assert.equal(isAllowedCraftQuantity(9900,300),true);
});
test("missing and ambiguous source recipes never invent a minimum",()=>{
 const mk=(batchSize)=>({materials:[["2",1]],batchSize,sourceRows:[20]});
 const choices=[mk(50),mk(100)];
 assert.equal(resolveRootCraftBatch({recipes:choices,category:"Etc"}).reason,"choose-variant");
 assert.equal(resolveRootCraftBatch({recipes:choices,selectedVariant:1,category:"Etc"}).step,100);
 const missing=resolveRootCraftBatch({recipes:[mk(null)],category:"Etc"});
 assert.equal(missing.ready,false);
 assert.equal(missing.reason,"missing-batch");
 assert.equal(resolveRootCraftBatch({recipes:[mk(null)],category:"Etc",manualBatch:"25"}).max,10000);
 assert.equal(resolveRootCraftBatch({recipes:[mk(null)],category:"Etc",manualBatch:"0"}).reason,"invalid-manual-batch");
 assert.equal(resolveRootCraftBatch({recipes:[mk(50)],category:"Etc",manualBatch:"25"}).step,50,
  "Known source Unit must take precedence over stale manual input");
 const engine=planClientCrafting({
  itemId:"1",quantity:50,recipesById:{"1":[mk(50)]},
  itemCategories:{"1":"Etc"},batchOverrides:{"1":"25"},strictTargetBatch:true,
 });
 assert.equal(engine.steps[0].batchSize,"50");
 assert.equal(engine.steps[0].totalBatches,"1");
 assert.equal(resolveRootCraftBatch({recipes:[],category:"Etc"}).reason,"no-source-recipe");
});
test("strict target rejects broken craft quantities rather than silently rounding",()=>{
 const recipe={materials:[["2",2]],batchSize:50,sourceRows:[1]};
 const options={itemId:"1",recipesById:{"1":[recipe]},
  itemCategories:{"1":"Etc"},strictTargetBatch:true};
 assert.throws(()=>planClientCrafting({...options,quantity:1}),/exact multiple/);
 assert.throws(()=>planClientCrafting({...options,quantity:51}),/exact multiple/);
 assert.throws(()=>planClientCrafting({...options,quantity:10001}),/10,000/);
 const exact=planClientCrafting({...options,quantity:100});
 assert.equal(exact.rootOutput,"100");
 assert.equal(exact.steps[0].totalBatches,"2");
 assert.equal(exact.leaves[0].quantity,"4");
 assert.equal(CRAFT_PLAN_MAX_OUTPUT,10000);
});
test("calculator links slider and number input and guards direct URLs",()=>{
 const code=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 for(const token of [
  'id="craft-quantity-slider"','id="craft-quantity-output"',
  'id="craft-quantity-controls"','id="craft-root-variant"',
  'id="craft-root-batch"','id="craft-submit"',
  'CRAFT_PLAN_MAX_OUTPUT','isSourceRecipeCandidate(row)',
  'craftableCandidates.has(id)','buildClientRecipeViews(details.s)',
  'strictTargetBatch:true','slider.step=String(step)',
  'amount.step=String(step)','amount.max=String(max)',
  'slider.value=amount.value','amount.value=slider.value',
  'isAllowedCraftQuantity(amount.value,rootConfig.batch)',
  'selectCraftTarget(requested,',
 ])assert.ok(code.includes(token),token);
 assert.ok(!code.includes('max="1000000000000"'));
});
