/**
 * Stage 20.68 — deterministic, source-preserving 421-item player catalog.
 * Sources are archived game-client data, not live server observations.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {parseSourceCSV} from "./build-market-price-review-queue.mjs";

export function buildClientMarketPriceCatalog({clientCSV,historicalCSV,reference,queue}){
 const general=parseSourceCSV(clientCSV).filter(x=>x.catalog==="general");
 const mapped=parseSourceCSV(historicalCSV).filter(x=>x.client_item_id!=="");
 if(reference?.dataset!=="client-npc-trade-general-prices"||
  reference?.snapshotId!==1||!Array.isArray(reference.rows)||reference.rows.length!==421||
  queue?.dataset!=="client-npc-market-price-review-queue"||
  queue?.snapshotId!==1||queue?.marketFixedPriceVerified!==false||
  !Array.isArray(queue.rows)||queue.rows.length!==128||
  general.length!==421||mapped.length!==293)
  throw Error("Unexpected client price source snapshot");
 const source=new Map();
 for(const row of general){
  if(!row.item_id||!row.client_name_en||
    row.client_identity_status!=="named"||row.market_fixed_price_verified!=="false"||
    !/^[1-9]\d*$/.test(row.item_id)||
    !/^[1-9]\d*$/.test(row.npc_trade_price_gold)||
    !/^[1-9]\d*$/.test(row.source_row_number)||source.has(row.item_id))
    throw Error("Malformed original general NPC reference");
  source.set(row.item_id,row);
 }
 const historic=new Set();
 for(const row of mapped){
  const referenceRow=source.get(row.client_item_id);
  if(!referenceRow||referenceRow.npc_trade_price_gold!==row.fixed_price_gold||
   historic.has(row.client_item_id))throw Error("Historical comparison changed");
  historic.add(row.client_item_id);
 }
 const additional=new Set();
 for(const [id,name,category,price,line] of queue.rows){
  const fromClient=source.get(id);
  if(!fromClient||historic.has(id)||additional.has(id)||
    name!==fromClient.client_name_en||category!==fromClient.client_category||
    price!==fromClient.npc_trade_price_gold||
    line!==Number(fromClient.source_row_number))
    throw Error("Stage 20.66 candidate mismatch");
  additional.add(id);
 }
 const sourceRows=new Map();
 for(const [id,price,line] of reference.rows){
  if(sourceRows.has(id))throw Error("Duplicate price in published reference");
  sourceRows.set(id,[price,line]);
 }
 const rows=[...source.values()].sort((a,b)=>BigInt(a.item_id)<BigInt(b.item_id)?-1:1).map(x=>{
  const [referencePrice,referenceLine]=sourceRows.get(x.item_id)??[];
  if(x.npc_trade_price_gold!==referencePrice||
    Number(x.source_row_number)!==referenceLine)
    throw Error("Client price reference differs from source");
  return [x.item_id,x.client_name_en,x.client_category,x.npc_trade_price_gold,
   Number(x.source_row_number),historic.has(x.item_id)?"historical-crosscheck":"additional-candidate"];
 });
 if(rows.length!==421||historic.size!==293||additional.size!==128||
   rows.filter(x=>x[5]==="additional-candidate").length!==128)
  throw Error("Invalid player catalog classification");
 return {
  schemaVersion:"1.0",dataset:"client-npc-market-price-catalog",snapshotId:1,
  marketFixedPriceVerified:false,catalogCount:421,
  historicalCrosscheckCount:293,additionalCandidateCount:128,
  rowSchema:["itemId","clientNameEn","clientCategory","clientNPCUnitGold","sourceRowNumber","comparisonClass"],
  notice:"Client NPC unit prices; not an exhaustive official live Market feed. The 293 historically crosschecked items and 128 player-reported matches have different evidence sources.",
  rows,
 };
}
const file=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===file){
 const read=relative=>readFileSync(new URL(relative,import.meta.url),"utf8");
 const data=buildClientMarketPriceCatalog({
  clientCSV:read("../research/market-fixed-prices/client-npc-trade-2026-11-23.csv"),
  historicalCSV:read("../research/market-fixed-prices/jana4u-2025-11-14-crosswalk.csv"),
  reference:JSON.parse(read("../public/data/client-npc-trade-prices/general.json")),
  queue:JSON.parse(read("../public/data/client-npc-trade-prices/review-queue.json")),
 });
 const path=new URL("../public/data/client-npc-trade-prices/catalog.json",import.meta.url);
 const output=JSON.stringify(data)+"\n";
 if(process.argv.includes("--check")){
  if(readFileSync(path,"utf8")!==output)throw Error("Stale client Market price catalog");
  console.log("[IC] 421 source-backed client Market price catalog entries match original evidence.");
 }else{
  writeFileSync(path,output);
  console.log("[IC] Wrote 421 client price catalog records.");
 }
}
