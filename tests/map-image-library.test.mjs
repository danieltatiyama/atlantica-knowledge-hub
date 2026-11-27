import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sectionMapImage,mapImageResults} from '../src/data/map-images.mjs';
import {mapImageText,mapImageTextKeys} from '../src/i18n/map-images-ui.mjs';
import {LOCALE_IDS,languageDestination} from '../src/i18n/locales.mjs';
const library=JSON.parse(readFileSync('public/data/client-maps/images.json','utf8'));
const maps=JSON.parse(readFileSync('public/data/client-maps/catalog.json','utf8')).maps;

test('all 659 converted origins resolve to 567 intact unique images, with one explicit failed source',()=>{
 assert.equal(library.origins.length,659);assert.equal(Object.keys(library.assets).length,567);
 assert.equal(library.report.sourceFiles,660);assert.equal(library.report.duplicatePixelCopies,92);
 assert.deepEqual(library.report.failed.map(r=>r.sourcePath),['NMap/TBSAfrica01/TBSAfrica01.DDS']);
 for(const asset of Object.values(library.assets)){
  const bytes=readFileSync('public'+asset.src);assert.equal(bytes.length,asset.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  assert.ok(asset.width>0&&asset.height>0);assert.ok(existsSync('public'+asset.thumbnail));
 }
 for(const origin of library.origins){assert.ok(library.assets[origin.assetId]);assert.match(origin.sourceSha256,/^[a-f0-9]{64}$/);}
});
test('section images keep four reviewed examples, reject all ambiguous types and never assign battle assets',()=>{
 assert.equal(Object.values(maps).filter(m=>m.image).length,4);
 let unique=0,ambiguous=0;
 for(const map of Object.values(maps)){
  const ids=library.mapCandidates[map.id]??[],selected=sectionMapImage(library,map);
  if(map.image){assert.equal(selected.association,'reviewed');assert.equal(selected.src,map.image.src);}
  else if(ids.length===1){assert.equal(selected.association,'client-type');assert.equal(selected.id,ids[0]);}
  else assert.equal(selected,null);
  if(ids.length===1)unique++;if(ids.length>1)ambiguous++;
  for(const id of ids)assert.ok(library.origins.some(o=>o.assetId===id&&o.scope==='NMap'&&o.folder.toLowerCase()===map.type?.toLowerCase()));
 }
 assert.equal(unique,626);assert.equal(ambiguous,44);
 assert.equal(sectionMapImage(library,maps[165]).association,'client-type');
 assert.equal(sectionMapImage(library,maps[194]),null);
 for(const id of [497,498,499,3779])assert.equal(sectionMapImage(library,maps[id]),null);
 for(const origin of library.origins.filter(o=>o.scope==='NBattleMap'))assert.deepEqual(origin.mapIds,[]);
});
test('search filters full unique set before pagination and preserves variants and all source paths',()=>{
 const all=mapImageResults(library);assert.equal(all.length,567);assert.equal(new Set(all.map(a=>a.id)).size,567);
 assert.ok(mapImageResults(library,{query:'Forest of Spirits (Harbin)'}).some(a=>a.origins.some(o=>o.mapIds.includes(165))));
 const variants=mapImageResults(library,{mapId:'194'});assert.equal(variants.length,2);
 assert.ok(mapImageResults(library,{query:'SkyGarden1'}).length>0);
 assert.equal(mapImageResults(library,{query:'no-such-file-xyz'}).length,0);
 assert.ok(mapImageResults(library,{scope:'NBattleMap'}).every(a=>a.origins.every(o=>o.scope==='NBattleMap')));
 const sorted=mapImageResults(library,{sort:'size'});for(let i=1;i<sorted.length;i++)assert.ok(sorted[i-1].bytes>=sorted[i].bytes);
});
test('all eight locales translate image controls and preserve the gallery route when switching language',()=>{
 for(const lang of LOCALE_IDS){
  for(const key of mapImageTextKeys){assert.ok(mapImageText(lang,key));assert.notEqual(mapImageText(lang,key),key);}
  assert.ok(languageDestination({path:'/maps/images/',lang}).includes('/maps/images/'));
 }
});
