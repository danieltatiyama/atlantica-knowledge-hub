import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";
import {buildCraftingWorkbook,createStoredZip} from "../src/data/client-crafting-xlsx.mjs";
import {planClientCrafting} from "../src/data/client-crafting-planner.mjs";

const read=p=>JSON.parse(readFileSync(p,"utf8"));
const recipe=id=>{
 const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
 return buildClientRecipeViews(read("public/data/client-items/details/"+bucket+".json").items[id].s);
};
const decoder=new TextDecoder();
function unzipStored(bytes){
 const out=new Map();const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let position=0;
 while(position+30<=bytes.length&&view.getUint32(position,true)===0x04034b50){
  assert.equal(view.getUint16(position+8,true),0,"ZIP must use uncompressed STORE");
  const size=view.getUint32(position+18,true),rawSize=view.getUint32(position+22,true);
  const nameLength=view.getUint16(position+26,true),extra=view.getUint16(position+28,true);
  assert.equal(size,rawSize);
  const name=decoder.decode(bytes.subarray(position+30,position+30+nameLength));
  const dataStart=position+30+nameLength+extra;
  assert.ok(dataStart+size<=bytes.length,name);
  out.set(name,decoder.decode(bytes.subarray(dataStart,dataStart+size)));
  position=dataStart+size;
 }
 assert.equal(view.getUint32(position,true),0x02014b50,"ZIP central directory required");
 const eocd=bytes.length-22;
 assert.equal(view.getUint32(eocd,true),0x06054b50,"ZIP end record required");
 assert.equal(view.getUint16(eocd+10,true),out.size,"all local entries are in ZIP directory");
 return out;
}
const planBait=()=>planClientCrafting({
 itemId:"2319",quantity:10000,strictTargetBatch:true,
 recipesById:{"2319":recipe("2319"),"3305":recipe("3305"),"3310":recipe("3310")},
 itemCategories:{"2319":"FISH","3305":"Food","3310":"Food"},
});
const names={
 "2319":"Albert's Special Bait","3305":"Dumpling","3310":"Grilled Pork",
 "3200":"Sesame Oil","3130":"Wheat","3135":"Pork","16000":"Salt",
};
test("per-parent consumption breakdown uses exact parent batch quantities, not shared total",()=>{
 const p=planBait();
 const dumpling=p.tree.find(x=>x.itemId==="3305");
 assert.equal(dumpling.parentItemId,"2319");
 assert.equal(dumpling.unitsPerParentBatch,"350");
 assert.equal(dumpling.parentBatches,"100");
 assert.equal(dumpling.branchQuantity,"35000");
 const pork=p.tree.filter(x=>x.itemId==="3135");
 assert.equal(pork.length,2);
 assert.deepEqual(pork.map(x=>[x.parentItemId,x.unitsPerParentBatch,x.parentBatches,x.branchQuantity]),
  [["3305","4","3500","14000"],["3310","8","3500","28000"]]);
 assert.ok(pork.every(x=>x.totalRequired==="42000"),
  "Totals are shared, but each parent breakdown must retain its own consumption");
 assert.equal(p.tree[0].parentItemId,null,"Root has no parent consumption");
});
test("rounding 250 to 260 records ingredients for 13 full batches in consumption tree",()=>{
 const mk=(materials,batchSize)=>({materials,batchSize,sourceRows:[1]});
 const p=planClientCrafting({itemId:"1",quantity:1,strictTargetBatch:true,
  recipesById:{"1":[mk([["2",250]],1)],"2":[mk([["3",4]],20)]},
 });
 const branch=p.tree.find(x=>x.itemId==="3");
 assert.equal(branch.parentItemId,"2");
 assert.equal(branch.unitsPerParentBatch,"4");
 assert.equal(branch.parentBatches,"13");
 assert.equal(branch.branchQuantity,"52");
 assert.equal(p.steps.find(x=>x.itemId==="2").output,"260");
});
test("Crafting Tree XLSX creates a valid ZIP/OOXML multi-sheet workbook",()=>{
 const bytes=buildCraftingWorkbook({
  plan:planBait(),names,prices:{"3200":"1000","3135":"300"},locale:"en",
 });
 assert.ok(bytes instanceof Uint8Array);
 assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4B);
 const zip=unzipStored(bytes);
 assert.equal(zip.size,9);
 for(const part of ["[Content_Types].xml","_rels/.rels","xl/styles.xml",
  "xl/workbook.xml","xl/_rels/workbook.xml.rels",
  "xl/worksheets/sheet1.xml","xl/worksheets/sheet2.xml",
  "xl/worksheets/sheet3.xml","xl/worksheets/sheet4.xml"])
  assert.ok(zip.has(part),part);
 const book=zip.get("xl/workbook.xml");
 for(const name of ["Crafting Tree","Craft Schedule","Shopping List","Leftovers"])
  assert.ok(book.includes('name="'+name+'"'),name);
 assert.ok(zip.get("xl/styles.xml").includes('numFmtId="3"'),
  "Numeric values use spreadsheet numeric formatting");
 assert.ok(zip.get("xl/worksheets/sheet1.xml").includes('state="frozen"'));
 assert.ok(zip.get("xl/worksheets/sheet1.xml").includes('<autoFilter ref="A5:Q'));
});
test("tree worksheet preserves hierarchy, parent consumption, rounding and shared totals",()=>{
 const p=planBait();
 const zip=unzipStored(buildCraftingWorkbook({plan:p,names,locale:"en"}));
 const tree=zip.get("xl/worksheets/sheet1.xml");
 for(const part of [
  "Consumption breakdown","Consumed in branch","To craft",
  "Albert&apos;s Special Bait","Dumpling",
  "3 × 9800 + 1 × 5600",
  "3 × 4000 + 1 × 2000","3 × 8000 + 1 × 4000",
  "1000","35000","42000","3 × 10000 + 1 × 5000",
 ])assert.ok(tree.includes(part),part);
 assert.ok(tree.includes('s="25"')||tree.includes('s="26"'),
  "Hierarchy cells use depth-aware indentation");
 const schedule=zip.get("xl/worksheets/sheet2.xml");
 assert.ok(schedule.includes("Grilled Pork"));
 assert.ok(schedule.includes("3 × 10000 + 1 × 5000"));
});
test("shopping worksheet has editable numeric prices and Excel formulas, never formulas from names",()=>{
 const p=planBait(),weirdNames={...names,"3200":'=HYPERLINK("https://bad.test") & <script>'};
 const zip=unzipStored(buildCraftingWorkbook({
  plan:p,names:weirdNames,prices:{"3200":"123","3130":"","3135":"0"},locale:"en",
 }));
 const shop=zip.get("xl/worksheets/sheet3.xml");
 assert.ok(shop.includes('<f>IF(D6=&quot;&quot;,&quot;&quot;,C6*D6)</f>'));
 assert.ok(shop.includes('<v>123</v>'));
 assert.ok(shop.includes('<v>0</v>'));
 assert.ok(shop.includes('&lt;script&gt;'));
 assert.ok(!shop.includes("<script>"));
 assert.ok(shop.includes('t="inlineStr"'),"Names are stored as text");
 assert.ok(shop.includes('Unit price (editable)'));
});
test("Portuguese workbook sheet titles and empty leftovers remain readable",()=>{
 const p=planBait();
 const zip=unzipStored(buildCraftingWorkbook({plan:p,names,locale:"pt-br"}));
 assert.ok(zip.get("xl/workbook.xml").includes('name="Lista de Compras"'));
 assert.ok(zip.get("xl/worksheets/sheet1.xml").includes("Consumo no ramo"));
 assert.ok(zip.get("xl/worksheets/sheet4.xml").includes("Nenhum excedente de batch"));
});
test("ZIP CRC32 matches known fixture and generated workbook is not an HTML/CSV alias",()=>{
 const bytes=createStoredZip([{name:"hello.txt",data:"hello"}]);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert.equal(view.getUint32(14,true),0x3610A686);
 assert.equal(view.getUint32(0,true),0x04034b50);
});
test("calculator exposes Excel export and consumption table inside both locale variants",()=>{
 const c=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 for(const fragment of [
  'id="craft-export-tree"','buildCraftingWorkbook({plan,names,prices',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xlsx"',
  'craftingText(lang,"Consumption breakdown","Divisão do consumo")',
  'row.unitsPerParentBatch',
  'row.parentBatches',
  'class="craft-data-table craft-schedule-table"',
  'class="craft-data-table craft-shopping-table"',
  'class="craft-table-panel craft-shopping-panel"',
  'class="craft-cost-summary"',
 ])assert.ok(c.includes(fragment),fragment);
});

test("six additional localized workbooks retain numeric data, formulas and four sheets",()=>{
 const expected={fr:"Arbre de fabrication",de:"Herstellungsbaum",es:"Árbol de fabricación",ko:"제작 트리","zh-hans":"制作树",ja:"製造ツリー"};
 for(const [locale,title] of Object.entries(expected)){
  const zip=unzipStored(buildCraftingWorkbook({plan:planBait(),names,prices:{"3200":"123"},locale}));
  assert.equal(zip.size,9);
  assert.ok(zip.get("xl/workbook.xml").includes('name="'+title+'"'),locale);
  assert.ok(zip.get("xl/worksheets/sheet1.xml").includes("42000"),locale);
  assert.ok(zip.get("xl/worksheets/sheet3.xml").includes('<f>IF(D6=&quot;&quot;,&quot;&quot;,C6*D6)</f>'),locale);
  assert.ok(zip.get("xl/worksheets/sheet3.xml").includes("<v>123</v>"),locale);
 }
});
