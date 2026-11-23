/**
 * Browser-local Market observations. An observation is never a verified
 * statement about the live server or a change to immutable NPC client data.
 */
export const REVIEW_STATES=["fixed-match","fixed-different","not-listed","inconclusive"];
export const REVIEW_STORAGE_KEY="atlantica.marketPriceReview.v1";
const validPositive=value=>typeof value==="string"&&/^[1-9]\d{0,14}$/.test(value);
const validDate=value=>{
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+"T00:00:00Z");
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
};

export function parseMarketPriceReviewQueue(source){
 if(!source||source.schemaVersion!=="1.0"||
  source.dataset!=="client-npc-market-price-review-queue"||
  source.snapshotId!==1||
  source.sourceDataset!=="client-npc-trade-general-prices"||
  source.marketFixedPriceVerified!==false||
  source.candidateCount!==128||
  !Array.isArray(source.rows)||source.rows.length!==128)
  throw Error("Unexpected review queue source or Market verification claim");
 const ids=new Set();
 return source.rows.map(row=>{
  if(!Array.isArray(row)||row.length!==5)throw Error("Malformed candidate row");
  const [itemId,name,category,referenceGold,sourceLine]=row;
  if(typeof itemId!=="string"||!validPositive(itemId)||ids.has(itemId)||
   typeof name!=="string"||!name.trim()||name.length>200||
   typeof category!=="string"||!category.trim()||category.length>100||
   !validPositive(referenceGold)||
   !Number.isInteger(sourceLine)||sourceLine<1)
   throw Error("Invalid review candidate");
  ids.add(itemId);
  return {itemId,name,category,referenceGold,sourceLine};
 });
}

export function normalizeMarketObservation(input,candidates){
 if(!input||typeof input!=="object"||Array.isArray(input))
  throw Error("Invalid observation");
 const id=input.itemId;
 if(typeof id!=="string"||!candidates.has(id))
  throw Error("Unknown ItemID");
 const state=input.state,observedOn=input.observedOn;
 const notes=typeof input.notes==="string"?input.notes.trim():"";
 if(!REVIEW_STATES.includes(state)||!validDate(observedOn)||
  notes.length<10||notes.length>1000)
  throw Error("Observation needs a valid date and descriptive evidence (10–1000 characters)");
 const reference=candidates.get(id).referenceGold;
 let observedGold=null;
 if(state==="fixed-match"||state==="fixed-different"){
  observedGold=String(input.observedGold??"").trim();
  if(!validPositive(observedGold))throw Error("Enter an observed positive integer gold price");
  if((BigInt(observedGold)===BigInt(reference))!==(state==="fixed-match"))
   throw Error("Observed price does not match the chosen status");
 }else if(input.observedGold!==null&&input.observedGold!==undefined&&
  input.observedGold!=="")throw Error("This status cannot include a price");
 return {itemId:id,state,observedGold,observedOn,notes};
}

export function validateMarketReviewBundle(raw,candidates){
 if(!raw||raw.schemaVersion!=="1.0"||
  raw.dataset!=="player-market-observations"||
  raw.sourceSnapshotId!==1||raw.marketFixedPriceVerified!==false||
  !Array.isArray(raw.observations)||raw.observations.length>128)
  throw Error("Invalid local Market observation export");
 const map=new Map();
 for(const record of raw.observations){
  const item=normalizeMarketObservation(record,candidates);
  if(map.has(item.itemId))throw Error("Duplicate observation ID");
  map.set(item.itemId,item);
 }
 return map;
}

export function buildMarketReviewBundle(observations,candidates){
 if(!(observations instanceof Map))throw TypeError("Expected observations map");
 const entries=Array.from(observations.values())
  .map(value=>normalizeMarketObservation(value,candidates))
  .sort((a,b)=>Number(a.itemId)-Number(b.itemId));
 return {
  schemaVersion:"1.0",
  dataset:"player-market-observations",
  sourceSnapshotId:1,
  marketFixedPriceVerified:false,
  notice:"Self-reported, browser-local observations requiring independent review. They are not official or server-verified fixed Market prices.",
  observations:entries,
 };
}
