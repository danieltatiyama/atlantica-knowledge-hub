import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  CLIENT_NPC_PRICE_ORIGIN,parseClientNPCPriceCatalog,applyMissingClientNPCPrices,
} from "../src/data/client-npc-price-reference.mjs";

const readJson=path=>JSON.parse(readFileSync(path,"utf8"));
const repoData="research/market-fixed-prices/";
const manifest=readJson("public/data/client-npc-trade-prices/manifest.json");
const publicRows=readJson("public/data/client-npc-trade-prices/general.json");
const audit=readJson(repoData+"client-npc-trade-2026-11-23-audit.json");

function parseCSV(path){
 const raw=readFileSync(path,"utf8").replace(/^\uFEFF/,"");
 const rows=[];let cells=[],cell="",quoted=false;
 for(let i=0;i<raw.length;i++){
  const ch=raw[i];
  if(quoted){
   if(ch==='"'&&raw[i+1]==='"'){cell+='"';i++;}
   else if(ch==='"')quoted=false;
   else cell+=ch;
  }else if(ch==='"')quoted=true;
  else if(ch===','){cells.push(cell);cell="";}
  else if(ch==='\n'){
   cells.push(cell.replace(/\r$/,""));if(cells.some(x=>x!==""))rows.push(cells);
   cells=[];cell="";
  }else cell+=ch;
 }
 assert.equal(quoted,false,"Unclosed CSV quotes");
 if(cell||cells.length){cells.push(cell);rows.push(cells);}
 const head=rows.shift();
 return rows.map(cells=>{
  assert.equal(cells.length,head.length);
  return Object.fromEntries(head.map((x,i)=>[x,cells[i]]));
 });
}
const extracted=parseCSV(repoData+"client-npc-trade-2026-11-23.csv");
const historical=parseCSV(repoData+"jana4u-2025-11-14-crosswalk.csv");

test("archive exactly matches uploaded client source audit with no inferred Market verification",()=>{
 assert.equal(extracted.length,652);
 assert.equal(audit.candidateCount,652);
 assert.equal(audit.generalCatalogCount,421);
 assert.equal(audit.housingCatalogCount,231);
 assert.equal(audit.mappedNamedItemIds,425);
 assert.equal(audit.sourceParse.parsedSourceRows,652);
 assert.equal(audit.sourceParse.invalidRows,0);
 assert.equal(audit.sourceParse.duplicateSameValueRows,0);
 assert.equal(audit.sourceParse.conflictingItemCatalogPairsHeld,0);
 assert.equal(audit.knownPriceMatchCount,4);
 assert.equal(extracted.filter(x=>x.catalog==="general").length,421);
 assert.equal(extracted.filter(x=>x.catalog==="housing").length,231);
 assert.equal(extracted.filter(x=>x.client_identity_status==="named").length,425);
 assert.equal(extracted.filter(x=>x.client_identity_status==="collision").length,227);
 assert.ok(extracted.every(x=>x.market_fixed_price_verified==="false"));
 assert.ok(extracted.every(x=>/^[1-9]\d{0,14}$/.test(x.npc_trade_price_gold)));
});
test("every public NPC reference price is an exact named general-catalog ItemID",()=>{
 assert.equal(manifest.marketFixedPriceVerified,false);
 assert.equal(manifest.generalCount,421);
 assert.equal(manifest.housingCount,231);
 assert.equal(manifest.housingCollisionCount,227);
 assert.equal(publicRows.rows.length,421);
 const publicMap=new Map(publicRows.rows.map(([id,value,line])=>[id,{value,line}]));
 assert.equal(publicMap.size,421);
 const allGeneral=extracted.filter(x=>x.catalog==="general");
 for(const row of allGeneral){
  assert.equal(row.client_identity_status,"named");
  assert.deepEqual(publicMap.get(row.item_id),{
   value:row.npc_trade_price_gold,line:Number(row.source_row_number),
  },row.item_id);
 }
 for(const row of extracted.filter(x=>x.catalog==="housing"))
  assert.ok(!publicRows.rows.some(x=>x[0]===row.item_id),
   "Housing-only prices must not become general Market candidates");
});
test("all 293 historical ItemIDs match present client general prices without guessing names",()=>{
 const prices=new Map(publicRows.rows.map(([id,value])=>[id,value]));
 const matched=historical.filter(row=>row.client_item_id);
 assert.equal(matched.length,293);
 for(const row of matched){
  assert.equal(prices.get(row.client_item_id),row.fixed_price_gold,row.item_name);
 }
 assert.equal(audit.historicalPriceCrosscheck.generalCatalogMatches,293);
 assert.equal(audit.historicalPriceCrosscheck.generalCatalogMismatches,0);
 assert.equal(audit.historicalPriceCrosscheck.generalCatalogAbsent,0);
});
test("four independent player prices and separate Colorful Fabric all match",()=>{
 const prices=new Map(publicRows.rows.map(([id,value])=>[id,value]));
 for(const [id,value] of [
  ["7070","3000"],["7081","10000"],["3000","100"],["2080","8000"],
  ["7044","50000"],
 ])assert.equal(prices.get(id),value,id);
 assert.deepEqual(audit.knownPriceComparison.map(x=>x.comparison),
  ["match","match","match","match"]);
});
test("reference decoder rejects mismatched identity, bad price, duplicates and false Market claims",()=>{
 const parsed=parseClientNPCPriceCatalog(manifest,publicRows);
 assert.equal(parsed.size,421);
 assert.equal(parsed.get("7070"),"3000");
 assert.throws(()=>parseClientNPCPriceCatalog({...manifest,marketFixedPriceVerified:true},publicRows));
 assert.throws(()=>parseClientNPCPriceCatalog(manifest,{...publicRows,rows:publicRows.rows.slice(0,420)}));
 assert.throws(()=>parseClientNPCPriceCatalog(manifest,{...publicRows,
  rows:[["7070","12",1],...publicRows.rows.slice(1)]}),/Invalid source price entry/);
 const duplicate=publicRows.rows.map(x=>[...x]);
 duplicate[1][0]=duplicate[0][0];
 assert.throws(()=>parseClientNPCPriceCatalog(manifest,{...publicRows,rows:duplicate}),/Invalid source price entry/);
 const malicious=publicRows.rows.map(x=>[...x]);
 malicious[0][1]="=1+1";
 assert.throws(()=>parseClientNPCPriceCatalog(manifest,{...publicRows,rows:malicious}),/Invalid source price entry/);
});
test("optional bulk reference application never overwrites user-entered prices",()=>{
 const references=parseClientNPCPriceCatalog(manifest,publicRows);
 const prices={"7070":"99999","7081":"","2080":"0"};
 const origins={"7070":"manual"};
 const n=applyMissingClientNPCPrices({
  leaves:[{itemId:"7070"},{itemId:"7081"},{itemId:"2080"},{itemId:"3000"},{itemId:"999999"}],
  prices,priceOrigins:origins,references,
 });
 assert.equal(n,2);
 assert.equal(prices["7070"],"99999");
 assert.equal(prices["7081"],"10000");
 assert.equal(prices["2080"],"0");
 assert.equal(prices["3000"],"100");
 assert.equal(prices["999999"],undefined);
 assert.equal(origins["7070"],"manual");
 assert.equal(origins["7081"],CLIENT_NPC_PRICE_ORIGIN);
 assert.equal(origins["3000"],CLIENT_NPC_PRICE_ORIGIN);
});
test("crafting calculator keeps NPC prices opt-in, separate from stored manual sources",()=>{
 const src=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 for(const part of [
  'id="craft-load-npc-prices"',
  'id="craft-apply-npc-prices" hidden',
  'id="craft-npc-price-caption"',
  'clientNPCPriceMap:Map<string,string>|null=null',
  'parseClientNPCPriceCatalog(manifest,data)',
  'applyMissingClientNPCPrices({',
  'priceOriginsKey="atlantica.crafting.priceOrigins.v1"',
  'delete priceOrigins[leaf.itemId]',
  'attachNPCPriceHint(priceCell,leaf.itemId,input)',
  'buildCraftingWorkbook({plan,names,prices,priceOrigins',
  'craftingText(lang,"Use","Usar")',
 ])assert.ok(src.includes(part),part);
 assert.ok(!src.includes('prices={...clientNPCPriceMap}'),
  "NPC references must not become automatic prices without user action");
 const parser=readFileSync("src/data/client-npc-price-reference.mjs","utf8");
 assert.ok(parser.includes("marketFixedPriceVerified!==false"),
  "NPC client reference must reject any claim of Market verification");
 const xlsx=readFileSync("src/data/client-crafting-xlsx.mjs","utf8");
 assert.ok(xlsx.includes('priceOrigins[row.itemId]==="client-npc-catalog"'));
 assert.ok(xlsx.includes('Client NPC reference (Market unverified)'));
});
