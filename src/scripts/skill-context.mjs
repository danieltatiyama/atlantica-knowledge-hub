import {contextText} from '../i18n/skill-context-ui.mjs';
export const CONTEXT_FIELDS=['Category','EndowedObj','Reach','Grid','SelfMagicKind','SelfMagicGrade','CHANGEMAGIC','CHANGETURN','ActCondAP','ActCondMaxHP(%)','ActCondMinHP(%)','BF_GridMax','BF_MagicRange','Physical_Hit'];
export const OVERVIEW_FIELDS=['MagicType','Category','EndowedObj','Grid','Reach','MaxBookSkillLevel','MaxTotalSkillLevel','MotionProbability','MotionProbabilityInc*10','Probability','ProbabilityInc*10'];
const modes=['Magic','MagicPVP','MagicPVPBattleGround','BF_Magic','BF_MagicPvP','BF_MagicPvPLeague'];
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
export function joinSkillContext(base,extra){
 need(base.schemaVersion===1&&extra.schemaVersion===1&&base.scope===extra.scope&&base.scope==='expanded-reference-candidate','Mixed context snapshot');
 need(JSON.stringify(extra.columns)===JSON.stringify(CONTEXT_FIELDS)&&!CONTEXT_FIELDS.some(k=>base.columns.includes(k)),'Invalid context schema');
 need(Array.isArray(extra.dictionary)&&extra.dictionary.every(r=>Array.isArray(r)&&r.length===CONTEXT_FIELDS.length&&r.every(v=>typeof v==='string')),'Invalid context dictionary');
 const output={};
 for(const m of modes){const a=base.modes[m],b=extra.modes[m];need(Array.isArray(b)&&a.length===b.length,'Missing context records');output[m]=a.map((r,i)=>{const x=b[i];need(Array.isArray(x)&&x.length===5&&r.slice(0,4).every((v,j)=>v===x[j]),'Mismatched context identity');const index=x[4];need(Number.isSafeInteger(index)&&index>=0&&index<extra.dictionary.length,'Invalid dictionary index');return [...r,...extra.dictionary[index]];});}
 return {...base,columns:[...base.columns,...CONTEXT_FIELDS],modes:output};
}
export function comboReferences(context,skills){
 const kinds=new Map();for(const s of skills){const a=kinds.get(s.magicKind)??[];a.push(s);kinds.set(s.magicKind,a);}
 const lines=new Set();need(Array.isArray(context.combos),'Missing combination records');
 return context.combos.map(r=>{need(Array.isArray(r)&&r.length===4&&Number.isSafeInteger(r[0])&&r[0]>0&&!lines.has(r[0]),'Invalid combo line');lines.add(r[0]);const entries=r.slice(1).map(k=>{const a=kinds.get(k);need(a?.length===1,'Unknown or ambiguous combination identity');return a[0];});return {line:r[0],original:entries[0],added:entries[1],result:entries[2]};});
}
export function combosForSkill(combos,kind){return combos.filter(c=>[c.original,c.added,c.result].some(s=>s.magicKind===kind));}
export function mountComboReference(parent,combos,skill,lang,href){
 const matches=combosForSkill(combos,skill.magicKind);if(!matches.length)return;
 const t=contextText(lang),el=(tag,txt)=>{const e=document.createElement(tag);if(txt!=null)e.textContent=String(txt);return e;};
 const section=el('section');section.append(el('h2',t.combos),el('p',t.note));
 const wrap=el('div');wrap.className='ref-table-wrap';const table=el('table'),head=el('thead'),hr=el('tr');for(const k of ['original','added','result','source']){const h=el('th',t[k]);h.scope='col';hr.append(h);}head.append(hr);table.append(head);const body=el('tbody');
 for(const row of matches){const tr=el('tr');for(const key of ['original','added','result']){const s=row[key],cell=el('td'),a=el('a',s.name);a.href=href(s.skillIndex);if(s.magicKind===skill.magicKind)a.setAttribute('aria-current','page');cell.append(a);tr.append(cell);}tr.append(el('td','ComboMagicCheck.ndt #'+row.line));body.append(tr);}table.append(body);wrap.append(table);section.append(wrap);parent.append(section);
}
