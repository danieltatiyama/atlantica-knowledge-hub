import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {monsterText} from "../src/i18n/monster-ui.mjs";

const read=path=>readFileSync(path,"utf8");

test("bestiary shows all level-matched possible item rows in one table, then raw evidence",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  const a=page.indexOf("async function openCreature");
  const b=page.indexOf('    close.addEventListener(',a);
  const content=page.slice(a,b);
  assert.ok(content.includes('monsterText(lang,"db","Possible monster drops")'));
  assert.equal(monsterText("pt-br","db","Possible monster drops"),"Itens que podem aparecer");
  assert.ok(content.includes("resolveClientCreatureDrops(entity,rawLoot,groupData)"));
  assert.ok(content.includes("appendItemTable(directSection,selected.rows)"));
  assert.ok(content.includes('monsterText(lang,"db","Original client records")'));
  assert.equal(monsterText("pt-br","db","Original client records"),"Registros originais do cliente");
  assert.ok(content.includes('node("details",undefined,"community-creature-audit")'));
  assert.ok(content.indexOf("body.append(directSection)")<
    content.indexOf("body.append(audit)"));
  assert.ok(!content.includes("body.append(groupsSection)"));
});

test("player-facing rows show selected item rate and quantity; original group fields remain optional",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  const a=page.indexOf("function appendItemTable(");
  const b=page.indexOf("let shownId=",a);
  const table=page.slice(a,b);
  assert.ok(table.includes("formatLevelResolvedPercent(source.estimatedPercent"));
  assert.ok(table.includes('itemLink(source.itemId,source.name)'));
  assert.ok(table.includes('node("details",undefined,"client-record-row")'));
  assert.ok(table.includes('monsterText(lang,"db","View source")'));
  assert.equal(monsterText("pt-br","db","View source"),"Ver origem");
  for(const field of ["GroupID","Band","BandKey","RawRate","Reference row","Item source row","Source row"])
    assert.ok(table.includes(field),field);
  assert.ok(table.includes('monsterText(lang,"db","Amount")'));
  assert.equal(monsterText("pt-br","db","Amount"),"Quantidade");
  assert.ok(!table.includes(".innerHTML"));
});

test("original Characters, technical group refs and Miner rows are still available",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  assert.ok(page.includes("const original=character?.items?.[id]?.original??[];"));
  assert.ok(page.includes("const miner=character?.items?.[id]?.miner??[];"));
  assert.ok(page.includes("const groupAudit=node(\"details\",undefined,\"source-band-details\")"));
  assert.ok(page.includes("selectedBand?selectedBand[1]"));
  assert.ok(page.includes("EntryCount"));
  assert.ok(page.includes("RawSum"));
  assert.ok(page.includes('body.append(audit)'));
});

test("bestiary table styles support keyboard, alternating rows and phones",()=>{
  const page=read("src/components/MonsterDatabasePage.astro");
  assert.ok(page.includes(".community-drop-section"));
  assert.ok(page.includes(".community-creature-audit"));
  assert.ok(page.includes(".client-record-row summary:focus-visible"));
  assert.ok(page.includes("@media(max-width:700px)"));
  assert.ok(page.includes("tbody tr:nth-child(even)"));
  assert.ok(page.includes("width:min(1600px,calc(100% - 36px))"));
});
