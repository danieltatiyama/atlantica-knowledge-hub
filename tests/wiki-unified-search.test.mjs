import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {foldSearch,buildWikiSearchRecords,searchWikiRecords}
  from "../src/data/wiki-unified-search.mjs";

const shard=(rows)=>({schemaVersion:"1.0",snapshotId:1,rows});
const items=shard([
  ["7080","Silver Thread","Material",null,null,null,"named"],
  ["7070","Gold Thread","Material",null,null,null,"named"],
  ["123","No Label",null,null,null,null,"unresolved"],
]);
const monsters=shard([["289","Huge Crocodile","71"],["999",null,"1"]]);
const guides=[{title:"Planning Nation Dungeon Runs",description:"Run schedule",href:"/guides/nation-dungeon-runs/"}];

test("global search ranks exact IDs and names above partials",()=>{
  const records=buildWikiSearchRecords([items],[monsters],guides);
  assert.equal(records.length,5);
  assert.equal(searchWikiRecords(records,"7080")[0].title,"Silver Thread");
  assert.equal(searchWikiRecords(records,"HUGE crocodile")[0].href,"/monsters/?id=289");
  assert.equal(searchWikiRecords(records,"silver thread")[0].id,"7080");
  assert.equal(searchWikiRecords(records,"dungeon",{kind:"guide"}).length,1);
  assert.equal(searchWikiRecords(records,"dungeon",{kind:"item"}).length,0);
  assert.equal(searchWikiRecords(records,"S").length,0);
  assert.ok(searchWikiRecords(records,"thread").length>=2);
});
test("Portuguese routes, accent folding and missing monster names are handled",()=>{
  const records=buildWikiSearchRecords([items],[monsters],guides,"pt-br");
  assert.ok(records.some(r=>r.href==="/pt-br/items/database/?id=7080"));
  assert.ok(records.some(r=>r.href==="/pt-br/monsters/?id=999"));
  assert.equal(foldSearch("  CríaTÚra  "),"criatura");
  assert.equal(searchWikiRecords(records,"CharID 999")[0].id,"999");
});
test("item search uses localized routes while monster routes fall back safely",()=>{
  for(const lang of ["fr","de","es","ko","zh-hans","ja"]){
    const records=buildWikiSearchRecords([items],[monsters],guides,lang);
    assert.equal(searchWikiRecords(records,"7080")[0].href,"/"+lang+"/items/database/?id=7080");
    assert.equal(searchWikiRecords(records,"289")[0].href,"/monsters/?id=289");
  }
});
test("source indexes reject duplicates and unexpected data",()=>{
  assert.throws(()=>buildWikiSearchRecords([items,items],[monsters],[]),/Duplicate/);
  assert.throws(()=>buildWikiSearchRecords([shard([["0","Invalid"]])],[monsters],[]),/invalid/);
  assert.throws(()=>buildWikiSearchRecords([{rows:[]}],[monsters],[]),/Unexpected/);
});
test("shared header and home render the search entry; links target supported ID routes",()=>{
  const read=path=>readFileSync(path,"utf8");
  const header=read("src/components/Header.astro");
  const home=read("src/components/HomePage.astro");
  const ui=read("src/components/GlobalSearch.astro");
  assert.ok(header.includes('import GlobalSearch from "./GlobalSearch.astro"'));
  assert.ok(header.includes('<GlobalSearch lang={lang} />'));
  assert.ok(header.includes("data-global-search-open"));
  assert.ok(home.includes("data-global-search-open"));
  assert.ok(ui.includes('event.key.toLowerCase()==="k"'));
  assert.ok(ui.includes('if(event.key==="/"'));
  assert.ok(ui.includes('fetchJSON("/data/client-items/manifest.json")'));
  assert.ok(ui.includes('fetchJSON("/data/client-monsters/manifest.json")'));
  assert.ok(ui.includes('itemPaths.length!==6'));
  assert.ok(ui.includes('monsterPaths.length!==3'));
  assert.ok(ui.includes('textContent=item.title'));
  assert.ok(!ui.includes(".innerHTML"));
});
