import {AWAKENING_ROWS,AWAKENING_TABS,AWAKENING_ITEM_BONUS_CAPS} from "./awakening-source.mjs";
const maxBudget=100000;
const byId=new Map(AWAKENING_ROWS.map(r=>[r[0],r]));
const validInteger=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function emptyAwakeningPlan(){return {version:1,budgets:[0,0,0,0],levels:{}};}
export function validateAwakeningPlan(plan){
 if(!plan||plan.version!==1||!Array.isArray(plan.budgets)||plan.budgets.length!==4||!plan.budgets.every(n=>validInteger(n,0,maxBudget))||!plan.levels||typeof plan.levels!=="object"||Array.isArray(plan.levels))throw Error("Invalid Awakening plan");
 const levels={};
 for(const [id,n] of Object.entries(plan.levels)){
   const row=byId.get(id);if(!row||!validInteger(n,0,row[3]))throw Error("Invalid Awakening level");
   if(n)levels[id]=n;
 }
 return {version:1,budgets:[...plan.budgets],levels};
}
export function summarizeAwakeningPlan(plan){
 const p=validateAwakeningPlan(plan);
 const tabs=AWAKENING_TABS.map((name,i)=>({name,budget:p.budgets[i],spent:0,capacity:0,itemBonusCap:AWAKENING_ITEM_BONUS_CAPS[i]}));
 for(const [id,tab,,max,cost] of AWAKENING_ROWS){
   tabs[tab].spent+=(p.levels[id]??0)*cost;
   tabs[tab].capacity+=max*cost;
 }
 for(const tab of tabs)tab.remaining=tab.budget-tab.spent;
 return {tabs,spent:tabs.reduce((n,t)=>n+t.spent,0),budget:tabs.reduce((n,t)=>n+t.budget,0),valid:tabs.every(t=>t.remaining>=0)};
}
export function encodeAwakeningPlan(plan){
 const p=validateAwakeningPlan(plan);
 return [p.budgets.join("."),...AWAKENING_ROWS.flatMap((r,i)=>p.levels[r[0]]?[i+"."+p.levels[r[0]]]:[])].join("~");
}
export function decodeAwakeningPlan(raw){
 if(typeof raw!=="string"||raw.length>400||!/^\d+(?:\.\d+){3}(?:~\d+\.\d+)*$/.test(raw))throw Error("Invalid Awakening link");
 const [head,...rest]=raw.split("~"),p=emptyAwakeningPlan();p.budgets=head.split(".").map(Number);
 const seen=new Set();
 for(const part of rest){const [i,n]=part.split(".").map(Number);if(!validInteger(i,0,AWAKENING_ROWS.length-1)||seen.has(i))throw Error("Invalid Awakening link");seen.add(i);p.levels[AWAKENING_ROWS[i][0]]=n;}
 return validateAwakeningPlan(p);
}
