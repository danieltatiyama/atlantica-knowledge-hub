import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 parseMarketPriceReviewQueue,parsePlayerMarketAttestation,
} from "../src/data/market-price-review.mjs";

const read=path=>readFileSync(path,"utf8");
const queue=JSON.parse(read("public/data/client-npc-trade-prices/review-queue.json"));
const candidates=parseMarketPriceReviewQueue(queue);
const byId=new Map(candidates.map(c=>[c.itemId,c]));
const report=JSON.parse(read("public/data/client-npc-trade-prices/player-report-2026-11-23.json"));

test("all and only the 128 Stage 20.66 candidate ItemIDs are covered",()=>{
 const ids=parsePlayerMarketAttestation(report,byId);
 assert.equal(ids.size,128);
 assert.deepEqual([...ids],[...byId.keys()]);
 assert.equal(report.itemIds.length,128);
 assert.equal(report.sourceType,"player-aggregate-statement");
 assert.equal(report.reportedOn,"2026-11-23");
});

test("player statement never masquerades as server-confirmed or independent verification",()=>{
 assert.equal(report.marketFixedPriceVerified,false);
 assert.equal(report.independentVerification,false);
 assert.equal(report.perItemEvidenceSupplied,false);
 assert.equal(queue.marketFixedPriceVerified,false);
 assert.match(report.notice,/not independent/i);
 assert.match(report.notice,/does not establish/i);
 assert.throws(()=>parsePlayerMarketAttestation({...report,marketFixedPriceVerified:true},byId));
 assert.throws(()=>parsePlayerMarketAttestation({...report,independentVerification:true},byId));
 assert.throws(()=>parsePlayerMarketAttestation({...report,perItemEvidenceSupplied:true},byId));
 assert.throws(()=>parsePlayerMarketAttestation({...report,sourceType:"official-server"},byId));
 assert.throws(()=>parsePlayerMarketAttestation({...report,reportedOn:"2026-11-24"},byId));
});

test("tampering with the scope, count or source is rejected",()=>{
 assert.throws(()=>parsePlayerMarketAttestation({...report,candidateSnapshotId:2},byId));
 assert.throws(()=>parsePlayerMarketAttestation({...report,scope:"all-421-general"},byId));
 assert.throws(()=>parsePlayerMarketAttestation({...report,itemIds:report.itemIds.slice(1)},byId));
 assert.throws(()=>parsePlayerMarketAttestation({
  ...report,itemIds:[...report.itemIds.slice(1),report.itemIds[1]],
 },byId));
 assert.throws(()=>parsePlayerMarketAttestation({
  ...report,itemIds:[...report.itemIds.slice(1),"99999999"],
 },byId));
 const removed=new Map(byId);
 removed.delete(report.itemIds[0]);
 assert.throws(()=>parsePlayerMarketAttestation(report,removed));
});

test("EN/PT-BR interface shows source-labeled bulk confirmation but preserves independent local editing",()=>{
 const ui=read("src/components/MarketPriceResearchPage.astro");
 const review=read("src/data/market-price-review.mjs");
 const crafting=read("src/data/client-npc-price-reference.mjs");
 for(const code of [
  "parsePlayerMarketAttestation(await attestationResponse.json(),byId)",
  '"/data/client-npc-trade-prices/player-report-2026-11-23.json"',
  "reportedIds.has(c.itemId)",
  "128/128 preços informados como coincidentes",
  "128/128 prices reported as matching",
  "not 128 individual screenshots",
  "não 128 capturas individuais",
  "observations.has(c.itemId)",
  "localStorage.setItem(REVIEW_STORAGE_KEY",
 ])assert.ok(ui.includes(code),code);
 assert.ok(review.includes("source.independentVerification!==false"));
 assert.ok(crafting.includes("marketFixedPriceVerified!==false"));
 assert.ok(!ui.includes("localStorage.setItem(REVIEW_STORAGE_KEY,JSON.stringify(report))"));
});
