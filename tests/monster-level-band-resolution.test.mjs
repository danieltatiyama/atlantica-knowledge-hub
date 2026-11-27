import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  selectClientLevelBand,resolveClientCreatureDrops,
  estimatedTwoStagePercent,formatLevelResolvedPercent,
  resolvedReverseRowForDrop,
} from "../src/data/client-monster-drop-resolver.mjs";
import {createLevelResolvedDiscovery} from "../scripts/generate-monster-level-resolved.mjs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));

const groupFile=read("public/data/client-monsters/groups/00.json");
const groups=groupFile.items;
const loot=read("public/data/client-monsters/loot/00.json").items;
const characterIndex=read("public/data/client-monsters/index-00.json").rows;
const crocodile=characterIndex.find(r=>r[0]==="289");

test("Huge Crocodile lv71 matches exactly six in-game item names and excludes Gold Thread",()=>{
  assert.deepEqual(crocodile.slice(0,3),["289","Huge Crocodile","71"]);
  assert.equal(loot["289"].direct.length,0);
  assert.equal(loot["289"].groups.length,4,"Four source groups do not mean four possible items");
  const result=resolveClientCreatureDrops(crocodile,loot["289"],groups);
  assert.equal(result.unresolved.length,0);
  assert.equal(result.rows.length,6);
  assert.deepEqual(result.rows.map(row=>[row.name,row.itemId,row.estimatedPercent]),[
    ["Silver Thread","7080",30],
    ["Thick Animal Bone","8002",14],
    ["Large Animal Bone","8003",6],
    ["Slab of Lumber","6002",10],
    ["Pine","6050",10],
    ["Secret Material Chest","20996",0.1],
  ]);
  assert.ok(!result.rows.some(r=>r.itemId==="7070"),"Gold Thread is not a Huge Crocodile drop");
  assert.equal(formatLevelResolvedPercent(0.1,"pt-br"),"0,1%");
  assert.equal(formatLevelResolvedPercent(30,"en"),"30%");
});

test("GroupBands.BandKey brackets select highest threshold not above recorded character level",()=>{
  const silver=selectClientLevelBand(groups["14"],71);
  assert.deepEqual([silver.band,silver.minimumLevel],["3",60]);
  const gold=selectClientLevelBand(groups["14"],80);
  assert.deepEqual([gold.band,gold.minimumLevel],["4",80]);
  const exact=selectClientLevelBand(groups["3"],70);
  assert.equal(exact.band,"3");
  assert.equal(selectClientLevelBand(groups["4"],79),null,
    "Client level below first BandKey must remain unresolved, not guessed");
  assert.equal(selectClientLevelBand(groups["14"],null),null);
  assert.equal(selectClientLevelBand(null,71),null);
});

test("estimated percentages use independent raw fields from each two-stage group",()=>{
  assert.equal(estimatedTwoStagePercent("3000","10000"),30);
  assert.equal(estimatedTwoStagePercent("2000","7000"),14);
  assert.equal(estimatedTwoStagePercent("2000","3000"),6);
  assert.equal(estimatedTwoStagePercent("2000","5000"),10);
  assert.equal(estimatedTwoStagePercent("200","500"),0.1);
  assert.equal(estimatedTwoStagePercent("200",null),null);
  assert.equal(estimatedTwoStagePercent("10001","100"),null);
  assert.equal(formatLevelResolvedPercent(null,"en"),"—");
});

test("generated reverse item sources exclude wrong level bands for every item",()=>{
  const data=createLevelResolvedDiscovery();
  assert.equal(data.index.itemIds,825);
  assert.equal(data.manifest.originalAllBandJoins,172120);
  assert.equal(data.manifest.originalDirectRows,9959);
  assert.equal(data.manifest.levelMatchedGroupRows,26201);
  assert.equal(data.manifest.unmatchedLevelGroupRefs,176);
  assert.equal(data.manifest.originalCharacterIDs,4351);
  assert.equal(data.creatureCounts.length,4351);
  assert.equal(data.creatureCounts.find(x=>x[0]==="289")[1],6);
  const gold=data.items[7]["7070"];
  assert.ok(!gold||!gold.group.some(r=>r[0]==="289"));
  const silver=data.items[7]["7080"];
  assert.ok(silver?.group.some(r=>r[0]==="289"));
  const spirit=data.items[20]["20996"];
  assert.ok(spirit?.group.some(r=>r[0]==="289"));
  assert.equal(data.index.rows.length,825);
  assert.equal(data.index.derivedGroupReferences,26201);
  assert.equal(data.index.unmatchedLevelGroupRefs,176);
  assert.equal(data.manifest.files.itemSources.length,30);
});

test("original source records remain reconstructible in the resolved reverse links",()=>{
  const resolved=resolveClientCreatureDrops(crocodile,loot["289"],groups);
  const silver=resolvedReverseRowForDrop("289","Huge Crocodile",resolved.rows[0]);
  assert.equal(silver.length,11);
  assert.deepEqual(silver,["289","Huge Crocodile","14",228,203,"3000","10000","1","3","1","1"]);
});

test("public UIs use level-selected sources but preserve exact raw records as optional evidence",()=>{
  const source=p=>readFileSync(p,"utf8");
  const monster=source("src/components/MonsterDatabasePage.astro");
  const codex=source("src/components/MonsterDropItemSearch.astro");
  const profile=source("src/components/MonsterItemSources.astro");
  const explorer=source("src/components/FullClientItemDatabasePage.astro");
  assert.ok(monster.includes("resolveClientCreatureDrops(entity,rawLoot,groupData)"));
  assert.ok(monster.includes("appendItemTable(directSection,selected.rows)"));
  assert.ok(monster.includes('selected.unresolved.length'));
  assert.ok(monster.includes('creature-counts.json'));
  assert.ok(!monster.includes("body.append(groupsSection)"));
  for(const itemUI of [codex,profile,explorer]){
    assert.ok(itemUI.includes("/data/client-monster-discovery/"));
    assert.ok(itemUI.includes("level-resolved-client-monster-loot"));
    assert.ok(itemUI.includes("estimatedTwoStagePercent"));
    assert.ok(itemUI.includes("formatLevelResolvedPercent"));
    assert.ok(itemUI.includes("View source"));
  }
  assert.ok(codex.includes("meta.itemIds!==825"));
  assert.ok(!codex.includes("meta.itemIds!==893"));
  assert.ok(!monster.includes(".innerHTML"));
  assert.ok(!profile.includes(".innerHTML"));
});
