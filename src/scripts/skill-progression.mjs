// Additive, source-aligned reference; never rewrite the pinned mode dataset.
export const MODES=['Magic','MagicPVP','MagicPVPBattleGround','BF_Magic','BF_MagicPvP','BF_MagicPvPLeague'];
export const MODE_LABELS=['PvE / Normal','PvP / FL','PvP / Colosseum','TBS','TBS PvP','TBS League'];
const EXPECTED=['MagicType','MaxBookSkillLevel','MaxTotalSkillLevel','Probability','ProbabilityInc*10','MotionProbability','MotionProbabilityInc*10','EndowedAmount_AttackPowerDamageRate','EndowedAmountInc_AttackPowerDamageRate*100','ConsIncMP','EndowedIncTurn*10','EndowedAmount_ATT','EndowedAmountInc_ATT','EndowedAmount_AC','EndowedAmountInc_AC*10','EndowedAmount_STR','EndowedAmountInc_STR*10','EndowedAmount_DEX','EndowedAmountInc_DEX*10','EndowedAmount_VIT','EndowedAmountInc_VIT*10','EndowedAmount_INT','EndowedAmountInc_INT*10','EndowedAmount_HitRate','EndowedAmountInc_HitRate*10','EndowedAmount_EV','EndowedAmountInc_EV*10','EndowedAmount_SeriesHitRate','EndowedAmountInc_SeriesHitRate*10','EndowedAmount_Critical','EndowedAmountInc_Critical*10','Piercing_Amount_HP','Piercing_AmountInc_HP','TakeHP','TakeHPInc','EndowedAmount_MP','EndowedAmountInc_MP','EndowedAmount_ActivePower','EndowedAmountInc_ActivePower*10'];
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
export function joinProgression(base,extra){
 need(base.schemaVersion===1&&extra.schemaVersion===1&&base.scope===extra.scope&&extra.scope==='expanded-reference-candidate','Mixed progression snapshot');
 need(JSON.stringify(extra.columns)===JSON.stringify(EXPECTED)&&!EXPECTED.some(k=>base.columns.includes(k)),'Unexpected progression schema');
 const modes={};
 for(const mode of MODES){
  const a=base.modes[mode],b=extra.modes[mode];need(a.length===b.length,'Missing progression records');
  modes[mode]=a.map((r,i)=>{
   const x=b[i];need(x.length===6&&r.slice(0,4).every((v,j)=>v===x[j])&&typeof x[4]==='string'&&Array.isArray(x[5]),'Mismatched progression identity');
   const vals=Array(EXPECTED.length).fill('0');vals[0]=x[4];let last=0;
   for(const pair of x[5]){const [idx,value]=pair;need(pair.length===2&&Number.isInteger(idx)&&idx>last&&idx<vals.length&&typeof value==='string'&&value!=='0','Invalid sparse field');vals[idx]=value;last=idx;}
   return [...r,...vals];
  });
 }
 return {...base,columns:[...base.columns,...extra.columns],modes};
}
export function modeGradeSeries(data,kind,mode,field){
 need(MODES.includes(mode)&&data.columns.indexOf(field)>=4,'Invalid progression selection');
 const idx=data.columns.indexOf(field), groups=new Map();
 for(const r of data.modes[mode])if(r[0]===kind){const g=groups.get(r[1])??[];g.push(r);groups.set(r[1],g);}
 return [...groups].sort((a,b)=>a[0]-b[0]).map(([grade,rows])=>({grade,values:[...new Set(rows.map(r=>r[idx]))],lines:rows.map(r=>r[2]),conflict:rows.some(r=>r[3]===1)}));
}
// Historically corroborated narrow rules. No general probability conversion or cap.
const RULES={
 MAGIC_ARTHUREX:{proc:{base:'MotionProbability',increment:'MotionProbabilityInc*10',divisor:10,incrementDivisor:10,unit:'%'}},
 MAGIC_REAPERSILENCE:{proc:{base:'MotionProbability',increment:'MotionProbabilityInc*10',divisor:10,incrementDivisor:10,unit:'%'},mdef:{base:'EndowedAmount_MDEF',increment:'EndowedAmountInc_MDEF*10',divisor:1,incrementDivisor:10,unit:''}}
};
export function historicalProjection(data,kind,grade,mode,level,effect){
 // Community evidence is PvE only. Do not silently extrapolate to other modes.
 if(mode!=='Magic'||!Number.isInteger(level)||level<1)return null;
 const rule=RULES[kind]?.[effect];if(!rule)return null;
 const rows=data.modes[mode].filter(r=>r[0]===kind&&r[1]===grade);
 if(!rows.length||rows.some(r=>r[3]===1))return null;
 const get=k=>rows[0][data.columns.indexOf(k)];
 const cap=Number(get('MaxTotalSkillLevel'));if(!Number.isSafeInteger(cap)||level>cap)return null;
 const base=Number(get(rule.base)),inc=Number(get(rule.increment));if(!Number.isFinite(base)||!Number.isFinite(inc))return null;
 const value=Number((base/rule.divisor+(level-1)*inc/rule.incrementDivisor).toFixed(4));
 return {value,unit:rule.unit,cap,status:'historically-corroborated-estimate',sourceLine:rows[0][2]};
}
export function sampleLevels(cap){return Number.isSafeInteger(cap)&&cap>0&&cap<=1000?[...new Set([1,...Array.from({length:Math.floor(cap/10)},(_,i)=>(i+1)*10),cap])].sort((a,b)=>a-b):[];}
export const projectionEffects=kind=>Object.keys(RULES[kind]??{});

// UI helpers are independent of the existing reference renderer.
import {progressionText,progressionField} from '../i18n/skill-progression-ui.mjs';
export function mountSkillProgression(parent,data,skill,selectedGrade,lang,labels,{gradeOnly=false}={}){
 const t=progressionText(lang),kind=skill.magicKind;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);return n;};
 const select=(options,label)=>{const wrapper=el('label',label);const input=el('select');for(const [value,name] of options){const o=el('option',name);o.value=value;input.append(o);}wrapper.append(input);return [wrapper,input];};
 const table=(target,heads,rows)=>{const wrap=el('div');wrap.className='ref-table-wrap';const tb=el('table'),thead=el('thead'),tr=el('tr');for(const h of heads){const th=el('th',h);th.scope='col';tr.append(th);}thead.append(tr);tb.append(thead);const body=el('tbody');for(const row of rows){const tr=el('tr');row.forEach((v,i)=>{const cell=el(i?'td':'th',v);if(!i)cell.scope='row';tr.append(cell);});body.append(tr);}tb.append(body);wrap.append(tb);target.append(wrap);};
 const section=el('section');section.append(el('h2',t.title));section.append(el('p',t.parameterNote));
 const relevant=data.columns.slice(4).filter((f,i)=>!['Probability','ProbabilityInc*10'].includes(f)&&MODES.some(m=>data.modes[m].some(r=>r[0]===kind&&r[i+4]!=='0'&&r[i+4]!==''&&r[i+4]!=='NULL')));
 if(!relevant.length){section.append(el('p',t.unavailable));parent.append(section);return;}
 const [fieldLabel,field]=select(relevant.map(f=>[f,progressionField(f,lang,labels)]),t.attribute);
 field.value=relevant.includes('MotionProbability')&&projectionEffects(kind).includes('proc')?'MotionProbability':relevant.includes('EndowedAmount_HP')?'EndowedAmount_HP':relevant[0];
 section.append(fieldLabel);const gradeBody=el('div');gradeBody.className='ref-mode-matrix';section.append(gradeBody);
 function renderGrade(){
  gradeBody.replaceChildren();const series=MODES.map(m=>new Map(modeGradeSeries(data,kind,m,field.value).map(r=>[r.grade,r]))),grades=[...new Set(series.flatMap(s=>[...s.keys()]))].sort((a,b)=>a-b);
  table(gradeBody,[t.grade,...MODE_LABELS],grades.map(g=>[g,...series.map(s=>{const row=s.get(g);return row?row.values.join(' / ')+(row.conflict?' ⚠ (#'+row.lines.join(', #')+')':''):'—';})]));
 }
 field.addEventListener('change',renderGrade);renderGrade();
 if(gradeOnly){parent.append(section);return;}
 const effects=projectionEffects(kind);if(!effects.length){section.append(el('p',t.unavailable));parent.append(section);return;}
 section.append(el('h3',t.projection),el('p',t.estimate));const [effectLabel,effectSelect]=select(effects.map(e=>[e,t[e]]),t.attribute);section.append(effectLabel);
 const p=historicalProjection(data,kind,selectedGrade,'Magic',1,effects[0]);
 if(!p){section.append(el('p',t.unavailable));parent.append(section);return;}
 const levelLabel=el('label',t.selectLevel),level=el('input');level.type='number';level.min='1';level.max=String(p.cap);level.step='1';level.value=String(Math.min(60,p.cap));levelLabel.append(level);section.append(levelLabel);
 const projection=el('div');section.append(projection);
 const nf=new Intl.NumberFormat(lang,{maximumFractionDigits:4});
 function renderProjection(){
  projection.replaceChildren();const preview=historicalProjection(data,kind,selectedGrade,'Magic',level.valueAsNumber,effectSelect.value);if(!preview){projection.append(el('p',t.unavailable));return;}
  projection.append(el('p',t[effectSelect.value]+': '+nf.format(preview.value)+preview.unit+' · PvE · '+t.grade+' '+selectedGrade+' · '+t.level+' '+level.value));
  const levels=[...new Set([...sampleLevels(preview.cap),level.valueAsNumber])].sort((a,b)=>a-b);
  const rows=levels.map(n=>{const r=historicalProjection(data,kind,selectedGrade,'Magic',n,effectSelect.value);return [n,nf.format(r.value)+r.unit];});
  table(projection,[t.level,t[effectSelect.value]],rows);
  const source=el('a','Fandom — '+skill.name);source.href=kind==='MAGIC_ARTHUREX'?'https://atlantica.fandom.com/wiki/Sage_Sword_Excalibur':'https://atlantica.fandom.com/wiki/Silence_of_the_Grave';projection.append(source);
 }
 effectSelect.addEventListener('change',renderProjection);level.addEventListener('input',renderProjection);renderProjection();parent.append(section);
}
