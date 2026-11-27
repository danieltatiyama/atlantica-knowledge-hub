import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {MAIN_LEVEL_CREATURES,MAIN_LEVEL_BANDS,usesMainLevelBands,mainLevelBandRange} from '../src/data/monster-level-policy.mjs';
import {resolveClientCreatureDrops,selectClientLevelBand,resolvedReverseRowForDrop,isOriginalReverseRowActive} from '../src/data/client-monster-drop-resolver.mjs';
import {scaledDropText} from '../src/i18n/scaled-drop-ui.mjs';
import {LOCALE_IDS} from '../src/i18n/locales.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8')),root='public/data/client-monsters/',m=read(root+'manifest.json');
const chars=m.files.index.flatMap(p=>read(root+p).rows),loot=Object.assign({},...m.files.loot.map(p=>read(root+p).items)),groups=Object.assign({},...m.files.groups.map(p=>read(root+p).items));
test('41 player-confirmed identities expose distinct original bands, with source rows preserved',()=>{
 assert.equal(MAIN_LEVEL_CREATURES.length,41);assert.equal(new Set(MAIN_LEVEL_CREATURES.map(c=>c.id)).size,41);
 for(const c of MAIN_LEVEL_CREATURES){
  const char=chars.find(r=>r[0]===c.id);assert.equal(char[3],c.kind);
  assert.deepEqual(c.groupIds,loot[c.id].groups.map(r=>r[1]));
  const actual=resolveClientCreatureDrops(char,loot[c.id],groups);assert.equal(actual.mainLevelScaled,true);
  assert.equal(actual.rows.filter(r=>r.kind==='direct').length,loot[c.id].direct.length);
  for(const ref of loot[c.id].groups){
   const g=groups[ref[1]],rows=actual.rows.filter(r=>r.groupId===ref[1]);
   assert.equal(rows.length,g.drops.length);
   assert.deepEqual(MAIN_LEVEL_BANDS[ref[1]],Object.fromEntries(g.bands.map(b=>[b[1],Number(b[2])])));
   for(const row of rows){
    assert.ok(g.drops.includes(row.groupDrop));
    const reverse=resolvedReverseRowForDrop(c.id,c.name,row);
    assert.equal(isOriginalReverseRowActive(reverse,char,g),true);
    assert.ok(mainLevelBandRange(c.id,ref[1],row.selectedBand.band));
   }
  }
 }
});
test('Bran Castle main 200 uses band 9: confirmed equipment and coins, excluding low-band items',()=>{
 const c=chars.find(r=>r[0]==='8036'),r=resolveClientCreatureDrops(c,loot[c[0]],groups);
 const band=selectClientLevelBand(groups['53'],200);assert.equal(band.band,'9');
 const ids=r.rows.filter(r=>r.groupId==='53'&&r.selectedBand.band===band.band).map(r=>r.itemId);
 for(const id of ['14942','13583','16812','8399','8374'])assert.ok(ids.includes(id));
 for(const id of ['15071','21570','20907','20913','8366'])assert.ok(!ids.includes(id));
 assert.ok(r.rows.some(r=>r.kind==='direct'&&r.itemId==='2529'));
 assert.equal(mainLevelBandRange('8036','53','8'),'161–180');assert.equal(mainLevelBandRange('8036','53','9'),'181+');
 assert.equal(usesMainLevelBands(['8036',null,'1','WRONG'],'53'),false);
});
test('all unconfirmed creatures retain the recorded-level resolver, including level-1 candidates',()=>{
 for(const c of chars.filter(c=>!MAIN_LEVEL_CREATURES.some(r=>r.id===c[0]))){
  const result=resolveClientCreatureDrops(c,loot[c[0]],groups);assert.equal(result.mainLevelScaled,false);
  const expected=(loot[c[0]]?.groups??[]).flatMap(ref=>{const b=selectClientLevelBand(groups[ref[1]],c[2]);return b?groups[ref[1]].drops.filter(d=>d[1]===b.band).map(d=>ref[1]+'|'+d[0]):[];});
  assert.deepEqual(result.rows.filter(r=>r.kind==='group').map(r=>r.groupId+'|'+r.groupDrop[0]),expected);
 }
});
test('candidate audit separates confirmation from heuristic and all locales disclose main-level eligibility',()=>{
 const a=read('docs/research/monster-level-scaling-candidates.json');
 assert.equal(a.scanned,4351);assert.equal(a.confirmed,41);assert.equal(a.unconfirmed,299);
 for(const lang of LOCALE_IDS)for(const key of ['notice','direct','level'])assert.ok(scaledDropText(lang,key)!==key);
});
