import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {SERVER_TIME_ZONE,DUNGEON_COOLDOWNS_HOURS,emptyNationPlan,validateNationPlan,
 addCalendarDays,zonedParts,zonedWallToEpoch,serverRunEpoch,expandNationRuns,availabilityAt}
 from "../src/data/nation-dungeon-calendar.mjs";
test("server reset is 06:00 Los Angeles and dynamically follows PST/PDT",()=>{
 assert.equal(SERVER_TIME_ZONE,"America/Los_Angeles");
 assert.deepEqual(DUNGEON_COOLDOWNS_HOURS,{Avalon:60,Babel:20,Yggdrasil:40,Alcatraz:40,Pirate:20});
 assert.equal(new Date(serverRunEpoch("2026-01-12",360)).toISOString(),"2026-01-12T20:00:00.000Z");
 assert.equal(new Date(serverRunEpoch("2026-07-13",360)).toISOString(),"2026-07-13T19:00:00.000Z");
 assert.deepEqual(zonedParts(serverRunEpoch("2026-01-12",0),SERVER_TIME_ZONE),
   {date:"2026-01-12",hour:6,minute:0});
});
test("daylight-saving gap is not incorrectly presented as an available clock slot",()=>{
 assert.equal(zonedWallToEpoch("2026-03-29",2,30,"Europe/Paris"),null);
 assert.ok(Number.isFinite(zonedWallToEpoch("2026-03-29",3,30,"Europe/Paris")));
 assert.equal(addCalendarDays("2026-12-31",1),"2027-01-01");
});
test("fixed weekly R+6 and normal runs honor 60-hour Avalon cooldown",()=>{
 const plan=emptyNationPlan();
 plan.rules=[
  {id:"mon",type:"fixed",dungeon:"Avalon",weekday:1,offsetMinutes:360},
  {id:"wed",type:"normal",dungeon:"Avalon",serverDate:"2026-01-14",offsetMinutes:360},
  {id:"fri",type:"normal",dungeon:"Avalon",serverDate:"2026-01-16",offsetMinutes:360},
 ];
 const events=expandNationRuns(plan,{startDate:"2026-01-12",days:7,timeZone:"America/Los_Angeles"});
 const mon=events.find(r=>r.occurrence==="mon@2026-01-12");
 const wed=events.find(r=>r.occurrence==="wed@2026-01-14");
 const fri=events.find(r=>r.occurrence==="fri@2026-01-16");
 assert.equal(mon.accepted,true);
 assert.equal(wed.accepted,false);
 assert.equal(fri.accepted,true);
 assert.equal(availabilityAt(serverRunEpoch("2026-01-14",360),"Avalon",events,plan).ready,false);
 assert.equal(availabilityAt(serverRunEpoch("2026-01-15",361),"Avalon",events,plan).ready,true);
});
test("plan schema rejects malformed schedules and preserves arbitrary valid cooldown overrides",()=>{
 const plan=emptyNationPlan();
 plan.cooldowns.Babel=30;
 assert.equal(validateNationPlan(plan).cooldowns.Babel,30);
 assert.throws(()=>validateNationPlan({...plan,rules:[{id:"a",type:"fixed",dungeon:"Avalon",
   weekday:7,offsetMinutes:360}]}),/weekday/);
 assert.throws(()=>validateNationPlan({...plan,cooldowns:{...plan.cooldowns,Avalon:0}}),/cooldown/);
});
test("calendar offers editable runs, horizon, orientation, timezone, persistence and sharing",()=>{
 const page=readFileSync("src/components/NationDungeonCalendarPage.astro","utf8");
 const hub=readFileSync("src/components/ToolsPage.astro","utf8");
 for(const token of ["nd-horizon","nd-orientation","time-rows","day-rows","nd-edit-weekday",
   "nd-rule-list","nd-export","nd-import","nd-share","nd-timezone","Europe/Paris","Asia/Tokyo",
   "atlantica.nd-calendar.v1","atlantica.nd-view.v1","expandNationRuns(plan",
   "availabilityAt(epoch","localStorage.setItem(cacheKey","serverDate.value"])
   assert.ok(page.includes(token),token);
 assert.ok(hub.includes('href:prefix+"/tools/nation-dungeons/"'));
 assert.ok(page.includes("source")||page.includes("reset"));
});
