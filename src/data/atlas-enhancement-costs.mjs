import data from './atlas-enhancement-costs.json' with {type:'json'};
export const ATLAS_COST_DATA=data;
export function aoDayAtlasCost(base){
 if(!Number.isSafeInteger(base)||base<0)return null;
 return Number((BigInt(base)*3n+3n)/4n);
}
export function atlasEnhancementCosts(itemId,name,grade){
 if(!Number.isInteger(grade)||grade<0||grade>10)return null;
 const item=data.items[String(itemId)];
 if(!item||item.name!==name)return null;
 if(item.profile==='apocalyptic-projection'){
  const anchor=data.apocalypticProjection,powerBlocked=grade<6,safeBlocked=true;
  if(!anchor.allowedGrades.includes(grade))return {power:null,safe:null,aoPower:null,aoSafe:null,powerBlocked,safeBlocked,projection:true,aoObserved:false,profile:item.profile};
  const curve=data.profiles[anchor.shapeProfile].power;
  const power=Math.round(anchor.anchorBasePower*curve[grade]/curve[anchor.anchorGrade]);
  const alternatives=Object.values(data.profiles).map(p=>Math.round(anchor.anchorBasePower*p.power[grade]/p.power[anchor.anchorGrade]));
  return {power,safe:null,aoPower:aoDayAtlasCost(power),aoSafe:null,powerBlocked,safeBlocked,projection:true,aoObserved:String(itemId)===anchor.anchorItemId&&grade===anchor.anchorGrade,profile:item.profile,powerRange:[Math.min(...alternatives),Math.max(...alternatives)],aoPowerRange:[aoDayAtlasCost(Math.min(...alternatives)),aoDayAtlasCost(Math.max(...alternatives))]};
 }
 if(grade===10)return null;
 const profile=data.profiles[item.profile],power=profile.power[grade],safe=profile.safe[grade];
 if(!Number.isSafeInteger(power)||!Number.isSafeInteger(safe))return null;
 const observed=data.observations.find(r=>r.id===String(itemId)&&r.grade===grade);
 return {power,safe,aoPower:aoDayAtlasCost(power),aoSafe:aoDayAtlasCost(safe),source:profile.source,aoObserved:!!observed,profile:item.profile,projection:false,powerBlocked:false,safeBlocked:false};
}
