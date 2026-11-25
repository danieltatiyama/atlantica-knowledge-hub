import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {AWAKENING_ROWS,AWAKENING_TABS,AWAKENING_ITEM_BONUS_CAPS,AWAKENING_RESET} from "../src/data/awakening-source.mjs";
import {emptyAwakeningPlan,validateAwakeningPlan,summarizeAwakeningPlan,encodeAwakeningPlan,decodeAwakeningPlan} from "../src/data/awakening-planner.mjs";
import {awakeningText} from "../src/i18n/awakening-ui.mjs";
import {LOCALE_IDS,catalogPath,languageDestination,localePrefix} from "../src/i18n/locales.mjs";
test("32 source records, distinct keys, exact cost and capacity by category",()=>{
 assert.equal(AWAKENING_ROWS.length,32);
 assert.equal(new Set(AWAKENING_ROWS.map(r=>r[0])).size,32);
 assert.deepEqual(AWAKENING_TABS,["Default","Attack","Defense","Support"]);
 assert.deepEqual(AWAKENING_ITEM_BONUS_CAPS,[650,650,650,250]);
 assert.deepEqual(AWAKENING_RESET,{itemId:"21559",quantity:10,sourceLine:17});
 assert.deepEqual([0,1,2,3].map(i=>AWAKENING_ROWS.filter(r=>r[1]===i).length),[9,9,9,5]);
 for(const [id,tab,name,max,cost,line] of AWAKENING_ROWS){
  assert.match(id,/^AWK_[A-Z0-9_]+$/);assert.ok(name.trim());assert.ok([0,1,2,3].includes(tab));
  assert.equal(max*cost,100);assert.ok([1,2,4].includes(cost));assert.ok(line>=27&&line<=58);
 }
 const p=emptyAwakeningPlan();const a=summarizeAwakeningPlan(p);
 assert.deepEqual(a.tabs.map(t=>t.capacity),[900,900,900,500]);
 assert.deepEqual(a.tabs.map(t=>t.budget),[0,0,0,0]);assert.equal(a.valid,true);
});
test("allocation uses separate user-entered budgets, with exact costs and over-budget reporting",()=>{
 const p={version:1,budgets:[100,20,100,50],levels:{AWK_HP:75,AWK_SERIESHITRATE:8,AWK_MAGICATTACK_PER:2,AWK_EV:25,AWK_ACTIVEPOWER:10}};
 const a=summarizeAwakeningPlan(p);
 assert.deepEqual(a.tabs.map(t=>t.spent),[75,24,100,40]);
 assert.deepEqual(a.tabs.map(t=>t.remaining),[25,-4,0,10]);
 assert.equal(a.valid,false);assert.equal(a.spent,239);
 assert.equal(summarizeAwakeningPlan({...p,budgets:[100,24,100,50]}).valid,true);
 assert.equal(summarizeAwakeningPlan({...p,budgets:[100,0,100,50]}).valid,false);
});
test("links round-trip and reject malformed, duplicate, out-of-range and unknown allocation",()=>{
 const p={version:1,budgets:[900,650,40,20],levels:{AWK_HP:100,AWK_MAGICLEVEL:20,AWK_EV:10,AWK_ACTIVEPOWER:5}};
 assert.deepEqual(decodeAwakeningPlan(encodeAwakeningPlan(p)),p);
 assert.deepEqual(decodeAwakeningPlan(encodeAwakeningPlan(emptyAwakeningPlan())),emptyAwakeningPlan());
 for(const raw of ["","0.0.0","0.0.0.0~0.101","0.0.0.0~32.1","0.0.0.0~0.1~0.2","0.0.0.-1","0.0.0.100001","0.0.0.0~0.1.2"])assert.throws(()=>decodeAwakeningPlan(raw),/Invalid/);
 assert.throws(()=>validateAwakeningPlan({...p,levels:{UNKNOWN:1}}),/Invalid/);
 assert.throws(()=>validateAwakeningPlan({...p,levels:{AWK_EV:26}}),/Invalid/);
 assert.throws(()=>validateAwakeningPlan({...p,levels:{AWK_HP:1.5}}),/Invalid/);
});
test("localized routes and labels are available in all eight languages",()=>{
 for(const lang of LOCALE_IDS){
  const t=awakeningText(lang);assert.equal(Object.keys(t).length,24);assert.ok(Object.values(t).every(v=>typeof v==="string"&&v.trim()));
  assert.equal(catalogPath(lang,"/tools/awakening/"),localePrefix(lang)+"/tools/awakening/");
  assert.equal(languageDestination({lang,path:"/tools/awakening/"}),localePrefix(lang)+"/tools/awakening/");
 }
 const page=readFileSync("src/components/AwakeningPlannerPage.astro","utf8");
 for(const token of ["data-budget","data-level","data-over","encodeAwakeningPlan","decodeAwakeningPlan","AWAKENING_ITEM_BONUS_CAPS"])assert.ok(page.includes(token));
 assert.ok(!page.includes(".innerHTML"));
});
