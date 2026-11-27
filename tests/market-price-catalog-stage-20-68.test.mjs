import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildClientMarketPriceCatalog} from "../scripts/build-market-price-catalog.mjs";
import {
 parseClientMarketPriceCatalog,filterClientMarketCatalog,clientItemDetailUrl,
} from "../src/data/market-price-catalog.mjs";
import {parseMarketPriceReviewQueue,parsePlayerMarketAttestation}
 from "../src/data/market-price-review.mjs";
const read=path=>readFileSync(path,"utf8");
const catalog=JSON.parse(read("public/data/client-npc-trade-prices/catalog.json"));
const rows=parseClientMarketPriceCatalog(catalog);
const queue=parseMarketPriceReviewQueue(JSON.parse(
 read("public/data/client-npc-trade-prices/review-queue.json")));
const candidates=new Map(queue.map(x=>[x.itemId,x]));
const report=JSON.parse(read("public/data/client-npc-trade-prices/player-report-2026-11-23.json"));
const reported=parsePlayerMarketAttestation(report,candidates);

test("catalog exactly reproduces 421 original NPC client rows from immutable source",()=>{
 const built=buildClientMarketPriceCatalog({
  clientCSV:read("research/market-fixed-prices/client-npc-trade-2026-11-23.csv"),
  historicalCSV:read("research/market-fixed-prices/jana4u-2025-11-14-crosswalk.csv"),
  reference:JSON.parse(read("public/data/client-npc-trade-prices/general.json")),
  queue:JSON.parse(read("public/data/client-npc-trade-prices/review-queue.json")),
 });
 assert.deepEqual(built,catalog);
 assert.equal(read("public/data/client-npc-trade-prices/catalog.json"),JSON.stringify(built)+"\n");
 assert.equal(rows.length,421);
 assert.equal(new Set(rows.map(x=>x.itemId)).size,421);
 assert.equal(rows.filter(x=>x.comparisonClass==="historical-crosscheck").length,293);
 assert.equal(rows.filter(x=>x.comparisonClass==="additional-candidate").length,128);
 assert.equal(catalog.marketFixedPriceVerified,false);
 assert.equal(rows.filter(x=>x.category==="").length,5,
  "Five source-empty categories must remain unclassified");
});

test("293 historical matches and 128 reported matches remain different evidence types",()=>{
 assert.equal(reported.size,128);
 const historical=rows.filter(x=>x.comparisonClass==="historical-crosscheck");
 const additional=rows.filter(x=>x.comparisonClass==="additional-candidate");
 assert.ok(additional.every(x=>reported.has(x.itemId)&&candidates.has(x.itemId)));
 assert.ok(historical.every(x=>!reported.has(x.itemId)));
 assert.ok(additional.every(x=>x.referenceGold===candidates.get(x.itemId).referenceGold));
 assert.equal(report.marketFixedPriceVerified,false);
 assert.equal(report.independentVerification,false);
});

test("fail closed on forged Market verification, duplicate records and malformed prices",()=>{
 assert.throws(()=>parseClientMarketPriceCatalog({...catalog,marketFixedPriceVerified:true}));
 assert.throws(()=>parseClientMarketPriceCatalog({...catalog,catalogCount:420}));
 assert.throws(()=>parseClientMarketPriceCatalog({...catalog,rows:catalog.rows.slice(1)}));
 const bad=catalog.rows.map(x=>[...x]);bad[0][3]="=1+1";
 assert.throws(()=>parseClientMarketPriceCatalog({...catalog,rows:bad}));
 const dup=catalog.rows.map(x=>[...x]);dup[1][0]=dup[0][0];
 assert.throws(()=>parseClientMarketPriceCatalog({...catalog,rows:dup}));
 const mislabeled=catalog.rows.map(x=>[...x]);mislabeled[0][5]="verified-live";
 assert.throws(()=>parseClientMarketPriceCatalog({...catalog,rows:mislabeled}));
});

test("search, category filters, historical vs reported filters and sorting all work",()=>{
 const q=filterClientMarketCatalog(rows,{query:"Gold Thread"});
 assert.equal(q.total,1);assert.equal(q.rows[0].itemId,"7070");
 const id=filterClientMarketCatalog(rows,{query:"7070"});
 assert.equal(id.rows[0].name,"Gold Thread");
 const categories=filterClientMarketCatalog(rows,{category:"Heal"});
 assert.ok(categories.total>0&&categories.rows.every(x=>x.category==="Heal"));
 assert.equal(filterClientMarketCatalog(rows,{evidence:"historical-crosscheck"}).total,293);
 assert.equal(filterClientMarketCatalog(rows,{evidence:"additional-candidate"}).total,128);
 const low=filterClientMarketCatalog(rows,{sort:"price-asc",limit:421}).rows;
 const high=filterClientMarketCatalog(rows,{sort:"price-desc",limit:421}).rows;
 assert.ok(low.every((x,i)=>i===0||BigInt(low[i-1].referenceGold)<=BigInt(x.referenceGold)));
 assert.ok(high.every((x,i)=>i===0||BigInt(high[i-1].referenceGold)>=BigInt(x.referenceGold)));
 const second=filterClientMarketCatalog(rows,{offset:50,limit:50});
 assert.equal(second.total,421);assert.equal(second.rows.length,50);
 assert.notEqual(second.rows[0].itemId,filterClientMarketCatalog(rows).rows[0].itemId);
 assert.deepEqual(filterClientMarketCatalog(rows,{query:"no-item-like-this"}),{total:0,rows:[]});
 assert.throws(()=>filterClientMarketCatalog(rows,{limit:9999}));
});

test("item links use the supported database ItemID deep-link in both locales",()=>{
 assert.equal(clientItemDetailUrl("7070","en"),"/items/profile/?id=7070");
 assert.equal(clientItemDetailUrl("2002","pt-br"),"/pt-br/items/profile/?id=2002");
 for(const lang of ["fr","de","es","ko","zh-hans","ja"])assert.equal(clientItemDetailUrl("7070",lang),"/"+lang+"/items/profile/?id=7070");
 assert.equal(clientItemDetailUrl("7070","unknown"),"/items/profile/?id=7070");
 assert.throws(()=>clientItemDetailUrl("abc"));
 const itemPage=read("src/components/FullClientItemDatabasePage.astro");
 assert.ok(itemPage.includes('new URL(location.href).searchParams.get("id")'));
});

test("player-first catalog is primary EN/PT-BR route; old workbench remains accessible",()=>{
 const en=read("src/pages/tools/market-prices/index.astro");
 const pt=read("src/pages/pt-br/tools/market-prices/index.astro");
 const researchEn=read("src/pages/tools/market-prices/research/index.astro");
 const researchPt=read("src/pages/pt-br/tools/market-prices/research/index.astro");
 assert.ok(en.includes('MarketPriceCatalogPage lang="en"'));
 assert.ok(pt.includes('MarketPriceCatalogPage lang="pt-br"'));
 assert.ok(researchEn.includes('MarketPriceResearchPage lang="en"'));
 assert.ok(researchPt.includes('MarketPriceResearchPage lang="pt-br"'));
 const ui=read("src/components/MarketPriceCatalogPage.astro");
 for(const part of [
  "parseClientMarketPriceCatalog(await catalogResponse.json())",
  "parsePlayerMarketAttestation(await reportResponse.json(),byId)",
  "filterClientMarketCatalog(catalog,filter)",
  "clientItemDetailUrl(item.itemId",
  "id=\"mpc-search\"","id=\"mpc-category\"","id=\"mpc-evidence\"",
  "id=\"mpc-sort\"","id=\"mpc-next\"","id=\"mpc-prev\"",
  "<details class=\"mpc-methodology\">",
  "/tools/market-prices/research/",
  "@media(max-width:650px)",
 ])assert.ok(ui.includes(part),part);
 assert.ok(!ui.includes("fetch(\"/api/"));
 assert.ok(read("src/components/ToolsPage.astro").includes("421 preços de referência"));
 const research=read("src/components/MarketPriceResearchPage.astro");
 assert.ok(research.includes("localStorage.setItem(REVIEW_STORAGE_KEY"));
 assert.ok(research.includes('"/tools/market-prices/research/"'));
});

test("localized search matches an alias without changing prices or source records",()=>{
 const original=filterClientMarketCatalog(rows,{query:"Gold Thread"}).rows[0];
 for(const [lang,query] of [["pt-br","linha de ouro"],["ko","금실"],["ja","金糸"]]){
  const result=filterClientMarketCatalog(rows,{query,lang});
  assert.deepEqual(result.rows.find(x=>x.itemId==="7070"),original);
 }
 assert.equal(filterClientMarketCatalog(rows,{query:"linha de ouro",lang:"en"}).total,0);
});
