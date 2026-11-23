import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientRecipeViews} from "../src/data/client-craft-recipe-views.mjs";

const read=path=>readFileSync(path,"utf8");
const item=id=>{
  const bucket=String(Math.floor(Number(id)/1000)).padStart(2,"0");
  return JSON.parse(read("public/data/client-items/details/"+bucket+".json")).items[id];
};

test("Spirit Sword is one useful recipe even when a general file omitted Unit",()=>{
  const original=item("1");
  assert.equal(original.s.length,2);
  assert.equal(original.s[0][7],null);
  assert.equal(original.s[1][7],1);
  const recipes=buildClientRecipeViews(original.s);
  assert.equal(recipes.length,1,"Do not show identical materials as competing recipes");
  assert.equal(recipes[0].batchSize,1);
  assert.equal(recipes[0].batchStatus,"partial");
  assert.deepEqual(recipes[0].materials,[["5100",5],["6080",4]]);
  assert.deepEqual(recipes[0].sourceRows,[112473,192767]);
});

test("Abyssal Oriharukon keeps its actual 500-unit batch and material IDs",()=>{
  const recipes=buildClientRecipeViews(item("4819").s);
  assert.equal(recipes.length,1);
  assert.equal(recipes[0].batchSize,500);
  assert.equal(recipes[0].batchStatus,"consistent");
  assert.deepEqual(recipes[0].materials,[["8494",1],["20339",1000]]);
  assert.deepEqual(recipes[0].sourceRows,[118506]);
});

test("different materials and conflicting batch units are explicit, never guessed",()=>{
  const source=(id,unit,m)=>[id,"ItemTypeSword.ndt","specific","Sword",
    "1","NORMAL",450,unit,"parsed-client-recipe",m];
  const views=buildClientRecipeViews([
    source(4,500,[["5100",5],["6080",4]]),
    source(6,1000,[["6080",4],["5100",5]]),
    source(9,null,[["5100",5],["6080",4]]),
    source(12,200,[["5100",6],["6080",4]]),
  ]);
  assert.equal(views.length,2,"Different material quantities must remain distinct");
  assert.equal(views[0].batchStatus,"conflict");
  assert.equal(views[0].batchSize,null);
  assert.deepEqual(views[0].reportedBatches,[500,1000]);
  assert.deepEqual(views[0].sourceRows,[4,6,9]);
  assert.equal(views[1].batchStatus,"consistent");
  assert.equal(views[1].batchSize,200);
  assert.throws(()=>buildClientRecipeViews([source(4,100,[["5100",0]])]),
    /Invalid original recipe material pair/);
});

test("community item detail prioritizes use, crafting and sources before audit data",()=>{
  const page=read("src/components/FullClientItemDatabasePage.astro");
  assert.ok(page.includes('pt?"FICHA DO ITEM":"ITEM INFORMATION"'));
  assert.ok(page.includes('pt?"Informações do item":"About this item"'));
  assert.ok(page.includes('pt?"Como fabricar":"Crafting materials"'));
  assert.ok(page.includes('pt?"Onde obter":"Where to find"'));
  assert.ok(page.includes('pt?"Dados originais dos arquivos":"Original client records"'));
  assert.ok(page.includes('node("details",undefined,"wiki-technical")'));
  assert.ok(page.includes('buildClientRecipeViews(data.s)'));
  assert.ok(page.includes('recipe.sourceRows.map'));
  assert.ok(page.includes('itemCell.append(linkItem(materialId'));
  assert.ok(page.includes('find.href=prefix+"/monsters/?item="'));
  const display=page.slice(page.indexOf("        addItemOverview(details,row,data)"),
    page.indexOf("      }catch{",page.indexOf("        addItemOverview(details,row,data)")));
  for(const snippet of ["addItemOverview(details,row,data)",
    "addCraftBatchInformation(details,data)",
    "addCraftRecipeTables(details,data)",
    "addUsedInTable(details,id)","addMonsterSources(details,id)",
    "addDefinitionTable(details,data,id)"]){
    assert.ok(display.includes(snippet),snippet);
  }
  assert.ok(display.indexOf("addCraftRecipeTables(details,data)")<
    display.indexOf("addDefinitionTable(details,data,id)"));
  assert.ok(page.includes('<style is:global>'));
  assert.ok(page.includes(".wiki-table-scroll tbody tr:nth-child(even)"));
  assert.ok(page.includes(".wiki-table-scroll a:focus-visible"));
  assert.ok(page.includes('class="reader-guide"'));
  assert.ok(!page.includes("const throw="),"JavaScript reserved names must not be used");
});
