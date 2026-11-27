// Exact decimal comparison avoids rounding large Gold values through Number.
const missing=/^(?:|—|–|-|n\/?a|null|undefined|not found)$/i;
const formats=new Map();
function separators(locale){
 if(!formats.has(locale)){
  const p=new Intl.NumberFormat(locale).formatToParts(12345.6);
  formats.set(locale,{group:p.find(x=>x.type==='group')?.value??',',decimal:p.find(x=>x.type==='decimal')?.value??'.'});
 }
 return formats.get(locale);
}
export const isMissingSortValue=value=>value===null||value===undefined||missing.test(String(value).trim());
export function sortNumber(value,locale='en'){
 if(isMissingSortValue(value))return null;
 let s=String(value).trim().replace(/\u2212/g,'-');
 if(typeof value==='string'){
  const {group,decimal}=separators(locale);
  s=s.replace(/^(?:R\$|\$|€|₩|¥|#)\s*/,'').replace(/%$/,'').trim();
  // Only complete numeric cells are interpreted, never damage ranges or formulas.
  if(group!==decimal&&s.includes(group)){
   const integer=s.replace(/^[+-]/,'').split(decimal)[0].split(group);
   if(!/^\d{1,3}$/.test(integer[0])||integer.slice(1).some(x=>!/^\d{3}$/.test(x)))return null;
   s=s.split(group).join('');
  }
  s=s.replace(/[\s\u00a0\u202f]/g,'');
  if(decimal!=='.')s=s.split(decimal).join('.');
 }
 const m=/^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
 if(!m)return null;
 const exponent=Number(m[4]??0);if(!Number.isInteger(exponent)||Math.abs(exponent)>1000)return null;
 return {coefficient:BigInt((m[1]==='-'?'-':'')+m[2]+(m[3]??'')),scale:(m[3]?.length??0)-exponent};
}
export function compareSortNumbers(a,b){
 const scale=Math.max(a.scale,b.scale);
 const left=a.coefficient*10n**BigInt(scale-a.scale),right=b.coefficient*10n**BigInt(scale-b.scale);
 return left<right?-1:left>right?1:0;
}
export function sortRecords(rows,value,{direction='ascending',type='auto',locale='en'}={}){
 const decorated=rows.map((row,index)=>{const v=value(row);return {row,index,value:v,number:sortNumber(v,locale),missing:isMissingSortValue(v)};});
 const numeric=type==='number'||(type==='auto'&&decorated.some(x=>!x.missing)&&decorated.every(x=>x.missing||x.number));
 const collator=new Intl.Collator(locale,{numeric:true,sensitivity:'base'}),sign=direction==='descending'?-1:1;
 decorated.sort((a,b)=>{
  const am=a.missing||(numeric&&!a.number),bm=b.missing||(numeric&&!b.number);
  if(am||bm)return am===bm?a.index-b.index:am?1:-1;
  const result=numeric?compareSortNumbers(a.number,b.number):collator.compare(String(a.value),String(b.value));
  return sign*result||a.index-b.index;
 });
 return decorated.map(x=>x.row);
}
