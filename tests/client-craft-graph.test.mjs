import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  buildCraftLinks
} from "../scripts/generate-client-craft-links.mjs";

const graph=buildCraftLinks();
const sourceRoot="public/data/client-items";
const load=path=>JSON.parse(readFileSync(sourceRoot+"/"+path,"utf8"));

test("all 23,586 original client IDs and all 22,702 named identities are preserved",()=>{
  assert.equal(graph.manifest.dataset,"client-item-crafting-backlinks");
  assert.equal(graph.manifest.snapshotId,1);
  assert.equal(graph.manifest.itemIndexIds,23586);
  assert.equal(graph.manifest.namedItemIds,22702);
  assert.equal(graph.names.size,22702);
  assert.equal(graph.knownIds.size,23586);
  assert.equal(graph.manifest.namedSourceDefinitions,25064);
  assert.ok(graph.manifest.sourceRecipeProducts>529,
    "Graph should cover more than the original 529 reviewed source recipes");
  assert.ok(graph.manifest.ingredientObservations>7506);
  assert.equal(graph.output.size,graph.manifest.files.length+1);
  assert.equal(graph.manifest.linkedMaterialIds,graph.backlinks.size);
});

test("Spirit Sword material links preserve both matching source record IDs",()=>{
  const original=load("details/00.json").items["1"];
  assert.deepEqual(original.s.filter(s=>s[9].length)
    .map(s=>s[9]),[
      [["5100",5],["6080",4]],
      [["5100",5],["6080",4]],
    ]);
  for(const [materialId,quantity] of [["5100",5],["6080",4]]){
    const rows=graph.backlinks.get(materialId);
    assert.ok(rows,"Original material reference missing: "+materialId);
    const sword=rows.find(row=>row[0]==="1"&&row[2]===quantity);
    assert.ok(sword,materialId+" has no reverse link for Spirit Sword");
    assert.equal(sword[1],"Spirit Sword");
    assert.deepEqual(sword[3],original.s.filter(s=>s[9].length).map(s=>s[0]).sort((a,b)=>a-b));
    assert.ok(graph.knownIds.has(materialId),
      "Linked material ID should have a registered client item");
  }
});

test("every generated backlink is tied to an original parsed item material source row",()=>{
  const bySource=new Map();
  for(let bucket=0;bucket<30;bucket++){
    const data=load("details/"+String(bucket).padStart(2,"0")+".json");
    for(const [id,entry] of Object.entries(data.items)){
      for(const def of entry.s)bySource.set(def[0],{id,def});
    }
  }
  let count=0;
  for(const [materialId,reverse] of graph.backlinks){
    assert.match(materialId,/^[1-9]\d*$/);
    for(const [productId,name,quantity,sourceRowIds] of reverse){
      assert.equal(graph.names.get(productId),name);
      assert.ok(Number.isSafeInteger(quantity)&&quantity>0);
      assert.ok(Array.isArray(sourceRowIds)&&sourceRowIds.length>0);
      for(const sourceRowId of sourceRowIds){
        const matching=bySource.get(sourceRowId);
        assert.ok(matching,"Source row "+sourceRowId+" not in original public source");
        assert.equal(matching.id,productId);
        assert.ok(matching.def[8].startsWith("parsed-client"));
        assert.ok(matching.def[9].some(pair=>pair[0]===materialId&&pair[1]===quantity));
      }
      count++;
    }
  }
  assert.equal(count,graph.manifest.backlinks);
});

test("all generated craft shards are manifest-listed, reproducible and correctly bucketed",()=>{
  for(const [filename,data] of graph.output){
    assert.equal(data.schemaVersion,"1.0");
    assert.equal(data.snapshotId,1);
    if(filename==="manifest.json")continue;
    const match=/^used-by-([0-9]+)\.json$/.exec(filename);
    assert.ok(match);
    const bucket=Number(match[1]);
    assert.equal(data.bucket,bucket);
    for(const id of Object.keys(data.items)){
      assert.equal(Math.floor(Number(id)/1000),bucket);
      assert.deepEqual(data.items[id],graph.backlinks.get(id));
    }
  }
});

test("both equipment item and all-ID client details have click-through URLs",()=>{
  const full=readFileSync("src/components/FullClientItemDatabasePage.astro","utf8");
  const equip=readFileSync("src/components/ClientCraftingSummary.astro","utf8");
  const profile=readFileSync("src/components/ItemDetailPage.astro","utf8");
  const backlinks=readFileSync("src/components/ClientCraftingBacklinks.astro","utf8");
  assert.ok(full.includes("addUsedInTable(details,id)"));
  assert.ok(full.includes("sourceDetails(id)"));
  assert.ok(full.includes("originalUsedIn(id)"));
  assert.ok(full.includes('linkItem(productId,name'));
  assert.ok(equip.includes('encodeURIComponent(material.itemId)'));
  assert.ok(profile.includes('<ClientCraftingBacklinks lang={lang} itemId={item.id} />'));
  assert.ok(backlinks.includes("Used in crafting"));
  assert.ok(backlinks.includes("used-by-"));
  assert.ok(!backlinks.includes(".innerHTML"));
});
