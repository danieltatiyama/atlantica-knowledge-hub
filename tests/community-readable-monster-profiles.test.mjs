import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(path,"utf8");

test("bestiary puts player-facing items before technical creature rows",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  const begin=page.indexOf("async function openCreature");
  const end=page.indexOf('    close.addEventListener(',begin);
  const content=page.slice(begin,end);
  assert.ok(content.includes('pt?"Itens que podem aparecer":"Possible monster drops"'));
  assert.ok(content.includes('pt?"Outros itens possíveis — grupos de drops":"Other possible items — loot groups"'));
  assert.ok(content.includes('pt?"Registros originais do cliente":"Original client records"'));
  assert.ok(content.includes('node("details",undefined,"community-creature-audit")'));
  assert.ok(content.indexOf("body.append(directSection)")<
    content.indexOf("body.append(groupsSection)"));
  assert.ok(content.indexOf("body.append(groupsSection)")<
    content.indexOf("body.append(audit)"));
});

test("community drop rows expose estimated percentages and exact item links, with source details on demand",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  const begin=page.indexOf("function appendItemTable(");
  const end=page.indexOf("let shownId=",begin);
  const table=page.slice(begin,end);
  assert.ok(table.includes("formatCandidateClientRate(itemRate"));
  assert.ok(table.includes("formatCandidateClientRate(groupRef?.[2]"));
  assert.ok(table.includes("node(\"details\",undefined,\"client-record-row\")"));
  assert.ok(table.includes('itemLink(itemId,itemName)'));
  assert.ok(table.includes('pt?"Ver origem":"View source"'));
  for(const label of ["GroupID","Band","RawRate","Reference row","Item source row","Source row"])
    assert.ok(table.includes(label),label);
  assert.ok(table.includes('pt?"Quantidade possível":"Possible amount"'));
  assert.ok(!table.includes(".innerHTML"));
  assert.ok(!table.includes("finalDropChance"));
  assert.ok(!table.includes("combinedRate"));
});

test("source audit keeps original Characters and optional Miner rows intact",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  assert.ok(page.includes("const original=character?.items?.[id]?.original??[];"));
  assert.ok(page.includes("const miner=character?.items?.[id]?.miner??[];"));
  assert.ok(page.includes('],"original)')||page.includes('],original)')||page.includes('],original);'));
  assert.ok(page.includes('],miner)'));
  assert.ok(page.includes("source-band-details"));
  assert.ok(page.includes("groupData.bands"));
  assert.ok(page.includes('body.append(audit)'));
});

test("bestiary table styles support keyboard, alternating rows, and phones",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  assert.ok(page.includes(".community-drop-section"));
  assert.ok(page.includes(".community-creature-audit"));
  assert.ok(page.includes(".client-record-row summary:focus-visible"));
  assert.ok(page.includes("@media(max-width:700px)"));
  assert.ok(page.includes("tbody tr:nth-child(even)"));
  assert.ok(page.includes("width:min(1600px,calc(100% - 36px))"));
});
