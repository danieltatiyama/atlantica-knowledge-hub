import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {transformSync} from 'esbuild';
const source=readFileSync('src/components/FullClientItemDatabasePage.astro','utf8');
class Element{
 children=[];hidden=false;parent=null;
 constructor(tag,text){this.tag=tag;this.text=text;}
 append(...items){for(const item of items){this.children.push(item);if(item instanceof Element)item.parent=this;}}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
 addEventListener(){}
}
const node=(tag,text)=>new Element(tag,text);
function helper(name,end,overrides={}){
 const a=source.indexOf('async function '+name),b=source.indexOf(end,a+10);
 const env={node,itemDbText:(_lang,key)=>key,originalUsedIn:async()=>[],number:new Intl.NumberFormat('en-US'),linkItem:(id,name)=>node('a',name),nameFor:()=>null,lang:'en',localePrefix:()=>'',lootSourceManifestPromise:null,manifest:{snapshotId:1},itemMonsterSourcesCache:new Map(),estimatedTwoStagePercent:()=>1,formatLevelResolvedPercent:n=>String(n),mainLevelBandRange:()=>null,scaledDropText:()=>'',document:{createDocumentFragment:()=>node('fragment')},...overrides};
 const js=transformSync(source.slice(a,b),{loader:'ts',target:'es2022'}).code;
 return new Function(...Object.keys(env),js+';return '+name)(...Object.values(env));
}
const craft=overrides=>helper('addUsedInTable','async function addMonsterSources',overrides);
const meta={schemaVersion:'1.0',snapshotId:1,dataset:'level-resolved-client-monster-loot',levelMatchedGroupRows:26201,unmatchedLevelGroupRefs:176,files:{itemSources:['item-sources/02.json']}};
const drops=items=>helper('addMonsterSources','async function numericManifest',{fetchJSON:async url=>url.endsWith('manifest.json')?meta:{schemaVersion:'1.0',snapshotId:1,dataset:meta.dataset,bucket:2,items}});
test('unmatched craft and monster sections do not remain in the profile',async()=>{
 for(const render of [craft(),drops({}),drops({'2529':{direct:[],group:[]}})]){
  const parent=node('div');await render(parent,'2529');assert.equal(parent.children.length,0);
 }
});
test('matching craft and monster sections become visible',async()=>{
 for(const render of [craft({originalUsedIn:async()=>[['7070','Gold Thread',5,[1]]]}),drops({'2529':{direct:[['8036','Guard',1,'100','1','1','1']],group:[]}})]){
  const parent=node('div');await render(parent,'2529');assert.equal(parent.children.length,1);assert.equal(parent.children[0].hidden,false);
  const hasTable=e=>e?.tag==='table'||(e?.children??[]).some(hasTable);assert.ok(hasTable(parent));
 }
});
test('loading failure remains distinguishable from no match',async()=>{
 const parent=node('div');await craft({originalUsedIn:async()=>{throw Error('unavailable');}})(parent,'2529');
 assert.equal(parent.children.length,1);assert.equal(parent.children[0].hidden,false);
 assert.ok(parent.children[0].children.some(c=>c.textContent==='Could not load the original source craft references.'));
});
