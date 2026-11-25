import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS} from "../src/i18n/locales.mjs";
import {aliasUiRows,aliasText} from "../src/i18n/name-alias-ui.mjs";
import {nameAliasRows,wikiNameAlias,matchesWikiNameAlias,matchesAliasText} from "../src/data/wiki-name-aliases.mjs";
import {buildWikiSearchRecords,searchWikiRecords,isWikiSearchQuery} from "../src/data/wiki-unified-search.mjs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const root="public/data/";
const items=read(root+"client-items/manifest.json").indexShards.map(f=>read(root+"client-items/"+f));
const monsters=read(root+"client-monsters/manifest.json").files.index.map(f=>read(root+"client-monsters/"+f));
test("unofficial aliases bind only to exact named source identities in snapshot 1",()=>{
 const seen=new Set();
 const indexed={item:new Map(),monster:new Map()};
 for(const [kind,shards] of [["item",items],["monster",monsters]])for(const row of shards.flatMap(x=>x.rows)){
  assert.ok(!indexed[kind].has(String(row[0])),"duplicate source "+kind+" "+row[0]);
  indexed[kind].set(String(row[0]),row);
 }
 for(const [kind,id,source,...aliases] of nameAliasRows){
  assert.ok(kind==="item"||kind==="monster");
  assert.ok(!seen.has(kind+":"+id));seen.add(kind+":"+id);
  const match=indexed[kind].get(id);
  assert.ok(match,id);
  assert.equal(match[1],source,id);
  assert.equal(match[kind==="item"?6:4],"named",id);
  assert.equal(aliases.length,7,id);
  for(const [i,lang] of LOCALE_IDS.entries()){
   const alias=wikiNameAlias(kind,id,source,lang);
   assert.equal(alias,i===0?null:aliases[i-1],lang+" "+id);
   if(i>0)assert.ok(alias.trim());
   assert.equal(wikiNameAlias(kind,id,source+" changed",lang),null);
  }
 }
 assert.equal(wikiNameAlias("monster","7080","Silver Thread","pt-br"),null);
 assert.equal(wikiNameAlias("item","999999","Silver Thread","pt-br"),null);
 assert.equal(wikiNameAlias("item","7080","Silver Thread","unknown"),null);
});
test("aliases are supplementary and preserve English title, ID ranking and locale routes",()=>{
 const records=buildWikiSearchRecords(items,monsters,[],"pt-br");
 const result=searchWikiRecords(records,"linha de prata")[0];
 assert.equal(result.id,"7080");assert.equal(result.title,"Silver Thread");
 assert.equal(result.nameAlias,"Linha de prata");
 assert.equal(result.href,"/pt-br/items/database/?id=7080");
 assert.equal(searchWikiRecords(records,"7080")[0].id,"7080");
 assert.equal(searchWikiRecords(records,"Silver Thread")[0].id,"7080");
 assert.equal(searchWikiRecords(records,"crocodilo gigante")[0].id,"289");
 assert.equal(matchesWikiNameAlias("item","5002","Oil","pt-br","oleo"),true);
 assert.equal(matchesWikiNameAlias("item","5002","Oil","en","oleo"),false);
 assert.equal(records.filter(r=>r.kind==="item").length,22702);
 assert.equal(records.filter(r=>r.kind==="monster").length,4351);
});
test("single CJK character matches exact aliases without weakening Latin minimum",()=>{
 for(const [lang,query,id] of [["zh-hans","盐","16000"],["ja","油","5002"],["ko","밀","3130"]]){
  const records=buildWikiSearchRecords(items,monsters,[],lang);
  assert.ok(isWikiSearchQuery(query));
  assert.equal(searchWikiRecords(records,query)[0].id,id);
 }
 assert.equal(isWikiSearchQuery("s"),false);
 assert.equal(isWikiSearchQuery(" "),false);
});
test("all UI disclosure messages are available and raw data stays separate",()=>{
 for(const row of aliasUiRows){
  assert.equal(row.length,8);
  for(const [i,lang] of LOCALE_IDS.entries())assert.equal(aliasText(lang,row[0]),row[i]);
 }
 for(const name of ["GlobalSearch","FullClientItemDatabasePage"]){
  const s=readFileSync("src/components/"+name+".astro","utf8");
  assert.ok(s.includes('aliasText(lang,"Wiki translation (unofficial)")'));
  assert.ok(s.includes("these are not official regional names."));
 }
});

test("aliases are integrated in the player-facing item and creature tools",()=>{
 for(const name of ["MonsterDatabasePage","MonsterDropItemSearch","MonsterItemSources","CraftingPlannerPage","MarketPriceCatalogPage","MarketPriceResearchPage","ItemCatalogPage","ItemDetailPage","ClientSourceEquipmentPage"]){
  const source=readFileSync("src/components/"+name+".astro","utf8");
  assert.ok(source.includes("wikiNameAlias("),name);
  assert.ok(source.includes('aliasText(lang,"Wiki translation (unofficial)")'),name);
 }
 const crafting=readFileSync("src/components/CraftingPlannerPage.astro","utf8");
 assert.ok(crafting.includes('name:nameCache?.get(row.itemId)'));
 assert.ok(crafting.includes('["ItemID","Name","Quantity","UnitPrice","TotalCost"]'));
 assert.ok(crafting.includes("isWikiSearchQuery(text)"));
});

test("expanded aliases preserve grade markers and distinguish enhancement systems",()=>{
 assert.ok(nameAliasRows.filter(r=>r[0]==="item").length>=240);
 for(const [kind,id,source,...aliases] of nameAliasRows){
  const marker=source.match(/\[[IVX]+\]$/)?.[0];
  if(marker)for(const alias of aliases)assert.ok(alias.endsWith(marker),id+" "+alias);
 }
 assert.equal(wikiNameAlias("item","21569","Enchant Stone [I]","pt-br"),"Pedra de encantamento [I]");
 assert.equal(wikiNameAlias("item","21574","Enhance Stone [I]","pt-br"),"Pedra de aprimoramento [I]");
 assert.equal(wikiNameAlias("item","20011","Life Potion[II]","pt-br"),"Poção de vida [II]");
 assert.equal(wikiNameAlias("item","20011","Life Potion [II]","pt-br"),null);
 for(const [lang,query,id] of [["pt-br","minério de ouro","5040"],["ko","해독제 [VI]","2226"],["ja","解除の巻物 [VI]","26770"],["zh-hans","精金","5342"]]){
  const records=buildWikiSearchRecords(items,monsters,[],lang);
  assert.equal(searchWikiRecords(records,query)[0].id,id);
 }
 const price=read(root+"client-npc-trade-prices/catalog.json");
 assert.ok(price.rows.filter(row=>wikiNameAlias("item",row[0],row[1],"pt-br")).length>=175);
});

test("all reviewed equipment has descriptive aliases with exact source identity",()=>{
 const reviewed=items.flatMap(x=>x.rows).filter(r=>r[6]==="named"&&r[8]===1);
 assert.equal(reviewed.length,551);
 for(const row of reviewed)for(const lang of LOCALE_IDS.slice(1)){
  assert.ok(wikiNameAlias("item",row[0],row[1],lang)?.includes(" — "),lang+" "+row[0]);
 }
 assert.equal(wikiNameAlias("item","185","Twilight Sword","pt-br"),"Espada — Twilight");
 assert.equal(wikiNameAlias("item","185","Twilight Sword","ko"),"검 — Twilight");
 assert.ok(matchesAliasText("Espada — Twilight","twilight espada"));
 assert.ok(matchesWikiNameAlias("item","185","Twilight Sword","pt-br","espada twilight"));
 assert.equal(matchesAliasText("Espada — Twilight","twilight machado"),false);
 assert.equal(matchesAliasText(null,"espada"),false);
 assert.equal(matchesAliasText("Espada — Twilight"," "),false);
 const records=buildWikiSearchRecords(items,monsters,[],"pt-br");
 assert.equal(searchWikiRecords(records,"twilight espada")[0].id,"185");
 for(const name of ["EquipmentBoxOverview","BoxArticle","ClientCraftingSummary","ClientCraftingBacklinks"]){
  const source=readFileSync("src/components/"+name+".astro","utf8");
  assert.ok(source.includes("wikiNameAlias("),name);
  assert.ok(source.includes('aliasText(lang,"Wiki translation (unofficial)")'),name);
 }
});
