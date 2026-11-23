/**
 * Nation dungeon scheduling model. All runs are stored as server-local reset
 * dates + minute offsets, not hardcoded PST UTC offsets. IANA conversion
 * handles seasonal Los Angeles / viewer timezone changes.
 * A scheduled run during cooldown is marked conflicting, not executed.
 */
export const SERVER_TIME_ZONE="America/Los_Angeles";
export const RESET_HOUR=6;
export const DUNGEON_COOLDOWNS_HOURS=Object.freeze({
  Avalon:60,Babel:20,Yggdrasil:40,Alcatraz:40,Pirate:20,
});
const validDate=value=>{
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+"T00:00:00Z");
  return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;
};
export const addCalendarDays=(date,delta)=>{
  if(!validDate(date)||!Number.isSafeInteger(delta))throw new RangeError("Invalid calendar day");
  return new Date(Date.parse(date+"T00:00:00Z")+delta*86400000).toISOString().slice(0,10);
};
const formatCache=new Map();
export function zonedParts(epoch,timeZone){
  if(!formatCache.has(timeZone)){
    formatCache.set(timeZone,new Intl.DateTimeFormat("en-GB",{
      timeZone,year:"numeric",month:"2-digit",day:"2-digit",
      hour:"2-digit",minute:"2-digit",hourCycle:"h23",
    }));
  }
  const map=Object.fromEntries(formatCache.get(timeZone).formatToParts(new Date(epoch))
    .filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return {date:map.year+"-"+map.month+"-"+map.day,
    hour:Number(map.hour),minute:Number(map.minute)};
}
export function zonedWallToEpoch(date,hour,minute,timeZone){
  if(!validDate(date)||!Number.isInteger(hour)||hour<0||hour>23||
     !Number.isInteger(minute)||minute<0||minute>59)throw new RangeError("Invalid local time");
  const [year,month,day]=date.split("-").map(Number);
  const wanted=Date.UTC(year,month-1,day,hour,minute);
  let epoch=wanted;
  for(let attempt=0;attempt<5;attempt++){
    const parts=zonedParts(epoch,timeZone);
    const actual=Date.UTC(...parts.date.split("-").map(Number).map((v,i)=>i===1?v-1:v),
      parts.hour,parts.minute);
    const diff=wanted-actual;
    if(diff===0)break;
    epoch+=diff;
  }
  const result=zonedParts(epoch,timeZone);
  if(result.date!==date||result.hour!==hour||result.minute!==minute)return null;
  // Repeated fall-back wall clock: choose the first occurrence deterministically.
  const earlier=zonedParts(epoch-3600000,timeZone);
  if(earlier.date===date&&earlier.hour===hour&&earlier.minute===minute)epoch-=3600000;
  return epoch;
}
export function serverRunEpoch(serverDate,offsetMinutes){
  if(!validDate(serverDate)||!Number.isSafeInteger(offsetMinutes)||
     offsetMinutes<0||offsetMinutes>=1440)throw new RangeError("Invalid reset offset");
  const fictive=Date.parse(serverDate+"T06:00:00Z")+offsetMinutes*60000;
  const d=new Date(fictive);
  return zonedWallToEpoch(d.toISOString().slice(0,10),d.getUTCHours(),d.getUTCMinutes(),
    SERVER_TIME_ZONE);
}
export function validateNationPlan(value){
  if(!value||value.version!==1||!Array.isArray(value.rules)||value.rules.length>500||
     !value.cooldowns||typeof value.cooldowns!=="object")
    throw Error("Invalid nation plan structure");
  const cooldowns={};
  for(const key of Object.keys(DUNGEON_COOLDOWNS_HOURS)){
    const h=Number(value.cooldowns[key]);
    if(!Number.isSafeInteger(h)||h<1||h>240)throw Error("Invalid cooldown "+key);
    cooldowns[key]=h;
  }
  const known=new Set(),rules=[];
  for(const row of value.rules){
    if(!row||typeof row.id!=="string"||!/^[-\w]{1,80}$/.test(row.id)||
      known.has(row.id)||!Object.hasOwn(DUNGEON_COOLDOWNS_HOURS,row.dungeon)||
      !Number.isSafeInteger(row.offsetMinutes)||row.offsetMinutes<0||row.offsetMinutes>=1440||
      !["normal","fixed"].includes(row.type))throw Error("Invalid nation run");
    known.add(row.id);
    if(row.type==="normal"&&!validDate(row.serverDate))throw Error("Invalid normal run date");
    if(row.type==="fixed"&&(!Number.isInteger(row.weekday)||row.weekday<0||row.weekday>6))
      throw Error("Invalid fixed run weekday");
    rules.push(row.type==="normal"?
      {id:row.id,type:row.type,dungeon:row.dungeon,serverDate:row.serverDate,
        offsetMinutes:row.offsetMinutes}:
      {id:row.id,type:row.type,dungeon:row.dungeon,weekday:row.weekday,
        offsetMinutes:row.offsetMinutes});
  }
  return {version:1,cooldowns,rules};
}
export const emptyNationPlan=()=>({version:1,
  cooldowns:{...DUNGEON_COOLDOWNS_HOURS},rules:[]});
export function expandNationRuns(plan,{startDate,days,timeZone="America/Los_Angeles"}){
  const safe=validateNationPlan(plan);
  if(!validDate(startDate)||!Number.isInteger(days)||days<1||days>31)
    throw Error("Invalid viewing period");
  const startEpoch=zonedWallToEpoch(startDate,12,0,timeZone)-12*3600000;
  const endEpoch=zonedWallToEpoch(addCalendarDays(startDate,days),12,0,timeZone)+12*3600000;
  const beginServer=zonedParts(startEpoch-9*86400000,SERVER_TIME_ZONE).date;
  const finalServer=zonedParts(endEpoch+2*86400000,SERVER_TIME_ZONE).date;
  const runs=[];
  for(const rule of safe.rules){
    if(rule.type==="normal"){
      const epoch=serverRunEpoch(rule.serverDate,rule.offsetMinutes);
      if(epoch!==null&&epoch>=startEpoch-9*86400000&&epoch<=endEpoch+86400000)
        runs.push({...rule,epoch,occurrence:rule.id+"@"+rule.serverDate});
    }else{
      for(let date=beginServer;date<=finalServer;date=addCalendarDays(date,1)){
        const weekday=new Date(date+"T00:00:00Z").getUTCDay();
        if(weekday!==rule.weekday)continue;
        const epoch=serverRunEpoch(date,rule.offsetMinutes);
        if(epoch!==null&&epoch>=startEpoch-9*86400000&&epoch<=endEpoch+86400000)
          runs.push({...rule,serverDate:date,epoch,occurrence:rule.id+"@"+date});
      }
    }
  }
  runs.sort((a,b)=>a.epoch-b.epoch||a.occurrence.localeCompare(b.occurrence));
  const readyAt=new Map();
  for(const run of runs){
    const ready=readyAt.get(run.dungeon)??-Infinity;
    run.accepted=run.epoch>=ready;
    run.readyAt=ready;
    if(run.accepted)readyAt.set(run.dungeon,run.epoch+safe.cooldowns[run.dungeon]*3600000);
  }
  return runs;
}
export function availabilityAt(epoch,dungeon,runs,plan){
  const safe=validateNationPlan(plan);
  if(!Object.hasOwn(safe.cooldowns,dungeon))throw Error("Unknown dungeon");
  let readyAt=-Infinity;
  for(const run of runs){
    if(run.epoch>epoch)break;
    if(run.dungeon===dungeon&&run.accepted)
      readyAt=run.epoch+safe.cooldowns[dungeon]*3600000;
  }
  return {ready:epoch>=readyAt,readyAt};
}
