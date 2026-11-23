import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
import {deriveParentConsumptionGroups,planClientCrafting}
 from "../src/data/client-crafting-planner.mjs";

const data=path=>JSON.parse(readFileSync(path,"utf8"));
const recipe=id=>{
 const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
 return buildClientRecipeViews(
  data("public/data/client-items/details/"+bucket+".json").items[id].s);
};
const groupText=groups=>groups.map(g=>g.operations+" × "+g.consumedEach).join(" + ");
const armorPlan=count=>planClientCrafting({
 itemId:"645",quantity:count,strictTargetBatch:true,
 recipesById:{"645":recipe("645")},
 itemCategories:{"645":"Armor"},
});
test("20 Judgment Heavy Armors consume Anarchy Stone in exactly one parent operation",()=>{
 const plan=armorPlan(20);
 const armor=plan.steps.find(x=>x.itemId==="645");
 const stone=plan.tree.find(x=>x.itemId==="8165");
 assert.ok(stone,"Known Anarchy Stone ItemID must be present");
 assert.equal(armor.operations,"1");
 assert.equal(armor.operationGroups[0].outputEach,"20");
 assert.equal(stone.branchQuantity,"5000");
 assert.deepEqual(stone.consumptionGroups,[
  {operations:"1",consumedEach:"5000",totalConsumed:"5000"},
 ]);
 assert.equal(groupText(stone.consumptionGroups),"1 × 5000");
 assert.equal(stone.unitsPerParentBatch,"250");
 assert.equal(stone.parentBatches,"20","Keep original source batch evidence");
});
test("142 armors split into 7×20 + 1×2, and stones into 7×5000 + 1×500",()=>{
 const plan=armorPlan(142);
 const stone=plan.tree.find(x=>x.itemId==="8165");
 assert.equal(groupText(stone.consumptionGroups),"7 × 5000 + 1 × 500");
 assert.equal(stone.branchQuantity,"35500");
 assert.deepEqual(stone.consumptionGroups.map(g=>g.totalConsumed),["35000","500"]);
 assert.equal(stone.consumptionGroups.reduce((s,g)=>s+BigInt(g.totalConsumed),0n),35500n);
});
test("intermediate parent with a 10-item batch uses operation quantities rather than overall batch count",()=>{
 const plan=planClientCrafting({
  itemId:"2319",quantity:10000,strictTargetBatch:true,
  recipesById:{"2319":recipe("2319"),"3305":recipe("3305"),"3310":recipe("3310")},
  itemCategories:{"2319":"FISH","3305":"Food","3310":"Food"},
 });
 const dumpling=plan.tree.find(x=>x.itemId==="3305");
 const wheat=plan.tree.find(x=>x.itemId==="3130");
 assert.equal(groupText(dumpling.consumptionGroups),"1 × 35000");
 assert.equal(groupText(wheat.consumptionGroups),"3 × 6000 + 1 × 3000");
 assert.equal(wheat.branchQuantity,"21000");
 const pork=plan.tree.filter(x=>x.itemId==="3135");
 assert.deepEqual(pork.map(row=>groupText(row.consumptionGroups)),
  ["3 × 4000 + 1 × 2000","3 × 8000 + 1 × 4000"]);
 assert.ok(pork.every(row=>row.totalRequired==="42000"),
  "Shared total is not the parent operation consumption");
});
test("parent operation consumption requires full batches and preserves exact integer totals",()=>{
 assert.deepEqual(deriveParentConsumptionGroups({
  unitsPerParentBatch:250,parentBatchSize:1,
  parentOperationGroups:[{operations:"1",outputEach:"20"}],
 }),[{operations:"1",consumedEach:"5000",totalConsumed:"5000"}]);
 assert.throws(()=>deriveParentConsumptionGroups({
  unitsPerParentBatch:4,parentBatchSize:20,
  parentOperationGroups:[{operations:"1",outputEach:"21"}],
 }),/full multiple/);
});
test("Crafting Tree uses content-driven compact widths and retains sticky column snap",()=>{
 const ui=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 const section=ui.slice(ui.indexOf(' #wiki-craft-planner .craft-tree-table{'),
  ui.indexOf(' #wiki-craft-planner .craft-tree-table tbody tr{'));
 assert.ok(section.includes("width:max-content;min-width:0;"));
 assert.ok(section.includes("table-layout:auto"));
 assert.ok(!section.includes("min-width:1460px"));
 assert.ok(!section.includes("width:25%"));
 assert.ok(section.includes("scroll-snap-align:start"));
 assert.ok(ui.includes("scroll-snap-type:x proximity"));
 assert.ok(ui.includes("position:sticky;left:0;z-index:5;"));
 assert.ok(ui.includes("row.consumptionGroups??[]"));
 assert.ok(ui.includes('fmt(group.operations)+" × "+fmt(group.consumedEach)'));
});
test("nation calendar CSS targets dynamically generated cells and keeps status colors readable",()=>{
 const c=readFileSync("src/components/NationDungeonCalendarPage.astro","utf8");
 assert.ok(c.includes("<style is:global>"),
  "Cells created by document.createElement need global page-scoped CSS");
 for(const snippet of [
  "#nation-calendar #nd-grid :is(th,td){",
  "#nation-calendar #nd-grid td.ready{",
  "#nation-calendar #nd-grid td.cooldown{",
  "#nation-calendar #nd-grid td.gap{",
  "#nation-calendar #nd-grid thead th:first-child{",
  "#nation-calendar #nd-grid tbody th{",
  "#nation-calendar #nd-cooldown-inputs label{",
  "#nation-calendar #nd-rule-list li{",
  'grid.style.minWidth=(daysOnColumns?Math.max(800,days*116+100):1900)+"px";',
  'th.classList.add("is-weekend");',
  'td.setAttribute("aria-label",td.title);',
  'role="region" tabindex="0"',
 ])assert.ok(c.includes(snippet),snippet);
 assert.ok(c.includes("weekdayFormatter"));
 assert.ok(c.includes("scope="+'"row"'));
});
