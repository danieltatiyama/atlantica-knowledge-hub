import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mapCatalogResults,monsterMapLocations,mapDisplayName,mapHref} from '../src/data/client-maps.mjs';
import {mapText,mapModeText,mapTextKeys,mapModeKeys} from '../src/i18n/maps-ui.mjs';
import {LOCALE_IDS,localePrefix,localeTag,languageDestination} from '../src/i18n/locales.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const data=read('public/data/client-maps/catalog.json');
const evidence=read('public/data/client-maps/evidence.json');

test('exact monster identities and bidirectional links preserve 2255 source pairs without guessing missing maps',()=>{
 const catalog=[0,1,2].flatMap(i=>read(`public/data/client-monsters/index-0${i}.json`).rows);
 const known=new Map(catalog.map(r=>[Number(r[0]),r]));
 assert.equal(data.areas.length,142);assert.equal(Object.keys(data.maps).length,677);
 assert.equal(Object.keys(data.monsters).length,1883);assert.equal(evidence.evidence.length,2255);
 const pairs=new Set();
 for(const map of Object.values(data.maps)){
  assert.equal(new Set(map.monsters).size,map.monsters.length);
  for(const id of map.monsters){
   const original=known.get(id);assert.ok(original);
   assert.equal(data.monsters[id].kind,original[3]);assert.equal(data.monsters[id].name,original[1]);
   pairs.add(map.id+':'+id);assert.ok(monsterMapLocations(data,id).some(m=>m.id===map.id));
  }
 }
 assert.equal(pairs.size,2255);
 for(const r of evidence.evidence){
  assert.ok(pairs.has(r.mapId+':'+r.charId));assert.ok(r.records.length);
  for(const e of r.records){assert.equal(e.recordOffset,4+e.recordIndex*444);assert.equal(e.charIdOffset,e.recordOffset+84+e.slotIndex*36);}
 }
 for(const a of data.areas)for(const id of a.sections)assert.ok(data.maps[id].areas.includes(a.id));
 assert.deepEqual(evidence.unresolvedMapIds,[497,498,499,3779]);
 for(const id of evidence.unresolvedMapIds){assert.equal(data.maps[id].name,null);assert.equal(data.maps[id].minLevel,null);assert.equal(data.maps[id].image,null);}
 assert.equal(evidence.excludedUnresolvedCharacterIds,779);
 assert.equal(monsterMapLocations(data,'999999999').length,0);
});

test('all four screenshot monster sets and the four Devil Tree locations agree',()=>{
 const examples={102:[201,202,203,204,205,206,209,210,552,639],3002:[3956,3957,3958,3959,3960],129:[364,365,369,370,371,649],272:[1067,1068,1069,1070]};
 for(const [id,monsters] of Object.entries(examples))assert.deepEqual(data.maps[id].monsters,monsters);
 assert.deepEqual(monsterMapLocations(data,205).map(m=>m.id).sort((a,b)=>a-b),[102,165,166,167]);
 assert.equal(data.maps[272].name,'Eagle Mountain');assert.equal(data.maps[3002].name,'Grave Overground');
 assert.equal(data.maps[129].minLevel,45);assert.equal(data.maps[272].minLevel,121);
});

test('only four reviewed map images are offered, with complete lossless asset integrity',()=>{
 assert.equal(Object.values(data.maps).filter(m=>m.image).length,4);
 for(const f of evidence.images){
  const image=data.maps[f.mapId].image;assert.ok(image.width>0&&image.height>0);
  const bytes=readFileSync('public'+image.src);assert.equal(bytes.length,f.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);
 }
 assert.equal(data.maps[165].image,null); // Shared map type alone does not assign an image.
});

test('search finds sections and monsters across areas, and mode filtering never invents locations',()=>{
 const all=mapCatalogResults(data);assert.equal(all.areas.length,142);
 assert.ok(mapCatalogResults(data,'Roaring Warrior').areas.some(a=>a.name==='Grand Canyon'));
 assert.ok(mapCatalogResults(data,'1070').areas.some(a=>a.name==='Grand Canyon'));
 assert.ok(mapCatalogResults(data,'Grave Overground').areas.some(a=>a.name==='Grave of Cubes'));
 const field=mapCatalogResults(data,'','normal');assert.ok(field.areas.every(a=>a.mode==='normal'));assert.equal(field.others.length,0);
 assert.deepEqual(mapCatalogResults(data,'no-such-place-abcxyz'),{areas:[],others:[]});
 assert.equal(mapDisplayName(data.maps[497],'Unknown'),'Unknown #497');
 assert.equal(mapHref('/pt-br',272,272),'/pt-br/maps/?id=272&area=272');
});

test('eight map locales include translated controls and preserve map routes',()=>{
 for(const lang of LOCALE_IDS){
  for(const key of mapTextKeys)assert.ok(mapText(lang,key)&&mapText(lang,key)!==key,lang+' '+key);
  for(const key of mapModeKeys)assert.ok(mapModeText(lang,key),lang+' '+key);
  assert.equal(languageDestination({lang,path:'/maps/'}),localePrefix(lang)+'/maps/');
 }
 const header=readFileSync('src/components/Header.astro','utf8');assert.ok(header.includes('|| isMapCatalog'));
 const renderer=readFileSync('src/lib/client-maps.ts','utf8');assert.ok(renderer.includes('container.replaceChildren()'));
});
