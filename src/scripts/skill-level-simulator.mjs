// Player presentation derived from the client rows and user-supplied Excel formulas.
// Never mutate source rows or combine different conflict alternatives.
export const BUFF_FIELDS=['bTakeMP','EndowedAmount_SynCope','EndowedAmountInc_SynCope*10','EndowedAmount_Immune','EndowedAmount_ImmuneIncRaw'];
export const HIDDEN_FIELDS=new Set(['Probability','ProbabilityInc*10']);
export function joinBuffStats(data,extra){
 if(data.schemaVersion!==1||extra.schemaVersion!==1||data.scope!==extra.scope||JSON.stringify(extra.columns)!==JSON.stringify(BUFF_FIELDS)||BUFF_FIELDS.some(k=>data.columns.includes(k)))throw Error('Invalid buff snapshot');
 const modes={};
 for(const [mode,rows] of Object.entries(data.modes)){
  if(extra.sourceColumnByMode[mode]!== (mode==='Magic'?'EndowedAmount_ImmuneInc':'EndowedAmount_ImmuneInc*10'))throw Error('Invalid buff source field');
  const lines=new Set(rows.map(r=>r[2])),values=new Map();let previous=0;
  for(const run of extra.runs[mode]){
   const [a,b,...v]=run;
   if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<=previous||b<a||v.length!==5||!v.every(Number.isSafeInteger)||!v.some(Boolean))throw Error('Invalid buff run');
   for(let line=a;line<=b;line++){if(!lines.has(line))throw Error('Unknown buff source line');values.set(line,v.map(String));}previous=b;
  }
  modes[mode]=rows.map(r=>[...r,...(values.get(r[2])??['0','0','0','0','0'])]);
 }
 return {...data,columns:[...data.columns,...BUFF_FIELDS],modes};
}
const stat=(group,key,name,base,inc,div=1,baseDiv=1,unit='')=>({group,key,name,base,inc,div,baseDiv,unit});
export const STAT_GROUPS=[
 stat('effect','hp','HP Effect','EndowedAmount_HP','EndowedAmountInc_HP'),
 stat('effect','mp','MP Effect','EndowedAmount_MP','EndowedAmountInc_MP'),
 stat('effect','drain','HP Drain','TakeHP','TakeHPInc'),
 stat('effect','piercing','Piercing HP','Piercing_Amount_HP','Piercing_AmountInc_HP'),
 stat('attributes','str','STR','EndowedAmount_STR','EndowedAmountInc_STR*10',10),
 stat('attributes','dex','DEX','EndowedAmount_DEX','EndowedAmountInc_DEX*10',10),
 stat('attributes','vit','VIT','EndowedAmount_VIT','EndowedAmountInc_VIT*10',10),
 stat('attributes','int','INT','EndowedAmount_INT','EndowedAmountInc_INT*10',10),
 stat('combat','atk','ATK','EndowedAmount_ATT','EndowedAmountInc_ATT'),
 stat('combat','def','DEF','EndowedAmount_AC','EndowedAmountInc_AC*10',10),
 stat('combat','mdef','MDEF','EndowedAmount_MDEF','EndowedAmountInc_MDEF*10',10),
 stat('combat','accuracy','Accuracy','EndowedAmount_HitRate','EndowedAmountInc_HitRate*10',10),
 stat('combat','evasion','Evasion','EndowedAmount_EV','EndowedAmountInc_EV*10',10),
 stat('combat','multihit','Multi-hit','EndowedAmount_SeriesHitRate','EndowedAmountInc_SeriesHitRate*10',10),
 stat('combat','critical','Critical','EndowedAmount_Critical','EndowedAmountInc_Critical*10',10),
 stat('special','ap','AP Effect','EndowedAmount_ActivePower','EndowedAmountInc_ActivePower*10',10),
 stat('special','combo','Combo Count','EndowedAmount_SynCope','EndowedAmountInc_SynCope*10',10),
 stat('special','modifier','Damage Modifier','EndowedAmount_Immune','EndowedAmount_ImmuneIncRaw',10),
 stat('scaling','proc','Proc Chance','MotionProbability','MotionProbabilityInc*10',10,10,'%'),
 stat('scaling','scaling','ATK Scaling','EndowedAmount_AttackPowerDamageRate','EndowedAmountInc_AttackPowerDamageRate*100',100,1,'%'),
 stat('cost','mpcost','MP Cost','ConsMP','ConsIncMP'),
 stat('cost','duration','Duration','EndowedTurn','EndowedIncTurn*10',10)
];
const rawFields={
 effect:['bTakeMP'],
 cost:['ActivePower','CoolTime','MaxBookSkillLevel','MaxTotalSkillLevel'],
 target:['MagicType','Category','EndowedObj','Grid','Reach','SelfMagicKind','SelfMagicGrade','CHANGEMAGIC','CHANGETURN','ActCondAP','ActCondMaxHP(%)','ActCondMinHP(%)','BF_GridMax','BF_MagicRange','Physical_Hit']
};
export const GROUP_ORDER=['effect','attributes','combat','special','scaling','cost','target','other'];
const num=v=>typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'&&/^[+-]?\d+(?:\.\d+)?$/.test(v.trim())?Number(v):null;
const present=v=>v!==null&&v!==undefined&&v!==''&&v!=='NULL'&&v!=='FALSE'&&(num(v)===null||num(v)!==0);
const precision=v=>Number(v.toFixed(8));
export function validLevel(raw){return typeof raw==='string'&&/^\d+$/.test(raw)&&Number(raw)>=1&&Number(raw)<=1000?Number(raw):null;}
export function buildPlayerRows(matrix,columns,level){
 if(!Number.isSafeInteger(level)||level<1||level>1000)throw Error('Invalid level');
 const get=(r,f)=>r[columns.indexOf(f)],result=[],used=new Set(HIDDEN_FIELDS);
 function row(group,key,field,kind,unit,compute){
  const values=matrix.columns.map(c=>c.rows.map(r=>({value:compute(r,c.source),line:r[2],aboveCap:kind==='total'&&num(get(r,'MaxTotalSkillLevel'))>0&&level>num(get(r,'MaxTotalSkillLevel'))})));
  if(values.flat().some(v=>present(v.value)))result.push({group,key,field,kind,unit,values});
 }
 for(const s of STAT_GROUPS){
  used.add(s.base);used.add(s.inc);
  const base=(r)=>{const v=num(get(r,s.base));return v===null?null:precision(v/s.baseDiv);};
  const inc=(r,mode)=>{const v=num(get(r,s.inc));return v===null?null:precision(v/(s.key==='modifier'&&mode==='Magic'?1:s.div));};
  row(s.group,s.key,s.base,'base',s.unit,base);
  row(s.group,s.key,s.inc,'increment',s.unit,inc);
  const hasIncrement=matrix.columns.some(c=>c.rows.some(r=>present(get(r,s.inc))));
  if(hasIncrement)row(s.group,s.key,s.base,'total',s.unit,(r,mode)=>{
   const b=base(r),i=inc(r,mode);
   if(b===null||i===null||(s.key==='modifier'&&mode==='Magic'&&i!==0))return null;
   return precision(b+i*(level-1));
  });
 }
 for(const [group,fields] of Object.entries(rawFields))for(const field of fields){used.add(field);row(group,field,field,'raw','',(r)=>get(r,field));}
 for(const field of columns.slice(4))if(!used.has(field))row('other',field,field,'raw','',(r)=>get(r,field));
 return result.sort((a,b)=>GROUP_ORDER.indexOf(a.group)-GROUP_ORDER.indexOf(b.group));
}
export function defaultSkillLevel(matrix,columns){
 const idx=columns.indexOf('MaxTotalSkillLevel');
 return Math.max(1,...matrix.columns.flatMap(c=>c.rows.map(r=>num(r[idx])??0)).filter(n=>Number.isSafeInteger(n)&&n<=1000));
}
// Keep the normal slider range tied to the selected grade, but include a
// deliberately typed above-cap preview without silently clipping it.
export function skillSliderMax(matrix,columns,level){
 const cap=defaultSkillLevel(matrix,columns);
 return Math.max(cap,Number.isSafeInteger(level)&&level>=1&&level<=1000?level:1);
}
export function skillRowLabel(row,lang,fallback){
 const pt=lang==='pt-br',s=STAT_GROUPS.find(s=>s.key===row.key);
 if(!s)return ({bTakeMP:pt?'MP Drain (parâmetro bruto)':'MP Drain (raw parameter)',ActivePower:'AP Cost',CoolTime:pt?'Recarga':'Cooldown'})[row.field]??fallback(row.field);
 if(s.key==='proc')return {base:'Proc Base %',increment:'Proc Chance Increase / Level',total:'Proc Chance Total %'}[row.kind];
 if(s.key==='scaling')return {base:'Base Atk Scaling (%)',increment:'Atk % Scaling Per Level',total:'Atk Scaling Total (%)'}[row.kind];
 const names={hp:'Efeito de HP',mp:'Efeito de MP',drain:'Dreno de HP',piercing:'HP perfurante',accuracy:'Precisão',evasion:'Evasão',multihit:'Multi-hit',critical:'Crítico',ap:'Efeito de AP',combo:'Combo Count',modifier:'Modificador de dano',mpcost:'Custo de MP',duration:'Duração'};
 const name=pt?(names[s.key]??s.name):s.name;
 return name+(row.kind==='base'?(pt?' (base)':' (base)'):row.kind==='increment'?(pt?' / nível':' / level'):(pt?' — Total':' — Total'))+(s.key==='modifier'&&row.kind==='increment'?(pt?' (PvE bruto)':' (PvE raw)'):'');
}
