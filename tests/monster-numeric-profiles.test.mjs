import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {monsterStatsText} from '../src/i18n/monster-stats-ui.mjs';
import {LOCALE_IDS,languageDestination} from '../src/i18n/locales.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
test('all numerical monster records join exact source identities, with one missing record',()=>{
 const index=[0,1,2].flatMap(i=>read(`public/data/client-monsters/index-0${i}.json`).rows);
 const manifest=read('public/data/client-monster-stats/manifest.json');
 const shards=Array.from({length:9},(_,i)=>read(`public/data/client-monster-stats/0${i}.json`));
 const records=Object.assign({},...shards.map(s=>s.items));
 assert.equal(index.length,4351);assert.equal(Object.keys(records).length,4351);
 assert.equal(manifest.matchedCount,4350);assert.deepEqual(manifest.missingIds,['7160']);
 for(const shard of shards){assert.equal(shard.schemaVersion,1);assert.deepEqual(shard.columns,manifest.columns);}
 for(const [id,,level,kind] of index){
  const record=records[id];if(id==='7160'){assert.equal(record,null);continue;}
  assert.equal(record.kind,kind);assert.equal(record.values.length,manifest.columns.length);
  assert.ok(record.values.every(v=>v===null||Number.isFinite(v)));

 }
 const sample=records['570'];
 for(const [field,value] of Object.entries({Str:270,Dex:260,Vit:240,Intl:180,MinDmg:367,MaxDmg:600,AC:660,MagicDef:0,HPRate:8000}))assert.equal(sample.values[manifest.columns.indexOf(field)],value);
});
test('dedicated profiles and numerical labels cover eight locales',()=>{
 for(const lang of LOCALE_IDS){
  for(const key of ['attributes','core','pvp','other','field','value','notice','missing'])assert.ok(monsterStatsText(lang,key)!==key);
  assert.equal(languageDestination({lang,path:'/monsters/profile/'}),(lang==='en'?'':'/'+lang)+'/monsters/profile/');
 }
});
