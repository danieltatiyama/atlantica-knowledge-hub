import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {monsterRowsByScope,monsterText} from "../src/i18n/monster-ui.mjs";
const pages={db:"MonsterDatabasePage",loot:"MonsterDropItemSearch",source:"MonsterItemSources"};
test("all bestiary and loot interface messages have complete localized versions",()=>{
 for(const [scope,rows] of Object.entries(monsterRowsByScope)){
  const keys=new Set(rows.map(row=>row[0]));
  assert.equal(keys.size,rows.length,scope);
  for(const row of rows){
   assert.equal(row.length,8,row[0]);
   for(const [i,lang] of LOCALE_IDS.entries()){
    assert.ok(row[i].trim(),lang+" "+row[0]);
    assert.equal(monsterText(lang,scope,row[0]),row[i]);
   }
  }
  const source=readFileSync("src/components/"+pages[scope]+".astro","utf8");
  assert.doesNotMatch(source,/\bpt\s*\?/);
  const calls=[...source.matchAll(/monsterText\(lang,"([^"]+)","([^"]+)"\)/g)];
  assert.ok(calls.length);
  for(const [,scopeArg,key] of calls){assert.equal(scopeArg,scope);assert.ok(keys.has(key),key);}
 }
 assert.equal(monsterText("ko","db","Client creatures and drop sources"),"몬스터 및 드롭 출처");
 assert.equal(monsterText("ja","loot","Direct drop"),"直接ドロップ");
});
test("original monster inference and localized item links remain intact",()=>{
 const db=readFileSync("src/components/MonsterDatabasePage.astro","utf8");
 const loot=readFileSync("src/components/MonsterDropItemSearch.astro","utf8");
 const sources=readFileSync("src/components/MonsterItemSources.astro","utf8");
 assert.ok(db.includes("resolveClientCreatureDrops(entity,rawLoot,groupData)"));
 assert.ok(db.includes('a.href=prefix+"/items/database/?id="'));
 assert.ok(loot.includes('itemLink.href=prefix+"/items/database/?id="'));
 assert.ok(loot.includes("meta.itemIds!==822"));
 for(const s of [db,loot,sources]){
  assert.ok(s.includes("localePrefix(lang)"));
  assert.ok(s.includes("formatLevelResolvedPercent"));
  assert.ok(s.includes("NOT verified live-server"));
  assert.ok(!s.includes(".innerHTML"));
 }
});
