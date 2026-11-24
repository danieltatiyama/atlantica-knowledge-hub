import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {LOCALE_IDS,NEW_GUIDE_LOCALES,localePrefix,catalogPath,languageDestination} from "../src/i18n/locales.mjs";
import {toolRows,toolText,calendarWeekday} from "../src/i18n/tools-ui.mjs";
const read=path=>readFileSync(path,"utf8");
test("calendar and tools messages are complete and preserve Portuguese wording",()=>{
 const keys=new Set(toolRows.map(row=>row[0]));
 assert.equal(keys.size,toolRows.length);
 for(const row of toolRows){
  assert.equal(row.length,7,row[0]);
  for(const v of row)assert.ok(v.trim(),row[0]);
  for(const [i,lang] of NEW_GUIDE_LOCALES.entries())assert.equal(toolText(lang,row[0]),row[i+1]);
 }
 for(const name of ["NationDungeonCalendarPage","ToolsPage"]){
  const source=read("src/components/"+name+".astro");
  assert.doesNotMatch(source,/\bpt\s*\?/);
  for(const [,key] of source.matchAll(/toolText\(lang,"([^"]+)"/g))assert.ok(keys.has(key),name+" "+key);
 }
 assert.equal(toolText("pt-br","Save run","Salvar run"),"Salvar run");
 assert.equal(calendarWeekday("ja",1),"月曜日");
 assert.equal(calendarWeekday("fr",0),"dimanche");
});
test("tools routes and shared plans preserve the locale",()=>{
 for(const lang of LOCALE_IDS){
  for(const path of ["/tools/","/tools/nation-dungeons/"]){
   assert.equal(catalogPath(lang,path),localePrefix(lang)+path);
   assert.equal(languageDestination({lang,path:"/pt-br"+path}),localePrefix(lang)+path);
  }
 }
 const header=read("src/components/Header.astro");
 assert.ok(header.includes("|| isNationCalendar"));
 const calendar=read("src/components/NationDungeonCalendarPage.astro");
 for(const token of ["atlantica.nd-calendar.v1","atlantica.nd-view.v1",'searchParams.get("plan")','searchParams.set("plan",encoded)',"expandNationRuns(plan","availabilityAt(epoch,name,runs,plan)"])assert.ok(calendar.includes(token),token);
});
