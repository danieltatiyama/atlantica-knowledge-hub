import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {createMonsterItemDiscovery} from "../scripts/generate-monster-item-discovery.mjs";

const read=path=>readFileSync(path,"utf8");
const generated=createMonsterItemDiscovery();

test("source-derived drop discovery covers exactly 893 original named ItemIDs",()=>{
  assert.equal(generated.schemaVersion,"1.0");
  assert.equal(generated.snapshotId,1);
  assert.equal(generated.dataset,"client-monster-drop-item-discovery");
  assert.equal(generated.itemIds,893);
  assert.equal(generated.rows.length,893);
  assert.equal(generated.rawDirectSourceRows,9959);
  assert.equal(generated.derivedGroupReferences,172120);
  assert.ok(generated.notice.includes("not confirm server availability"));
  assert.deepEqual(generated.columns,[
    "ItemID","EnglishName","DirectSourceRows","DerivedGroupReferences",
    "UniqueDirectCreatureIDs","UniqueGroupCreatureIDs",
  ]);
  assert.equal(new Set(generated.rows.map(x=>x[0])).size,893);
  for(const [id,name,direct,group,directCreatures,groupCreatures] of generated.rows){
    assert.match(id,/^[1-9]\d{0,12}$/);
    assert.ok(typeof name==="string"&&name.length>0);
    for(const n of [direct,group,directCreatures,groupCreatures])
      assert.ok(Number.isSafeInteger(n)&&n>=0);
    assert.ok(direct+group>0);
    assert.ok(directCreatures<=direct);
    assert.ok(groupCreatures<=group);
  }
});

test("original Spirit Equipment Box is linked to direct creature drops without rate interpretation",()=>{
  const entry=generated.rows.find(x=>x[0]==="20900");
  assert.ok(entry);
  assert.equal(entry[1],"Spirit Equipment Box");
  assert.ok(entry[2]>=2);
  assert.ok(entry[4]>=2);
  const manifest=JSON.parse(read("public/data/client-monsters/manifest.json"));
  assert.equal(manifest.groupSourceJoins,generated.derivedGroupReferences);
  assert.equal(manifest.directSourceRows,generated.rawDirectSourceRows);
});

test("bestiary UX links items, source drops, recipes and creature detail using exact IDs",()=>{
  const finder=read("src/components/MonsterDropItemSearch.astro");
  const bestiary=read("src/components/MonsterDatabasePage.astro");
  const reviewed=read("src/components/ClientCraftingSummary.astro");
  const source=read("src/components/ClientSourceEquipmentPage.astro");
  const itemDrops=read("src/components/MonsterItemSources.astro");
  const allItems=read("src/components/FullClientItemDatabasePage.astro");
  assert.ok(finder.includes("client-monster-drop-item-discovery"));
  assert.ok(finder.includes('meta.itemIds!==893'));
  assert.ok(finder.includes("source.direct"));
  assert.ok(finder.includes("source.group"));
  assert.ok(finder.includes('url.searchParams.set("item",itemId)'));
  assert.ok(finder.includes('"/monsters/?id="'));
  assert.ok(finder.includes("showItem(selected,false)"));
  assert.ok(finder.includes('type="search"'));
  assert.ok(finder.includes("sourceRows.slice(shown,shown+50)"),
    "High-fanout derived group references must remain paginated");
  assert.ok(bestiary.includes('<MonsterDropItemSearch lang={lang}/>'));
  assert.ok(bestiary.includes("bestiary-crest"));
  assert.ok(bestiary.includes("bestiary-stats"));
  assert.ok(bestiary.includes("#creature-db"));
  assert.ok(reviewed.includes('"/monsters/?item="'));
  assert.ok(source.includes('"/monsters/?item="'));
  assert.ok(itemDrops.includes('"/monsters/?item="'));
  assert.ok(allItems.includes('"/monsters/?item="'));
  assert.ok(!finder.includes(".innerHTML"));
  assert.ok(!bestiary.includes(".innerHTML"));
});

test("generated lookup is intentionally excluded from the immutable original 53 JSONs",()=>{
  const ignored=read(".gitignore");
  const packageJSON=JSON.parse(read("package.json"));
  assert.ok(ignored.includes("/public/data/client-monster-discovery/"));
  assert.ok(packageJSON.scripts.prebuild.includes("generate-monster-item-discovery.mjs"));
  assert.ok(packageJSON.scripts.predev.includes("generate-monster-item-discovery.mjs"));
  assert.equal(packageJSON.scripts["generate:monster-item-lookup"],
    "node scripts/generate-monster-item-discovery.mjs");
  assert.ok(existsSync("scripts/verify-client-monster-source-hashes.py"));
});
