import {matchesWikiNameAlias} from "./wiki-name-aliases.mjs";
import {catalogPath,isLocale} from "../i18n/locales.mjs";
/**
 * Player-facing catalog of client NPC price references.
 * Price values and provenance are data from the installed client, not live-server facts.
 */
const validId=value=>typeof value==="string"&&/^[1-9]\d{0,12}$/.test(value);
const validGold=value=>typeof value==="string"&&/^[1-9]\d{0,14}$/.test(value);
const validText=(value,max)=>typeof value==="string"&&value.trim()===value&&value.length>0&&value.length<=max;
const CLASSES=new Set(["historical-crosscheck","additional-candidate"]);
export function parseClientMarketPriceCatalog(source){
 if(!source||source.schemaVersion!=="1.0"||
  source.dataset!=="client-npc-market-price-catalog"||
  source.snapshotId!==1||source.marketFixedPriceVerified!==false||
  source.catalogCount!==421||source.historicalCrosscheckCount!==293||
  source.additionalCandidateCount!==128||
  !Array.isArray(source.rows)||source.rows.length!==421)
  throw Error("Client market catalog source mismatch");
 const ids=new Set(),classes={"historical-crosscheck":0,"additional-candidate":0};
 const items=source.rows.map(row=>{
  if(!Array.isArray(row)||row.length!==6)throw Error("Malformed client price catalog entry");
  const [itemId,name,category,referenceGold,sourceLine,comparisonClass]=row;
  if(!validId(itemId)||ids.has(itemId)||!validText(name,200)||
   (category!==""&&!validText(category,100))||!validGold(referenceGold)||
   !Number.isInteger(sourceLine)||sourceLine<1||!CLASSES.has(comparisonClass))
   throw Error("Invalid client price catalog entry");
  ids.add(itemId);classes[comparisonClass]++;
  return {itemId,name,category,referenceGold,sourceLine,comparisonClass};
 });
 if(classes["historical-crosscheck"]!==293||classes["additional-candidate"]!==128)
  throw Error("Client price catalog comparison-class mismatch");
 return items;
}
export function filterClientMarketCatalog(items,{
 query="",category="all",evidence="all",sort="name",offset=0,limit=50,lang="en",
}={}){
 if(!Array.isArray(items)||!Number.isInteger(offset)||offset<0||
  !Number.isInteger(limit)||limit<1||limit>421)
  throw TypeError("Invalid client price catalog filters");
 const needle=String(query).trim().toLocaleLowerCase();
 const filtered=items.filter(item=>
  (category==="all"||item.category===category)&&
  (evidence==="all"||item.comparisonClass===evidence)&&
  (!needle||item.itemId.includes(needle)||
   item.name.toLocaleLowerCase().includes(needle)||
   matchesWikiNameAlias("item",item.itemId,item.name,lang,needle)||
   item.category.toLocaleLowerCase().includes(needle)));
 const textSort=(a,b)=>a.name.localeCompare(b.name,"en",{numeric:true})||
  Number(a.itemId)-Number(b.itemId);
 const compareNumber=(a,b)=>{
  const x=BigInt(a.referenceGold),y=BigInt(b.referenceGold);
  return x===y?0:x<y?-1:1;
 };
 filtered.sort((a,b)=>sort==="price-asc"?compareNumber(a,b)||textSort(a,b):
  sort==="price-desc"?compareNumber(b,a)||textSort(a,b):
  sort==="id"?Number(a.itemId)-Number(b.itemId):textSort(a,b));
 return {total:filtered.length,rows:filtered.slice(offset,offset+limit)};
}
export function clientItemDetailUrl(itemId,lang="en"){
 if(!validId(itemId))throw Error("Invalid client ItemID link");
 return catalogPath(isLocale(lang)?lang:"en","/items/database/")+"?id="+encodeURIComponent(itemId);
}
