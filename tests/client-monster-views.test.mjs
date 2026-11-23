import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");

test("creature and monster route files exist in en and pt-br",()=>{
  for(const [path,lang] of [
    ["src/pages/monsters/index.astro","en"],
    ["src/pages/pt-br/monsters/index.astro","pt-br"],
  ]){
    assert.ok(existsSync(path),path);
    const page=read(path);
    assert.ok(page.includes('MonsterDatabasePage'));
    assert.ok(page.includes('lang="'+lang+'"'));
  }
});

test("creature browser is schema/snapshot gated and never treats RawRate as percent",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  assert.ok(page.includes("all-client-monster-loot-original"));
  assert.ok(page.includes("meta.files.index")||page.includes("manifest.files.index"));
  assert.ok(page.includes("RawRate"));
  assert.ok(page.includes("CharID"));
  assert.ok(page.includes("source"));
  assert.ok(page.includes("loadShard("));
  assert.ok(page.includes("itemLink(itemId,itemName)"));
  assert.ok(page.includes("GroupID"));
  assert.ok(page.includes("original"));
  assert.ok(page.includes("?id="));
  assert.ok(!page.includes(".innerHTML"));
  assert.ok(!page.includes("RatePctHypothesis"));
});

test("every source-backed item profile and item explorer attaches original direct/group drop data",()=>{
  const reviewed=read("src/components/ItemDetailPage.astro");
  const more=read("src/components/ClientSourceEquipmentPage.astro");
  const all=read("src/components/FullClientItemDatabasePage.astro");
  const widget=read("src/components/MonsterItemSources.astro");
  assert.ok(reviewed.includes('<MonsterItemSources lang={lang} itemId={item.id} />'));
  assert.ok(more.includes('<MonsterItemSources lang={lang} itemId={item.id} />'));
  assert.ok(all.includes("addMonsterSources(details,id)"));
  assert.ok(all.includes("all-client-monster-loot-original"));
  assert.ok(widget.includes("RawRate"));
  assert.ok(widget.includes("item-sources/"));
  assert.ok(widget.includes("/monsters/?id="));
  assert.ok(widget.includes("manifest.json"));
  assert.ok(!widget.includes(".innerHTML"));
});

test("published audited monster data remains source-only; missing data still has an honest fallback",()=>{
  const widget=read("src/components/MonsterItemSources.astro");
  const listing=read("src/components/MonsterDatabasePage.astro");
  assert.match(widget,/pending import and review/);
  assert.match(listing,/Original data import pending/);
  const path="public/data/client-monsters/manifest.json";
  if(existsSync(path)){
    const manifest=JSON.parse(read(path));
    assert.equal(manifest.schemaVersion,"1.0");
    assert.equal(manifest.snapshotId,1);
    assert.equal(manifest.dataset,"all-client-monster-loot-original");
    assert.equal(manifest.catalogMonsterIds,4351);
    assert.equal(manifest.directSourceRows,9959);
    assert.equal(manifest.groupReferenceRows,5784);
    assert.equal(manifest.groupDropRows,3076);
    assert.equal(manifest.groupBandRows,572);
    assert.equal(manifest.reverseItemIds,893);
    assert.equal(manifest.groupSourceJoins,172120);
    assert.equal(manifest.files.index.length,3);
    assert.equal(manifest.files.itemSources.length,30);
    assert.match(manifest.notice,/NOT verified probabilities/);
  }
});

test("header and home expose the bilingual client monster source catalog",()=>{
  const header=read("src/components/Header.astro");
  const home=read("src/components/HomePage.astro");
  assert.ok(header.includes('monstersHref'));
  assert.ok(header.includes('isMonsterCatalog'));
  assert.ok(home.includes('Monsters & Drops'));
  assert.ok(home.includes('"/pt-br/monsters/"'));
});
