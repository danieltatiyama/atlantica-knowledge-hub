import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALE_IDS,localePrefix,languageDestination} from '../src/i18n/locales.mjs';
const read=p=>readFileSync(p,'utf8');
test('item profile routes and language switches preserve selected IDs',()=>{
 const header=read('src/components/Header.astro');
 const item=header.match(/const isItemDatabase = ([^;]+);/)[1];
 const mob=header.match(/const isMonsterCatalog =\s*([^;]+);/)[1];
 for(const lang of LOCALE_IDS){
  const path=localePrefix(lang)+'/items/profile/';
  assert.equal(languageDestination({lang,path:'/items/profile/'}),path);
  assert.equal(new Function('currentPath','return '+item)(path),true);
  assert.equal(new Function('currentPath','return '+mob)(localePrefix(lang)+'/monsters/profile/'),true);
 }
});
test('monster browsing precedes collapsed overview and item-source search',()=>{
 const s=read('src/components/MonsterDatabasePage.astro').split('<script>')[0];
 const browse=s.indexOf('<section class="browse"');
 const overview=s.indexOf('<details class="bestiary-header"');
 const finder=s.indexOf('<MonsterDropItemSearch');
 assert.ok(browse>=0&&overview>browse&&finder>overview);
 const tag=s.slice(overview,s.indexOf('>',overview)+1);
 assert.ok(!/\bopen(?:\s|=|>)/.test(tag));
});
