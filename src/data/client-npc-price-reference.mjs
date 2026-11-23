/**
 * Stage 20.65: opt-in NPC client reference prices for the crafting calculator.
 *
 * Source records are NOT confirmed live fixed Market offers. The UI must only
 * display references until a user explicitly copies one into their own prices.
 */
export const CLIENT_NPC_PRICE_ORIGIN="client-npc-catalog";

export function parseClientNPCPriceCatalog(manifest,source){
  if(!manifest||manifest.schemaVersion!=="1.0"||manifest.snapshotId!==1||
    manifest.dataset!=="client-npc-trade-price-candidates"||
    manifest.marketFixedPriceVerified!==false||manifest.generalCount!==421||
    !source||source.dataset!=="client-npc-trade-general-prices"||
    source.snapshotId!==1||!Array.isArray(source.rows)||
    source.rows.length!==manifest.generalCount)
    throw new Error("Client NPC price source manifest mismatch");
  const map=new Map();
  for(const entry of source.rows){
    if(!Array.isArray(entry)||entry.length!==3)throw new Error("Invalid source reference row");
    const [id,value,line]=entry;
    if(typeof id!=="string"||!/^[1-9]\d{0,12}$/.test(id)||
      typeof value!=="string"||!/^[1-9]\d{0,14}$/.test(value)||
      !Number.isInteger(line)||line<1||map.has(id))
      throw new Error("Invalid source price entry");
    map.set(id,value);
  }
  return map;
}
export function applyMissingClientNPCPrices({leaves,prices,priceOrigins,references}){
  if(!(references instanceof Map)||!Array.isArray(leaves)||
    !prices||typeof prices!=="object"||
    !priceOrigins||typeof priceOrigins!=="object")
    throw new TypeError("Missing client NPC price context");
  let applied=0;
  for(const leaf of leaves){
    const id=String(leaf.itemId);
    const ref=references.get(id);
    if(ref&&(!prices[id]||!String(prices[id]).trim())){
      prices[id]=ref;
      priceOrigins[id]=CLIENT_NPC_PRICE_ORIGIN;
      applied++;
    }
  }
  return applied;
}
