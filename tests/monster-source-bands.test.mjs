import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(path,"utf8");

test("all 572 original group-band rows are preserved under unique original GroupIDs",()=>{
  const manifest=JSON.parse(read("public/data/client-monsters/manifest.json"));
  assert.equal(manifest.groupBandRows,572);
  assert.equal(manifest.groupDropRows,3076);
  assert.equal(manifest.groupReferenceRows,5784);
  let bands=0,drops=0,groups=0;
  for(const file of manifest.files.groups){
    const shard=JSON.parse(read("public/data/client-monsters/"+file));
    assert.equal(shard.schemaVersion,"1.0");
    assert.equal(shard.snapshotId,1);
    for(const [groupId,entry] of Object.entries(shard.items)){
      assert.equal(Math.floor(Number(groupId)/1000),shard.bucket);
      assert.ok(Array.isArray(entry.bands));
      assert.ok(Array.isArray(entry.drops));
      groups++;
      bands+=entry.bands.length;
      drops+=entry.drops.length;
      for(const band of entry.bands){
        assert.equal(band.length,5);
        assert.ok(Number.isInteger(band[0])&&band[0]>0);
        for(const raw of band.slice(1))
          assert.ok(raw===null||typeof raw==="string");
      }
      for(const row of entry.drops){
        assert.equal(row.length,8);
        assert.ok(typeof row[1]==="string"||row[1]===null);
      }
    }
  }
  assert.equal(groups,149);
  assert.equal(bands,572);
  assert.equal(drops,3076);
});

test("source group 2 has separate original bands and multiple item source bands",()=>{
  const groups=JSON.parse(read("public/data/client-monsters/groups/00.json"));
  const two=groups.items["2"];
  assert.ok(two);
  assert.equal(two.bands.length,6);
  assert.ok(two.drops.length>6);
  assert.deepEqual(two.bands[0],[5,"1","1","3","10000"]);
  assert.ok(new Set(two.drops.map(d=>d[1])).size>=2);
  assert.equal(two.drops[0][1],"1");
  assert.equal(two.drops[0][2],"2040");
  assert.equal(two.drops[0][3],"Healing Potion [I]");
});

test("Atlantica-style creature profile filters and panels preserve raw fields",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  assert.ok(page.includes('id="creature-loot-mode"'));
  assert.ok(page.includes("lootMode.disabled=false"));
  assert.ok(page.includes("links==="+'"direct"'));
  assert.ok(page.includes("links==="+'"group"'));
  assert.ok(page.includes('id="creature-fact-direct"'));
  assert.ok(page.includes('id="creature-fact-groups"'));
  assert.ok(page.includes('id="creature-fact-level"'));
  assert.ok(page.includes("source-band-details"));
  assert.ok(page.includes("groupData.bands"));
  assert.ok(page.includes("groupData.bands.length"));
  for(const field of ["BandKey","EntryCount","RawSum","Band"])
    assert.ok(page.includes(field));
  assert.ok(page.includes("raw(source[1])"));
  assert.ok(page.includes("raw(groupRef?.[2])"));
  assert.ok(page.includes("original configuration values"));
  assert.ok(!page.includes(".innerHTML"));
});

test("reverse ItemID evidence keeps original Band without combining rate fields",()=>{
  const finder=read("src/components/MonsterDropItemSearch.astro");
  const item=read("src/components/MonsterItemSources.astro");
  const all=read("src/components/FullClientItemDatabasePage.astro");
  assert.ok(finder.includes('create("td",asText(entry[8]))'));
  assert.ok(item.includes('tr.insertCell().textContent=raw(band)'));
  assert.ok(all.includes('String(row[8]??"—")'));
  for(const src of [finder,item,all])assert.ok(src.includes("RawRate")||src.includes("rawRate"));
});
