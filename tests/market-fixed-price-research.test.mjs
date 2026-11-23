import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const csv=readFileSync(
 "research/market-fixed-prices/jana4u-2025-11-14-crosswalk.csv","utf8",
);
function parseRow(line){
 const parts=[];let pos=0;
 while(pos<line.length){
  if(line[pos]!=='"')throw new Error("CSV cell must start with quote");
  pos++;let value="";
  while(pos<line.length){
   if(line[pos]!=='"'){value+=line[pos++];continue;}
   if(line[pos+1]==='"'){value+='"';pos+=2;continue;}
   pos++;break;
  }
  parts.push(value);
  if(pos<line.length){
   if(line[pos]!==',')throw Error("CSV separator expected");
   pos++;
  }
 }
 return parts;
}
const lines=csv.trimEnd().split(/\r?\n/);
const headers=parseRow(lines[0]);
const rows=lines.slice(1).map(line=>{
 const fields=parseRow(line);
 assert.equal(fields.length,headers.length);
 return Object.fromEntries(headers.map((key,i)=>[key,fields[i]]));
});
const byName=name=>rows.find(x=>x.item_name===name);
test("historical fixed market price snapshot is complete and provenance remains explicit",()=>{
 assert.equal(rows.length,1017);
 assert.equal(rows.filter(x=>x.price_source==="Jana4U").length,1016);
 assert.equal(rows.filter(x=>x.price_source==="player-reported").length,1);
 assert.equal(rows.filter(x=>x.client_name_match_status==="exact-name-match").length,292);
 assert.equal(rows.filter(x=>x.client_name_match_status==="not-matched").length,724);
 assert.equal(rows.filter(x=>x.client_name_match_status==="user-supplied-exact-name").length,1);
 assert.ok(rows.every(x=>/^[1-9]\d*$/.test(x.fixed_price_gold)));
 assert.ok(rows.filter(x=>x.price_source==="Jana4U").every(
  x=>x.source_game_version==="462580"&&x.source_snapshot_date==="2025-11-14"));
});
test("four reference prices match the reported game examples without inventing their provenance",()=>{
 for(const [name,id,price,source] of [
  ["Gold Thread","7070","3000","Jana4U"],
  ["Colorful Thread","7081","10000","Jana4U"],
  ["Mana Potion [II]","2080","8000","Jana4U"],
  ["Rice","3000","100","player-reported"],
  ["Colorful Fabric","7044","50000","Jana4U"],
 ]){
  const item=byName(name);
  assert.ok(item,name);
  assert.equal(item.client_item_id,id);
  assert.equal(item.fixed_price_gold,price);
  assert.equal(item.price_source,source);
 }
 assert.equal(byName("Rice").source_url,"");
});
test("all linked IDs are exact unique matches in the independent client item catalog",()=>{
 const manifest=JSON.parse(readFileSync("public/data/client-items/manifest.json","utf8"));
 const indices=manifest.indexShards.flatMap(path=>
  JSON.parse(readFileSync("public/data/client-items/"+path,"utf8")).rows);
 const known=new Map();
 for(const row of indices){
  if(typeof row[1]!=="string"||row[6]!=="named")continue;
  const key=row[1].toLowerCase();
  const candidates=known.get(key)||[];
  candidates.push(row[0]);known.set(key,candidates);
 }
 for(const row of rows){
  if(!row.client_item_id){
   assert.equal(row.client_name_match_status,"not-matched");
   continue;
  }
  assert.deepEqual(known.get(row.item_name.toLowerCase()),[row.client_item_id],row.item_name);
 }
});
test("CSV is compatible with spreadsheet readers, contains no duplicate names and preserves source URLs",()=>{
 assert.equal(new Set(rows.map(x=>x.item_name.toLowerCase())).size,rows.length);
 for(const row of rows){
  assert.ok(row.item_name.trim());
  if(row.price_source==="Jana4U")
   assert.equal(row.source_url,
    "https://github.com/jana4u/atlantica_online_craft_calculator/blob/master/data/items.yml");
 }
 assert.equal(headers[0],"item_name");
 assert.equal(headers[3],"fixed_price_gold");
});
