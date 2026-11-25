import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {planClientCrafting,priceCraftLeaves} from "../src/data/client-crafting-planner.mjs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
const mk=(materials,batchSize=1)=>({materials,batchSize,sourceRows:[123]});
test("Spirit Sword source materials retain exact original quantities and batch",()=>{
 const details=JSON.parse(readFileSync("public/data/client-items/details/00.json","utf8")).items["1"].s;
 const variants=buildClientRecipeViews(details);
 assert.equal(variants.length,1);
 const plan=planClientCrafting({itemId:"1",quantity:"1",recipesById:{"1":variants}});
 assert.deepEqual(plan.leaves.map(x=>[x.itemId,x.quantity]).sort(),
   [["5100","5"],["6080","4"]]);
 assert.equal(plan.steps[0].batchSize,"1");
 assert.equal(plan.complete,true);
});
test("shared intermediate demand is aggregated before rounding to batch",()=>{
 const graph={"1":[mk([["2",2],["3",1]])],"2":[mk([["4",3]])],
   "3":[mk([["4",4]])],"4":[mk([["5",2]],10)]};
 const p=planClientCrafting({itemId:"1",quantity:1,recipesById:graph});
 assert.deepEqual(p.leaves,[{itemId:"5",quantity:"2"}]);
 assert.equal(p.steps.find(s=>s.itemId==="4").totalBatches,"1");
});
test("10,000 item operation limit splits large batches safely",()=>{
 const p=planClientCrafting({itemId:"1",quantity:10001,recipesById:{"1":[mk([["5",2]],3)]}});
 assert.equal(p.steps[0].output,"10002");
 assert.equal(p.steps[0].totalBatches,"3334");
 assert.equal(p.steps[0].operations,"2");
 assert.equal(p.leaves[0].quantity,"6668");
});
test("unknown batch and variant choices must never be silently assumed",()=>{
 const a=mk([["2",3]],null);
 const b=mk([["3",4]],1);
 const missing=planClientCrafting({itemId:"1",quantity:4,recipesById:{"1":[a]}});
 assert.equal(missing.complete,false);
 assert.equal(missing.issues[0].kind,"missing-batch");
 assert.equal(missing.leaves[0].quantity,"4");
 const supplied=planClientCrafting({itemId:"1",quantity:4,
  recipesById:{"1":[a]},batchOverrides:{"1":"2"}});
 assert.equal(supplied.steps[0].manualBatch,true);
 assert.equal(supplied.leaves[0].quantity,"6");
 const ambiguous=planClientCrafting({itemId:"1",quantity:1,recipesById:{"1":[a,b]}});
 assert.equal(ambiguous.issues[0].kind,"choose-variant");
 const selected=planClientCrafting({itemId:"1",quantity:1,recipesById:{"1":[a,b]},
  choices:{"1":1}});
 assert.equal(selected.complete,true);
 assert.equal(selected.leaves[0].itemId,"3");
});
test("invalid cycles and prices never generate false final totals",()=>{
 const cyclic={"1":[mk([["2",1]])],"2":[mk([["1",1]])]};
 assert.throws(()=>planClientCrafting({itemId:"1",quantity:1,recipesById:cyclic}),/Circular/);
 const cost=priceCraftLeaves([{itemId:"10",quantity:"5"},{itemId:"20",quantity:"2"}],{"10":"100"});
 assert.equal(cost.knownTotal,"500");
 assert.equal(cost.unpricedItems,1);
 assert.equal(cost.complete,false);
 assert.throws(()=>priceCraftLeaves([{itemId:"10",quantity:"1"}],{"10":"5.5"}),/Invalid/);
});
test("crafting calculator is linked from tools and individual item profiles",()=>{
 const read=p=>readFileSync(p,"utf8");
 const tools=read("src/components/ToolsPage.astro");
 const page=read("src/components/CraftingPlannerPage.astro");
 const item=read("src/components/ItemDetailPage.astro");
 const full=read("src/components/FullClientItemDatabasePage.astro");
 assert.ok(tools.includes('href:catalogPath(lang,"/tools/crafting/")'));
 assert.ok(page.includes('buildClientRecipeViews(detail.s)'));
 assert.ok(page.includes('planClientCrafting({'));
 assert.ok(page.includes("priceCraftLeaves(plan.leaves,prices)"));
 assert.ok(page.includes("activeGraph=await loadGraph(id)"));
 assert.ok(page.includes("strictTargetBatch:true"));
 assert.ok(item.includes('"/tools/crafting/?id="+item.id'));
 assert.ok(full.includes('planner.href=localePrefix(lang)+"/tools/crafting/?id="+encodeURIComponent(id)'));
});
