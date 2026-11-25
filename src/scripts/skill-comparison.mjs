import {buildPlayerRows,defaultSkillLevel,skillLevelCaps,validLevel,validIntelligence,skillRowLabel,GROUP_ORDER,STAT_GROUPS} from './skill-level-simulator.mjs';
import {contextField,contextValue} from '../i18n/skill-context-ui.mjs';
import {progressionField} from '../i18n/skill-progression-ui.mjs';
import {levelText} from '../i18n/skill-level-ui.mjs';
import {comparisonText} from '../i18n/skill-comparison-ui.mjs';

// Independent projections, exact field identity, no combining source alternatives.
const identity=r=>r.group+':'+r.key+':'+r.kind;
const meaningful=v=>v!==null&&v!==undefined&&v!==''&&v!=='NULL'&&v!=='FALSE'&&!(typeof v==='number'&&v===0)&&!(typeof v==='string'&&/^[+-]?0+(?:\.0+)?$/.test(v.trim()));
const available=v=>v!==null&&v!==undefined&&v!==''&&v!=='NULL';
export function compareSkillRows(a,b,columns,{totalsOnly=true}={}){
 const compareInt=a.intelligence>0||b.intelligence>0;
 const sides=[a,b].map(x=>buildPlayerRows(x.matrix,columns,x.level,x.intelligence,{retainZero:true,compareInt}));
 const maps=sides.map(rows=>new Map(rows.map(r=>[identity(r),r])));
 const keys=[...new Set([...maps[0].keys(),...maps[1].keys()])];
 const union=keys.map(key=>{
  const meta=maps[0].get(key)??maps[1].get(key);
  return {...meta,values:maps.map(map=>map.get(key)?.values[0]??[])};
 });
 const byKey=new Map(union.map(r=>[identity(r),r]));
 const related=(r,kind)=>byKey.get(r.group+':'+r.key+':'+kind);
 const hasEffect=r=>r?.values.flat().some(x=>meaningful(x.value))??false;
 const hasIncrement=r=>hasEffect(related(r,'increment'));
 const hasComponent=r=>hasEffect(related(r,'base'))||hasIncrement(r);
 const completeTotal=r=>{
  const total=related(r,'total');
  if(!total)return false;
  return ['base','increment'].every(kind=>{
   const component=related(r,kind);
   return !component||component.values.every((cells,i)=>cells.every(v=>
    !available(v.value)||total.values[i].some(x=>x.line===v.line&&available(x.value))));
  });
 };
 const visible=union.filter(r=>{
  if(r.kind==='int-total')return compareInt&&(hasEffect(r)||hasEffect(related(r,'total')));
  if(r.kind==='total')return (hasEffect(r)||hasComponent(r))&&hasIncrement(r);
  if(!hasEffect(r))return false;
  if(totalsOnly&&(r.kind==='base'||r.kind==='increment')&&hasIncrement(r)&&completeTotal(r))return false;
  return true;
 });
 const rank=r=>STAT_GROUPS.findIndex(s=>s.key===r.key);
 const kindRank={base:0,increment:1,total:2,'int-total':3,raw:4};
 return visible.sort((a,b)=>GROUP_ORDER.indexOf(a.group)-GROUP_ORDER.indexOf(b.group)||
  (rank(a)<0?999:rank(a))-(rank(b)<0?999:rank(b))||
  (a.key===b.key?kindRank[a.kind]-kindRank[b.kind]:0));
}
export function availableSkillGrades(data,kind){
 return [...new Set(Object.values(data.modes).flatMap(rows=>rows.filter(r=>r[0]===kind).map(r=>r[1])))].sort((a,b)=>a-b);
}
export function comparisonDelta(row,conflicts=[false,false]){
 if(row.kind==='raw'||conflicts.some(Boolean)||row.values.some(c=>c.length!==1||typeof c[0].value!=='number'||!Number.isFinite(c[0].value)||c[0].aboveCap))return null;
 return Number((row.values[1][0].value-row.values[0][0].value).toFixed(8));
}
const el=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==null&&value!==undefined)e.textContent=String(value);if(cls)e.className=cls;return e;};
const opt=(value,label)=>{const e=el('option',label);e.value=String(value);return e;};
export function mountSkillComparison(parent,options){
 const {skills,lang}=options,ui=comparisonText(lang),params=new URL(location.href).searchParams;
 const detail=el('details',null,'ref-skill-compare');detail.append(el('summary',ui.title));
 detail.open=skills.some(x=>String(x.skillIndex)===params.get('compareSkillB'));parent.append(detail);
 let mounted=false;
 const ensure=()=>{if(detail.open&&!mounted){mounted=true;populateSkillComparison(detail,options);}};
 detail.addEventListener('toggle',ensure);ensure();
}
function populateSkillComparison(detail,{data,skills,primary,initialGrade,initialLevel,initialInt,modeNames,modeLabels,matrixFor,lang,labels,prefix}){
 const ui=comparisonText(lang),lt=levelText(lang),nf=new Intl.NumberFormat(lang,{maximumFractionDigits:4});
 const params=new URL(location.href).searchParams;
 const byId=new Map(skills.map(x=>[String(x.skillIndex),x]));
 const grades=new Map();
 const getGrades=skill=>{if(!grades.has(skill.magicKind))grades.set(skill.magicKind,availableSkillGrades(data,skill.magicKind));return grades.get(skill.magicKind);};
 const content=el('div');detail.append(content);
 content.append(el('p',ui.note,'ref-source'));
 const config=el('div',null,'ref-compare-options'),modeLabel=el('label',lt.modeSelection),mode=el('select');
 mode.replaceChildren(...modeNames.map((name,i)=>opt(name,modeLabels[i])));
 mode.value=modeNames.includes(params.get('compareMode'))?params.get('compareMode'):modeNames[0];modeLabel.append(mode);
 const totalLabel=el('label',null,'ref-view-check'),total=el('input');total.type='checkbox';total.checked=params.get('compareTotals')!=='0';
 totalLabel.append(total,el('span',lt.totalsOnly));config.append(modeLabel,totalLabel);content.append(config);
 const cards=el('div',null,'ref-compare-cards');content.append(cards);
 const output=el('div');content.append(output);
 const states=[];
 function fullMatrix(st){return st.skill&&st.grade!==null?matrixFor(data,st.skill.magicKind,st.grade):null;}
 function currentMatrix(st){const m=fullMatrix(st);return m?{columns:[m.columns[modeNames.indexOf(mode.value)]]}:null;}
 function maximum(st){const m=currentMatrix(st);return m?.columns[0]?.rows.length?defaultSkillLevel(m,data.columns):defaultSkillLevel(fullMatrix(st)??{columns:[]},data.columns);}
 function save(){
  const next=new URL(location.href);
  for(const st of states){
   const k=st.side;
   if(st.skill){
    next.searchParams.set('compareSkill'+k,String(st.skill.skillIndex));
    if(st.grade!==null)next.searchParams.set('compareGrade'+k,String(st.grade));else next.searchParams.delete('compareGrade'+k);
    next.searchParams.set('compareLevel'+k,String(st.level));next.searchParams.set('compareInt'+k,String(st.intelligence));
   }else for(const key of ['Skill','Grade','Level','Int'])next.searchParams.delete('compare'+key+k);
  }
  next.searchParams.set('compareMode',mode.value);next.searchParams.set('compareTotals',total.checked?'1':'0');
  history.replaceState(history.state,'',next.pathname+next.search+next.hash);
 }
 function changed(){save();render();}
 function makeSide(side){
  const fieldset=el('fieldset',null,'ref-compare-side');fieldset.append(el('legend',ui['side'+side]));cards.append(fieldset);
  const searchLabel=el('label',labels.search),search=el('input');search.type='search';search.autocomplete='off';searchLabel.append(search);
  const selectLabel=el('label',labels.skills),select=el('select');selectLabel.append(select);
  const gradeLabel=el('label',labels.grade),grade=el('select');gradeLabel.append(grade);
  const levelLabel=el('label',lt.level),level=el('input');level.type='text';level.inputMode='numeric';levelLabel.append(level);
  const intLabel=el('label',lt.intelligence),int=el('input');int.type='text';int.inputMode='numeric';intLabel.append(int);
  const max=el('button',lt.maxLevel,'ref-max-level');max.type='button';
  const caps=el('p',null,'ref-source'),warning=el('p',null,'ref-warning');warning.hidden=true;
  const open=el('a',ui.openSkill);
  const numbers=el('div',null,'ref-compare-numbers');numbers.append(gradeLabel,levelLabel,intLabel);
  fieldset.append(searchLabel,selectLabel,numbers,max,caps,warning,open);
  const explicit=byId.get(params.get('compareSkill'+side));
  const st={side,skill:explicit??(side==='A'?primary:null),grade:null,level:1,intelligence:validIntelligence(params.get('compareInt'+side))??(side==='A'&&!explicit?(validIntelligence(params.get('int'))??initialInt):0),select,gradeInput:grade,levelInput:level,intInput:int,max,caps,warning,open};
  states.push(st);
  function fill(){
   const q=search.value.trim().toLowerCase(),id=String(st.skill?.skillIndex??'');
   const matches=skills.filter(x=>String(x.skillIndex)===id||(x.name+' '+x.skillIndex+' '+x.magicKind).toLowerCase().includes(q));
   select.replaceChildren(opt('',ui.choose),...matches.map(x=>opt(x.skillIndex,x.name+' · '+x.skillIndex)));select.value=id;
  }
  function fillGrades(requested){
   const choices=st.skill?getGrades(st.skill):[];
   grade.replaceChildren(...choices.map(g=>opt(g,g)));
   st.grade=choices.includes(requested)?requested:choices.at(-1)??null;
   grade.value=st.grade===null?'':String(st.grade);
  }
  const g=params.get('compareGrade'+side),parsedGrade=g!==null&&/^\d+$/.test(g)?Number(g):null;
  fill();fillGrades(parsedGrade??(side==='A'&&!explicit?initialGrade:null));
  st.level=validLevel(params.get('compareLevel'+side))??(side==='A'&&!explicit?(validLevel(params.get('level'))??initialLevel??maximum(st)):maximum(st));
  level.value=String(st.level);int.value=String(st.intelligence);
  search.addEventListener('input',fill);
  select.addEventListener('change',()=>{st.skill=byId.get(select.value)??null;fillGrades(null);st.level=maximum(st);level.value=String(st.level);level.removeAttribute('aria-invalid');changed();});
  grade.addEventListener('change',()=>{const previous=maximum(st);st.grade=Number(grade.value);if(st.level===previous){st.level=maximum(st);level.value=String(st.level);}changed();});
  level.addEventListener('input',()=>{const n=validLevel(level.value);level.setAttribute('aria-invalid',String(n===null));if(n===null){warning.textContent=lt.invalid;warning.hidden=false;return;}st.level=n;changed();});
  int.addEventListener('input',()=>{const n=validIntelligence(int.value);int.setAttribute('aria-invalid',String(n===null));if(n===null){warning.textContent=lt.invalidInt;warning.hidden=false;return;}st.intelligence=n;changed();});
  max.addEventListener('click',()=>{st.level=maximum(st);level.value=String(st.level);level.removeAttribute('aria-invalid');changed();});
 }
 makeSide('A');makeSide('B');
 mode.addEventListener('change',changed);total.addEventListener('change',changed);
 function render(){
  for(const st of states){
   const m=currentMatrix(st),source=m?.columns[0],caps=skillLevelCaps(m??{columns:[]},data.columns);
   const hasGrade=st.grade!==null;
   st.gradeInput.disabled=!hasGrade;st.levelInput.disabled=!hasGrade;st.intInput.disabled=!hasGrade;st.max.disabled=!caps.total.length;
   st.caps.textContent=st.skill?(lt.books+': '+(caps.book.join(' / ')||'—')+' · '+lt.charms+': '+(caps.total.join(' / ')||'—')):'';
   const invalidLevel=validLevel(st.levelInput.value)===null,invalidInt=validIntelligence(st.intInput.value)===null;
   st.warning.hidden=!st.skill||(!invalidLevel&&!invalidInt&&Boolean(source?.rows.length));
   st.warning.textContent=invalidLevel?lt.invalid:invalidInt?lt.invalidInt:ui.noMode;
   st.open.hidden=!st.skill;
   if(st.skill){const p=new URLSearchParams({skill:String(st.skill.skillIndex),level:String(st.level),int:String(st.intelligence)});if(hasGrade)p.set('grade',String(st.grade));st.open.href=prefix+'/mercenaries/skills/?'+p.toString();}
  }
  output.replaceChildren();
  if(states.some(x=>!x.skill||x.grade===null)){output.append(el('p',ui.chooseBoth,'ref-source'));return;}
  const sides=states.map(st=>({matrix:currentMatrix(st),level:st.level,intelligence:st.intelligence}));
  const conflicts=sides.map(x=>x.matrix.columns[0].conflict);
  const rows=compareSkillRows(...sides,data.columns,{totalsOnly:total.checked});
  if(!rows.length){output.append(el('p',lt.noStats,'ref-source'));return;}
  const wrap=el('div',null,'ref-table-wrap ref-compare-table'),table=el('table'),thead=el('thead'),hr=el('tr');
  const headers=[labels.field,...states.map((st,i)=>st.skill.name+' · G'+st.grade+' · Lv '+st.level+(conflicts[i]?' ⚠':'')),ui.difference];
  for(const h of headers){const th=el('th',h);th.scope='col';hr.append(th);}
  thead.append(hr);table.append(thead);
  const fmt=field=>contextField(field,lang)??progressionField(field,lang,labels);
  const format=(r,x)=>!available(x.value)?'—':(typeof x.value==='number'?nf.format(x.value)+r.unit:String(contextValue(r.field,x.value,lang)))+(x.aboveCap?' *':'');
  for(const group of GROUP_ORDER){
   const groupRows=rows.filter(r=>r.group===group);if(!groupRows.length)continue;
   const body=el('tbody'),gr=el('tr',null,'ref-stat-group'),gh=el('th',lt[group]);gh.colSpan=4;gh.scope='rowgroup';gr.append(gh);body.append(gr);
   for(const r of groupRows){
    const tr=el('tr',null,r.kind==='total'||r.kind==='int-total'?'ref-stat-total':'');
    const th=el('th',skillRowLabel(r,lang,fmt));th.scope='row';tr.append(th);
    r.values.forEach((cells,i)=>{
     const td=el('td');
     if(!cells.length){td.textContent='—';td.className='ref-missing';}
     else if(conflicts[i]){td.className='ref-conflict-cell';for(const x of cells)td.append(el('span',format(r,x)+' · #'+x.line));}
     else td.textContent=[...new Set(cells.map(x=>format(r,x)))].join(' / ');
     tr.append(td);
    });
    const delta=comparisonDelta(r,conflicts);
    tr.append(el('td',delta===null?'—':(delta>0?'+':'')+nf.format(delta)+r.unit));body.append(tr);
   }
   table.append(body);
  }
  wrap.append(table);output.append(wrap,el('p',lt.intNote+' '+lt.notice,'ref-source'));
  const source=el('p',states.map((st,i)=>ui['side'+st.side]+': '+sides[i].matrix.columns[0].source+'.ndt '+(sides[i].matrix.columns[0].lines.map(n=>'#'+n).join(', ')||'—')).join(' · '),'ref-source');output.append(source);
 }
 render();
}
