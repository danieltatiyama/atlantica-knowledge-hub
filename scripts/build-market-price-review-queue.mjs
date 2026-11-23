/**
 * Stage 20.66: reproduce the 128 candidate review list from archived game-client
 * NPCTradeItem evidence. No network, no modification to original source CSV.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

export function parseSourceCSV(raw){
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
   cells.push(cell.replace(/\r$/,""));
   if(cells.some(x=>x!==""))rows.push(cells);
   cells=[];cell="";
  }else cell+=ch;
 }
 if(quoted)throw Error("Malformed quoted CSV field");
 if(cell||cells.length){cells.push(cell);rows.push(cells);}
 const header=rows.shift();
 if(!header||new Set(header).size!==header.length)throw Error("Invalid CSV header");
 return rows.map(fields=>{
  if(fields.length!==header.length)throw Error("CSV width mismatch");
  return Object.fromEntries(header.map((x,i)=>[x,fields[i]]));
 });
}

export function generateMarketPriceReviewQueue(clientCSV,historicalCSV){
 const client=parseSourceCSV(clientCSV),historical=parseSourceCSV(historicalCSV);
 const general=client.filter(x=>x.catalog==="general");
 const named=general.filter(x=>x.client_identity_status==="named");
 const mapped=historical.filter(x=>x.client_item_id);
 const historicIDs=new Set(mapped.map(x=>x.client_item_id));
 const names=new Set(general.map(x=>x.item_id));
 if(client.length!==652||general.length!==421||named.length!==421||
  mapped.length!==293||historicIDs.size!==293||names.size!==421||
  general.some(x=>x.market_fixed_price_verified!=="false")||
  mapped.some(x=>!general.some(y=>y.item_id===x.client_item_id&&
    y.npc_trade_price_gold===x.fixed_price_gold)))
  throw Error("Client/historical reference reconciliation changed");
 const rows=general.filter(x=>!historicIDs.has(x.item_id))
  .map(x=>{
   if(!/^[1-9]\d*$/.test(x.item_id)||
    !/^[1-9]\d*$/.test(x.npc_trade_price_gold)||
    !/^[1-9]\d*$/.test(x.source_row_number)||
    !x.client_name_en||!x.client_category)
    throw Error("Invalid candidate source fields");
   return [x.item_id,x.client_name_en,x.client_category,
    x.npc_trade_price_gold,Number(x.source_row_number)];
  }).sort((a,b)=>Number(a[0])-Number(b[0]));
 if(rows.length!==128)throw Error("Expected exactly 128 candidates");
 return {
  schemaVersion:"1.0",
  dataset:"client-npc-market-price-review-queue",
  snapshotId:1,
  sourceDataset:"client-npc-trade-general-prices",
  comparison:"outside-293-mapped-2025-historical-client-ItemIDs",
  marketFixedPriceVerified:false,
  candidateCount:128,
  rowSchema:["itemId","clientNameEn","clientCategory","clientNPCPriceGold","sourceRowNumber"],
  notice:"These are client NPC trade prices, NOT verified fixed-price Market offers. No live-server verification is embedded. Player observations stay local until explicitly exported.",
  rows,
 };
}

const modulePath=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===modulePath){
 const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
 const queue=generateMarketPriceReviewQueue(
  read("../research/market-fixed-prices/client-npc-trade-2026-11-23.csv"),
  read("../research/market-fixed-prices/jana4u-2025-11-14-crosswalk.csv")
 );
 const target=new URL("../public/data/client-npc-trade-prices/review-queue.json",import.meta.url);
 const expected=JSON.stringify(queue)+"\n";
 if(process.argv.includes("--check")){
  if(readFileSync(target,"utf8")!==expected)throw Error("Review queue is stale; regenerate");
  console.log("[IC] 128 market-review candidates match immutable source evidence.");
 }else{
  writeFileSync(target,expected);
  console.log("[IC] Wrote 128 market-review candidates.");
 }
}
