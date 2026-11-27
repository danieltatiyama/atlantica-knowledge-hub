import test from 'node:test';
import assert from 'node:assert/strict';
import {sortRecords,sortNumber,compareSortNumbers} from '../src/data/table-sort.mjs';
import {filterClientMarketCatalog} from '../src/data/market-price-catalog.mjs';
import {LOCALE_IDS} from '../src/i18n/locales.mjs';
import {tableSortText} from '../src/i18n/table-sort-ui.mjs';

test('localized decimals, negative percentages and very large integers compare exactly',()=>{
 for(const [locale,input,raw] of [['en','1,234.56',1234.56],['pt-BR','1.234,56',1234.56],['de','1.234,56',1234.56],['fr','1\u202f234,56',1234.56],['ko','1,234.56',1234.56],['en','0.001',0.001],['pt-BR','−1.250,50 %',-1250.5]]){
  assert.equal(compareSortNumbers(sortNumber(input,locale),sortNumber(raw)),0,locale+' '+input);
 }
 const huge=['9007199254740993','9007199254740992','260000000000000000'];
 assert.deepEqual(sortRecords(huge,x=>x),['9007199254740992','9007199254740993','260000000000000000']);
 assert.equal(compareSortNumbers(sortNumber('0.000000000000000001'),sortNumber('1e-18')),0);
 for(const v of ['1–5','1 / 5','10 + 3%','abc','1,2'])assert.equal(sortNumber(v),null,v);
});

test('zero is a value and absent cells remain last in both directions',()=>{
 const rows=[null,'—','',0,-3,12,'N/A'];
 assert.deepEqual(sortRecords(rows,x=>x),[-3,0,12,null,'—','','N/A']);
 assert.deepEqual(sortRecords(rows,x=>x,{direction:'descending'}),[12,0,-3,null,'—','','N/A']);
 assert.deepEqual(sortRecords(['unknown',2,0],x=>x,{type:'number'}),[0,2,'unknown']);
});

test('natural name ordering is stable for accents and equal values',()=>{
 const rows=[{id:1,name:'Éclair 10'},{id:2,name:'eclair 2'},{id:3,name:'Éclair 2'},{id:4,name:'Apple'}];
 assert.deepEqual(sortRecords(rows,x=>x.name,{type:'text',locale:'fr'}).map(x=>x.id),[4,2,3,1]);
 assert.deepEqual(rows.map(x=>x.id),[1,2,3,4]);
 const same=[{id:1,n:3},{id:2,n:3}];assert.deepEqual(sortRecords(same,x=>x.n,{direction:'descending'}),same);
});

test('market header ordering applies to the whole filtered catalog before pagination',()=>{
 const catalog=Array.from({length:160},(_,i)=>({itemId:String(i+1),name:'Item '+(160-i),category:i%2?'A':'B',referenceGold:String(i+1),comparisonClass:i%2?'historical-crosscheck':'additional-candidate'}));
 const order={column:2,direction:'descending',type:'auto'};
 const first=filterClientMarketCatalog(catalog,{columnSort:order,limit:50});
 const next=filterClientMarketCatalog(catalog,{columnSort:order,offset:50,limit:50});
 assert.equal(first.rows[0].referenceGold,'160');assert.equal(first.rows.at(-1).referenceGold,'111');
 assert.equal(next.rows[0].referenceGold,'110');assert.equal(next.rows.at(-1).referenceGold,'61');
 const filtered=filterClientMarketCatalog(catalog,{columnSort:order,category:'A',limit:50});
 assert.equal(filtered.total,80);assert.ok(filtered.rows.every(x=>x.category==='A'));assert.equal(filtered.rows[0].referenceGold,'160');
});

test('sorting controls and status announcements cover all eight wiki locales',()=>{
 for(const lang of LOCALE_IDS)for(let i=0;i<4;i++)assert.ok(tableSortText(lang,i).length>3);
 assert.equal(tableSortText('pt-br',0),'Ordenar em ordem crescente');
 assert.equal(tableSortText('ja',3),'降順に並べ替え済み');
});
