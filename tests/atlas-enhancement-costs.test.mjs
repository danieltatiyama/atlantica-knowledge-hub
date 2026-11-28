import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {ATLAS_COST_DATA as data,atlasEnhancementCosts,aoDayAtlasCost} from '../src/data/atlas-enhancement-costs.mjs';
import {atlasCostRows,atlasCostText} from '../src/i18n/atlas-cost-ui.mjs';
import {LOCALE_IDS} from '../src/i18n/locales.mjs';

test('all 12 supplied historical comparisons and the Apocalyptic anchor are reproduced by normal Atlas costs',()=>{
 let comparisons=0;
 for(const r of data.observations){
  const c=atlasEnhancementCosts(r.id,data.items[r.id].name,r.grade);assert.ok(c);
  assert.equal(c.aoPower,r.power);comparisons++;
  if(r.safe!==null){assert.equal(c.aoSafe,r.safe);comparisons++;}
  assert.equal(c.aoObserved,true);
 }
 assert.equal(comparisons,13);assert.equal(data.materialId,'21559');
 assert.equal(aoDayAtlasCost(55),42);assert.equal(aoDayAtlasCost(65),49);assert.equal(aoDayAtlasCost(90),68);
 assert.equal(aoDayAtlasCost(243),183);assert.equal(aoDayAtlasCost(270),203);
 assert.deepEqual(Array.from({length:500},(_,i)=>i).filter(n=>aoDayAtlasCost(n)===182),[242]);
 for(const n of [-1,1.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.equal(aoDayAtlasCost(n),null);
});
test('lookup uses explicit item identities, rejects source-name changes, variants and unknown grades',()=>{
 const catalog=readdirSync('public/data/client-items').filter(n=>/^index-\d+\.json$/.test(n)).flatMap(n=>JSON.parse(readFileSync('public/data/client-items/'+n)).rows);
 const actual=new Map(catalog.map(r=>[r[0],r]));
 for(const [id,item] of Object.entries(data.items)){
  assert.equal(actual.get(id)?.[1],item.name);assert.equal(actual.get(id)?.[3],item.level);
  assert.equal(atlasEnhancementCosts(id,'Incorrect name',5),null);
 }
 for(const [id,name] of [['1','Spirit Sword'],['28270','Abyssal Sword (No Trade)'],['6769',"Champion's Apocalypse Sword"],['1675','Abyssal Steel']])assert.equal(atlasEnhancementCosts(id,name,7),null);
 for(const g of [-1,11,1.5,NaN])assert.equal(atlasEnhancementCosts('387','Judgment Axe',g),null);
 assert.equal(atlasEnhancementCosts('387','Judgment Axe',10),null);
});
test('Apocalyptic Power begins at current +6 and Safe is forbidden at every grade; projections stay labeled',()=>{
 const items=Object.entries(data.items).filter(([,r])=>r.profile==='apocalyptic-projection');assert.equal(items.length,27);
 for(const [id,item] of items)for(let grade=0;grade<=10;grade++){
  const c=atlasEnhancementCosts(id,item.name,grade);assert.equal(c.projection,true);
  assert.equal(c.safeBlocked,true);assert.equal(c.safe,null);assert.equal(c.aoSafe,null);
  if(grade<6){assert.equal(c.powerBlocked,true);assert.equal(c.power,null);assert.equal(c.aoPower,null);}
  if(grade===10){assert.equal(c.power,null);assert.equal(c.powerBlocked,false);}
 }
 const anchor=atlasEnhancementCosts('18807','Apocalyptic Leggings',7);assert.equal(anchor.power,242);assert.equal(anchor.aoPower,182);assert.equal(anchor.aoObserved,true);
 const other=atlasEnhancementCosts('5691','Apocalypse Sword',7);assert.equal(other.aoObserved,false);
 assert.deepEqual([6,8,9].map(g=>{const c=atlasEnhancementCosts('18807','Apocalyptic Leggings',g);return [c.power,c.aoPower];}),[[195,147],[289,217],[351,264]]);
 assert.deepEqual(atlasEnhancementCosts('18807','Apocalyptic Leggings',9).powerRange,[351,374]);
});
test('all four costs, uncertainty and unavailable labels have complete eight-language coverage',()=>{
 for(const row of atlasCostRows){assert.equal(row.length,8);for(const lang of LOCALE_IDS)assert.ok(atlasCostText(lang,row[0]).trim());}
});
