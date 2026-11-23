import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateMarketPriceReviewQueue} from "../scripts/build-market-price-review-queue.mjs";
import {
 parseMarketPriceReviewQueue,normalizeMarketObservation,
 validateMarketReviewBundle,buildMarketReviewBundle,
} from "../src/data/market-price-review.mjs";
const read=path=>readFileSync(path,"utf8");
const publicSource=JSON.parse(read("public/data/client-npc-trade-prices/review-queue.json"));
const candidates=parseMarketPriceReviewQueue(publicSource);
const byId=new Map(candidates.map(c=>[c.itemId,c]));
const sample=candidates[0];
const observed={
 itemId:sample.itemId,state:"fixed-match",observedGold:sample.referenceGold,
 observedOn:"2026-11-23",notes:"Checked fixed-price Market listing in-game.",
};

test("128 candidates deterministically match exact preserved source and historical crosswalk",()=>{
 const result=generateMarketPriceReviewQueue(
  read("research/market-fixed-prices/client-npc-trade-2026-11-23.csv"),
  read("research/market-fixed-prices/jana4u-2025-11-14-crosswalk.csv")
 );
 assert.deepEqual(result,publicSource);
 assert.equal(read("public/data/client-npc-trade-prices/review-queue.json"),JSON.stringify(result)+"\n");
 assert.equal(candidates.length,128);
 assert.equal(new Set(candidates.map(x=>x.itemId)).size,128);
 assert.equal(result.marketFixedPriceVerified,false);
 assert.ok(candidates.every(c=>c.name&&c.category&&c.referenceGold&&c.sourceLine>0));
});

test("review queue never implies verified live Market prices and rejects manipulated source",()=>{
 assert.throws(()=>parseMarketPriceReviewQueue({...publicSource,marketFixedPriceVerified:true}));
 assert.throws(()=>parseMarketPriceReviewQueue({...publicSource,rows:[]}));
 const duplicate=publicSource.rows.map(x=>[...x]);
 duplicate[1][0]=duplicate[0][0];
 assert.throws(()=>parseMarketPriceReviewQueue({...publicSource,rows:duplicate}));
 const forged=publicSource.rows.map(x=>[...x]);
 forged[0][3]="=HYPERLINK(1)";
 assert.throws(()=>parseMarketPriceReviewQueue({...publicSource,rows:forged}));
});

test("local evidence requires date, notes and exact observed-price status",()=>{
 assert.deepEqual(normalizeMarketObservation(observed,byId),observed);
 assert.throws(()=>normalizeMarketObservation({...observed,itemId:"9999999999"},byId),/Unknown ItemID/);
 assert.throws(()=>normalizeMarketObservation({...observed,observedOn:"2026-02-30"},byId));
 assert.throws(()=>normalizeMarketObservation({...observed,notes:"short"},byId));
 assert.throws(()=>normalizeMarketObservation({...observed,observedGold:"=1+2"},byId));
 assert.throws(()=>normalizeMarketObservation({...observed,observedGold:"10000000000000000"},byId));
 assert.throws(()=>normalizeMarketObservation({...observed,state:"fixed-different"},byId));
 const different={...observed,state:"fixed-different",observedGold:String(BigInt(sample.referenceGold)+1n)};
 assert.equal(normalizeMarketObservation(different,byId).state,"fixed-different");
 const missing={...observed,state:"not-listed",observedGold:null};
 assert.deepEqual(normalizeMarketObservation(missing,byId),missing);
 assert.throws(()=>normalizeMarketObservation({...missing,observedGold:"500"},byId));
});

test("portable JSON is a self-reported local observation, not a global validation database",()=>{
 const map=new Map([[observed.itemId,observed]]);
 const bundle=buildMarketReviewBundle(map,byId);
 assert.equal(bundle.marketFixedPriceVerified,false);
 assert.equal(bundle.dataset,"player-market-observations");
 assert.deepEqual([...validateMarketReviewBundle(JSON.parse(JSON.stringify(bundle)),byId).values()],[observed]);
 assert.throws(()=>validateMarketReviewBundle({...bundle,marketFixedPriceVerified:true},byId));
 assert.throws(()=>validateMarketReviewBundle({...bundle,sourceSnapshotId:2},byId));
 assert.throws(()=>validateMarketReviewBundle({...bundle,observations:[observed,observed]},byId),/Duplicate/);
 assert.throws(()=>validateMarketReviewBundle({...bundle,observations:[{...observed,itemId:"9999999"}]},byId));
});

test("bilingual review UI is accessible from Tools, browser-local and separate from crafting",()=>{
 const hub=read("src/components/ToolsPage.astro");
 const ui=read("src/components/MarketPriceResearchPage.astro");
 const en=read("src/pages/tools/market-prices/index.astro");
 const pt=read("src/pages/pt-br/tools/market-prices/index.astro");
 for(const part of [
  "/tools/market-prices/",
  "/data/client-npc-trade-prices/review-queue.json",
  "parseMarketPriceReviewQueue(await response.json())",
  "validateMarketReviewBundle(JSON.parse(saved),byId)",
  "buildMarketReviewBundle(observations,byId)",
  "localStorage.setItem(REVIEW_STORAGE_KEY",
  'id="mpr-import"',
  'id="mpr-export"',
  'id="mpr-observed-date"',
  'id="mpr-notes"',
  "textContent=value",
  "marketFixedPriceVerified",
 ])assert.ok((hub+ui+read("src/data/market-price-review.mjs")).includes(part),part);
 assert.ok(en.includes('lang="en"')&&pt.includes('lang="pt-br"'));
 assert.ok(ui.includes("Não comprovam")||ui.includes("NÃO comprovam"));
 assert.ok(!ui.includes("fetch(\"/api/"),"No server-side uploads");
 const crafting=read("src/data/client-npc-price-reference.mjs");
 assert.ok(crafting.includes("marketFixedPriceVerified!==false"));
});
