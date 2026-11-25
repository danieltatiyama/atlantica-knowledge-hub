import {TALENT_GROUPS,talentRows} from './main-talent-source.mjs';
const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
export function emptyTalentPlan(group='STF'){
 return validateTalentPlan({version:1,group,characterLevel:180,budget:0,levels:{}});
}
export function validateTalentPlan(p){
 if(!p||p.version!==1||!TALENT_GROUPS.some(g=>g.id===p.group)||!integer(p.characterLevel,1,1000)||!integer(p.budget,0,100000)||!p.levels||typeof p.levels!=='object'||Array.isArray(p.levels))throw Error('Invalid talent plan');
 const rows=new Map(talentRows(p.group).map(r=>[r[0],r])),levels={};
 for(const [id,n] of Object.entries(p.levels)){const r=rows.get(id);if(!r||!integer(n,0,r[4]))throw Error('Invalid talent level');if(n)levels[id]=n;}
 return {version:1,group:p.group,characterLevel:p.characterLevel,budget:p.budget,levels};
}
export function summarizeTalentPlan(plan){
 const p=validateTalentPlan(plan),rows=talentRows(p.group);let spent=0;const belowLevel=[];
 for(const [id,,need,,,cost] of rows){const n=p.levels[id]??0;spent+=n*cost;if(n&&p.characterLevel<need)belowLevel.push(id);}
 return {spent,remaining:p.budget-spent,capacity:rows.reduce((n,r)=>n+r[4]*r[5],0),belowLevel,withinBudget:spent<=p.budget};
}
export function encodeTalentPlan(plan){
 const p=validateTalentPlan(plan);
 return ['v1',p.group,p.characterLevel,p.budget,...talentRows(p.group).flatMap((r,i)=>p.levels[r[0]]?[i+'.'+p.levels[r[0]]]:[])].join('~');
}
export function decodeTalentPlan(raw){
 if(typeof raw!=='string'||raw.length>300||!/^v1~[A-Z]+~\d+~\d+(?:~\d+\.\d+)*$/.test(raw))throw Error('Invalid talent link');
 const [,group,level,budget,...rest]=raw.split('~'),p=emptyTalentPlan(group),rows=talentRows(group),seen=new Set();
 p.characterLevel=Number(level);p.budget=Number(budget);
 for(const entry of rest){const [i,n]=entry.split('.').map(Number);if(!integer(i,0,rows.length-1)||seen.has(i))throw Error('Invalid talent link');seen.add(i);p.levels[rows[i][0]]=n;}
 return validateTalentPlan(p);
}
