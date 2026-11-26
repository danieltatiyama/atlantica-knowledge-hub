import {joinBuffStats,buildPlayerRows,defaultSkillLevel,skillSliderMax,skillLevelCaps,selectPreviewLevel,validLevel,validIntelligence,intelligenceBonusLevels,skillRowLabel,GROUP_ORDER,parseSkillModes,filterPlayerRows} from "./skill-level-simulator.mjs";
import {levelText} from "../i18n/skill-level-ui.mjs";
import {mountSkillComparison} from "./skill-comparison.mjs";
import {joinSkillContext,comboReferences,mountComboReference,OVERVIEW_FIELDS} from "./skill-context.mjs";
import {contextField,contextValue,contextText} from "../i18n/skill-context-ui.mjs";
import {joinProgression,mountSkillProgression} from "./skill-progression.mjs";
import {progressionField,progressionText} from "../i18n/skill-progression-ui.mjs";
const directory="/data/client-mercenaries/";
const modeNames=["Magic","MagicPVP","MagicPVPBattleGround","BF_Magic","BF_MagicPvP","BF_MagicPvPLeague"];
export const MODE_LABELS=["PvE / Normal","PvP / FL","PvP / Colosseum","TBS","TBS PvP","TBS League"];
export function buildModeMatrix(data,magicKind,grade){
  const columns=modeNames.map((source,i)=>{
    const rows=data.modes[source].filter(r=>r[0]===magicKind&&r[1]===grade);
    return {source,label:MODE_LABELS[i],lines:rows.map(r=>r[2]),conflict:rows.some(r=>r[3]===1),rows};
  });
  return {columns,fields:data.columns.slice(4).map((field,i)=>({field,values:columns.map(c=>c.rows.map(r=>r[i+4]))}))};
}
const stats=["Grade","Str","Dex","Vit","Intl","MinDmg","MaxDmg","AC","MagicDef","CriticalRate"];
const pvpFields=["PvPDamageRate","PvPDamageRevision","PvPDamageStatus","PvPBaseLife","PvPLifeStatus","PvPDefBaseRate"];
const pvpBGFields=["PvPBGDamageRate","PvPBGDamageRevision","PvPBGDamageStatus","PvPBGBaseLife","PvPBGLifeStatus","PvPBGDefBaseRate"];
const asObjects=d=>d.rows.map(r=>Object.fromEntries(d.columns.map((k,i)=>[k,r[i]])));
function need(ok,msg){if(!ok)throw new Error(msg);}
async function load(file){
  const response=await fetch(directory+file+".json");
  if(!response.ok)throw new Error("Reference unavailable");
  const d=await response.json();
  need(d.schemaVersion===1 && Array.isArray(d.columns) && typeof d.scope==="string","Unsupported schema");
  return d;
}
export function validateReference(merc,skills,modes){
  need(merc.scope===skills.scope && (!modes || skills.scope===modes.scope),"Mixed reference scopes");
  need(Array.isArray(merc.rows)&&Array.isArray(skills.rows)&&Array.isArray(merc.edges),"Missing rows");
  for(const d of [merc,skills]){
    need(new Set(d.columns).size===d.columns.length && d.rows.every(r=>Array.isArray(r)&&r.length===d.columns.length),"Invalid row");
    need(new Set(d.rows.map(r=>r[0])).size===d.rows.length,"Duplicate identity");
  }
  const profiles=asObjects(merc), skillList=asObjects(skills);
  const hasPvp=merc.columns.includes("PvPBaseLife");
  if(hasPvp){need([...pvpFields,...pvpBGFields].every(k=>merc.columns.includes(k)),"Incomplete PvP field schema");need(profiles.every(p=>[...pvpFields,...pvpBGFields].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0)),"Invalid PvP field value");}
  const ids=new Set(profiles.map(r=>r.char));
  need(merc.edges.every(e=>e.length===2&&e.every(k=>ids.has(k))),"Unknown evolution edge");
  const magic=new Set(skillList.map(r=>r.magicKind));
  need(skillList.every(s=>Number.isSafeInteger(s.skillIndex)&&Array.isArray(s.books)&&s.books.every(b=>/^[1-9]\d*$/.test(b[0])&&Array.isArray(b[2]))),"Invalid skill record");
  if(modes)need(modeNames.every(k=>Array.isArray(modes.modes[k])&&modes.modes[k].every(r=>r.length===modes.columns.length&&magic.has(r[0])&&Number.isInteger(r[1])&&[0,1].includes(r[3]))),"Invalid mode row");
  return {profiles,skillList};
}
export function classRelatedProfiles(profiles,skill){
  const classes=new Set(skill.books.flatMap(b=>b[2]));
  return profiles.filter(p=>classes.has(p.classToken));
}
export function hasBookReference(record,filter){
  return !filter||(filter==="yes"?record.books?.length>0:record.books?.length===0);
}
// Costs are stored on the current character, not the destination.
export function evolutionFamilyRows(profiles,edges,selected){
 const byId=new Map(profiles.map(p=>[p.char,p])),incoming=new Map(),outgoing=new Map();
 for(const [from,to] of edges){
  if(!incoming.has(to))incoming.set(to,[]);
  if(!outgoing.has(from))outgoing.set(from,[]);
  incoming.get(to).push(from);outgoing.get(from).push(to);
 }
 const material=(id,quantity)=>{
  if(!/^[1-9]\d*$/.test(String(id))||!/^\d+$/.test(String(quantity))||!Number.isSafeInteger(Number(quantity))||Number(quantity)<=0)return null;
  return {id:String(id),quantity:Number(quantity)};
 };
 return profiles.filter(p=>selected.baseGrade&&p.baseGrade===selected.baseGrade)
  .sort((a,b)=>a.Grade-b.Grade||a.char.localeCompare(b.char)).map(p=>{
   const next=(outgoing.get(p.char)??[]).filter(k=>byId.has(k));
   const previous=(incoming.get(p.char)??[]).filter(k=>byId.has(k));
   const standard=next.length?material(p.CrystalUnique,p.CrystalNum):null;
   const configuredAlternative=next.length?material(p.AtlasUnique,p.AtlasNum):null;
   const sameMaterial=Boolean(standard&&configuredAlternative&&standard.id===configuredAlternative.id&&standard.quantity===configuredAlternative.quantity);
   return {profile:p,previous,next,standard,alternative:sameMaterial?null:configuredAlternative,sameMaterial};
  });
}
function element(tag,value,cls){
  const e=document.createElement(tag); if(value!==null&&value!==undefined)e.textContent=String(value);if(cls)e.className=cls;return e;
}
function link(label,href){const a=element("a",label);a.href=href;return a;}
function option(value,label){const o=element("option",label);o.value=String(value);return o;}
function table(parent,headers,rows){
  const wrap=element("div",null,"ref-table-wrap"),tb=element("table"),head=element("thead"),tr=element("tr");
  for(const h of headers){const th=element("th",h);th.scope="col";tr.append(th);}
  head.append(tr);tb.append(head);const body=element("tbody");
  for(const row of rows){const r=element("tr");for(const cell of row){const td=element("td");if(cell instanceof Node)td.append(cell);else td.textContent=cell===null||cell===undefined?"—":String(cell);r.append(td);}body.append(r);}
  tb.append(body);wrap.append(tb);parent.append(wrap);
}
export async function mountReference(root){
  const t=JSON.parse(root.dataset.labels),prefix=root.dataset.prefix??"",section=root.dataset.section;
  const result=root.querySelector("[data-result]"),scope=root.querySelector("[data-scope]"),controls=root.querySelector("[data-controls]"),count=root.querySelector("[data-count]");
  const primary=root.querySelector("[data-primary]"),secondary=root.querySelector("[data-secondary]"),search=root.querySelector("[data-search]"),grade=root.querySelector("[data-grade]");
  const heading=(name,level="h2")=>result.append(element(level,name));
  const paragraph=(value,cls)=>result.append(element("p",value,cls));
  const itemHref=id=>prefix+"/items/database/?id="+encodeURIComponent(id);
  let itemNames=new Map();
  let previewLevel=null,previousCap=null,previousSkill=null,previewIntelligence=0;
  let selectedModes=[...modeNames],totalsOnly=false;
  const collapsedGroups=new Set();
  const item=id=>itemNames.has(String(id))?link(itemNames.get(String(id))+" (#"+id+")",itemHref(id)):String(id??"—");
  const profileHref=id=>prefix+"/mercenaries/database/?char="+encodeURIComponent(id);
  const skillHref=id=>prefix+"/mercenaries/skills/?skill="+encodeURIComponent(id);
  try{
    const [m,s,baseModes,lookup,extra,context,buff]=await Promise.all([load("mercenaries"),load("skills"),section==="skills"?load("modes"):Promise.resolve(null),load("item-names"),section==="skills"?load("mode-progression"):Promise.resolve(null),section==="skills"?load("skill-context"):Promise.resolve(null),section==="skills"?load("skill-buff-stats"):Promise.resolve(null)]);
    const v=baseModes?joinBuffStats(joinSkillContext(joinProgression(baseModes,extra),context),buff):null;
    need(lookup.scope===m.scope&&lookup.snapshotId===1&&Array.isArray(lookup.rows),"Invalid item name lookup");
    itemNames=new Map(lookup.rows.filter(r=>r[2]==="named"&&typeof r[1]==="string").map(r=>[r[0],r[1]]));
    const {profiles,skillList}=validateReference(m,s,v);
    const combos=context?comboReferences(context,skillList):[];
    scope.textContent=m.scope==="arthur-pilot-grade-9"?t.pilot:t.expanded;
    const records=section==="database"?profiles:skillList, key=section==="database"?"char":"skillIndex";
    const url=new URL(location.href),requested=url.searchParams.get(section==="database"?"char":"skill");
    previewIntelligence=validIntelligence(url.searchParams.get("int"))??0;
    selectedModes=parseSkillModes(url.searchParams.get("modes"),modeNames);
    totalsOnly=url.searchParams.get("totals")==="1";
    const byId=new Map(records.map(r=>[String(r[key]),r]));
    const filters=Array.from(root.querySelectorAll("[data-profile-filter]"));
    const bookFilter=root.querySelector("[data-book-filter]");
    for(const filter of filters){const key=filter.dataset.profileFilter;const values=[...new Set(profiles.map(r=>r[key]).filter(v=>v!==null&&v!==undefined&&v!==""))].sort();filter.replaceChildren(option("",t.all),...values.map(v=>option(v,v)));}
    const label=r=>r.name+" · "+r[key]+(section==="database"?" · G"+r.Grade:"");
    function fill(query="",preferred=primary.value){
      const q=query.trim().toLowerCase();
      const matches=records.filter(r=>(label(r)+" "+(r.classToken??r.magicKind??"")+" "+(r.baseGrade??"")).toLowerCase().includes(q)&&filters.every(f=>!f.value||String(r[f.dataset.profileFilter])===f.value)&&hasBookReference(r,bookFilter?.value));
      primary.replaceChildren(...matches.map(r=>option(r[key],label(r))));
      if(count)count.textContent=String(matches.length)+" / "+records.length;
      if(Array.from(primary.options).some(o=>o.value===preferred))primary.value=preferred;
    }
    fill("",requested??"");
    if(secondary){secondary.replaceChildren(option("",t.clear),...records.map(r=>option(r[key],label(r))));const other=url.searchParams.get("compare");if(other&&byId.has(other))secondary.value=other;}
    const profileMap=new Map(profiles.map(p=>[p.char,p]));
    const displayProfile=p=>link(profileMap.get(p)?.name??p,profileHref(p));
    function renderMerc(p){
      const other=secondary&&byId.get(secondary.value);
      heading(p.name);paragraph(p.char+" · "+p.classToken+" · "+(p.Rank??"—"));
      table(result,[t.field,p.name,...(other?[other.name]:[])],["Rank","jobType","metadataJobType","weaponType","baseGrade"].map(k=>[k,p[k],...(other?[other[k]]:[])]));
      heading(t.raw);
      table(result,[t.raw,p.name,...(other?[other.name]:[])],stats.map(k=>[k,p[k],...(other?[other[k]]:[])]));
      if(m.columns.includes("PvPBaseLife")){
        heading(t.pvp);paragraph(t.pvpNotice,"ref-source");
        const pvpRows=fields=>fields.map(k=>[t["pvp_"+k]??k,p[k],...(other?[other[k]]:[])]);
        table(result,[t.pvp,p.name,...(other?[other.name]:[])],pvpRows(pvpFields));
        heading(t.pvpBG,"h3");table(result,[t.pvpBG,p.name,...(other?[other.name]:[])],pvpRows(pvpBGFields));
        paragraph(t.source+": CharAttackInfo.ndt · PvP fields","ref-source");
      }
      heading(t.requirements);
      table(result,[t.field,p.name,...(other?[other.name]:[])],["NeedLevel","CrystalUnique","CrystalNum","AtlasUnique","AtlasNum"].map(k=>[k,k.endsWith("Unique")?item(p[k]):p[k],...(other?[k.endsWith("Unique")?item(other[k]):other[k]]:[])]));
      heading(t.awakening);
      if(p.awakening)table(result,["NeedLevel","NeedItemUnique","NeedNum"],[[p.awakening[0],item(p.awakening[1]),p.awakening[2]]]);else paragraph(t.missing);
      heading(t.family);
      const family=evolutionFamilyRows(profiles,m.edges,p);
      if(family.length){
        paragraph(t.evolutionCostNote,"ref-source");
        const nf=new Intl.NumberFormat(root.dataset.lang);
        const links=ids=>{
          if(!ids.length)return "—";
          const cell=element("span");
          ids.forEach((id,i)=>{if(i)cell.append(document.createTextNode(" · "));cell.append(displayProfile(id));});
          return cell;
        };
        const cost=material=>{
          if(!material)return "—";
          const cell=element("span");
          cell.append(document.createTextNode(nf.format(material.quantity)+" × "),item(material.id));
          return cell;
        };
        table(result,[t.grade,t.select,t.before,t.after,t.upgradeMaterial,t.alternativeMaterial],family.map(x=>[
          x.profile.Grade,displayProfile(x.profile.char),links(x.previous),links(x.next),
          x.next.length?cost(x.standard):t.noExplicitUpgrade,
          x.sameMaterial?t.sameUpgradeMaterial:cost(x.alternative)
        ]));
        paragraph(t.source+": OneLevelSolInfo_ENG.vna","ref-source");
      }else paragraph(t.missing);
      heading(t.configured);
      if(p.configuredMagic?.length)table(result,["Magic_Kind","Skill"],p.configuredMagic);else paragraph(t.missing);
      heading(t.books);paragraph(t.bookNotice);
      const related=skillList.filter(x=>x.books.some(b=>b[2].includes(p.classToken)));
      if(related.length)table(result,["SkillIndex",t.skills,t.books],related.map(x=>[x.skillIndex,link(x.name,skillHref(x.skillIndex)),x.books.filter(b=>b[2].includes(p.classToken)).length]));else paragraph(t.missing);
      paragraph(t.source+": CharAttackInfo.ndt #"+p.attackLine+" · OneLevelSolInfo_ENG.vna #"+(p.evolutionLine??"—")+" · ItemTypeBook.ndt","ref-source");
    }
    function renderSkill(p){
      heading(p.name);paragraph("SkillIndex "+p.skillIndex+" · MagicCode "+p.magicCode+" · "+p.magicKind);
      const compareHost=element("div");result.append(compareHost);
      renderModes(p);
      mountSkillComparison(compareHost,{data:v,skills:skillList,primary:p,initialGrade:grade.value===""?null:Number(grade.value),initialLevel:previewLevel,initialInt:previewIntelligence,modeNames,modeLabels:MODE_LABELS,matrixFor:buildModeMatrix,lang:root.dataset.lang,labels:t,prefix});
      mountComboReference(result,combos,p,root.dataset.lang,skillHref);
      heading(t.books);paragraph(t.bookNotice);
      if(p.books.length)table(result,[t.items,"SkillLimit","Class","ItemTypeBook.ndt"],p.books.map(b=>[item(b[0]),b[1],b[2].join(", "),b[3]]));else paragraph(t.missing);
      heading(t.relatedProfiles);
      const eligible=classRelatedProfiles(profiles,p);
      if(eligible.length){
        const groups=new Map();
        for(const profile of eligible){const group=groups.get(profile.classToken)??[];group.push(profile);groups.set(profile.classToken,group);}
        table(result,["Class",t.relatedProfiles],[...groups].map(([cls,group])=>{
          const cell=element("span");
          group.sort((a,b)=>a.Grade-b.Grade||a.char.localeCompare(b.char)).forEach((p,i)=>{if(i)cell.append(document.createTextNode(" · "));cell.append(displayProfile(p.char));});
          return [cls,cell];
        }));
      }else paragraph(t.missing);
      paragraph(t.source+": SkillInfoIndex.ndt · MagicIndex.ndt · TextMgr_Magic_ENG.ntx #"+p.nameTextId,"ref-source");
    }
    function renderModes(p){
      heading(t.mode);
      const available=new Set();for(const mode of modeNames)for(const r of v.modes[mode])if(r[0]===p.magicKind)available.add(r[1]);
      const changedSkill=previousSkill!==null&&previousSkill!==p.magicKind;
      const previous=changedSkill?"":grade.value||(!previousSkill?url.searchParams.get("grade"):"")||"";
      grade.replaceChildren(...[...available].sort((a,b)=>a-b).map(x=>option(x,x)));
      if(available.has(Number(previous))&&previous!=="")grade.value=previous;
      else if(available.size)grade.value=String(Math.max(...available));
      if(!available.size){paragraph(t.missing);return;}
      const matrix=buildModeMatrix(v,p.magicKind,Number(grade.value));
      const section=element("div",null,"ref-mode-matrix");
      const fmt=field=>contextField(field,root.dataset.lang)??progressionField(field,root.dataset.lang,t);
      const ui=levelText(root.dataset.lang);
      const nf=new Intl.NumberFormat(root.dataset.lang,{maximumFractionDigits:4});
      const label=element("label",ui.level,"ref-level-control"),input=element("input");
      input.type="text";input.inputMode="numeric";input.autocomplete="off";
      const cap=defaultSkillLevel(matrix,v.columns),caps=skillLevelCaps(matrix,v.columns);
      previewLevel=selectPreviewLevel(previewLevel,previousCap,cap,validLevel(url.searchParams.get("level")),changedSkill);
      previousCap=cap;previousSkill=p.magicKind;
      input.value=String(previewLevel);label.append(input);
      const levelControls=element("div",null,"ref-level-controls");
      const rangeControl=element("div",null,"ref-level-range"),slider=element("input");
      slider.type="range";slider.min="1";slider.step="1";slider.setAttribute("aria-label",ui.level);
      const limits=element("div",null,"ref-level-limits"),lower=element("span","1"),upper=element("span");
      limits.append(lower,upper);rangeControl.append(slider,limits);
      function syncSliderRange(){
        slider.max=String(skillSliderMax(matrix,v.columns,previewLevel));
        slider.value=String(previewLevel);slider.disabled=Number(slider.max)===1;
        upper.textContent=slider.max;
      }
      syncSliderRange();
      const maxButton=element("button",ui.maxLevel,"ref-max-level");maxButton.type="button";maxButton.disabled=!caps.total.length;
      levelControls.append(label,rangeControl,maxButton);section.append(levelControls);
      const capLabel=element("p",ui.books+": "+(caps.book.join(" / ")||"—")+" · "+ui.charms+": "+(caps.total.join(" / ")||"—"),"ref-source ref-cap-summary");section.append(capLabel);
      const warning=element("p",ui.invalid,"ref-warning");warning.hidden=true;section.append(warning);
      const intControls=element("div",null,"ref-int-controls"),intLabel=element("label",ui.intelligence,"ref-level-control"),intInput=element("input");
      intInput.type="text";intInput.inputMode="numeric";intInput.autocomplete="off";intInput.value=String(previewIntelligence);intLabel.append(intInput);
      const bonusLabel=element("span",null,"ref-source");function updateBonus(){bonusLabel.textContent=ui.bonusLevels+": +"+nf.format(intelligenceBonusLevels(previewIntelligence));}
      updateBonus();intControls.append(intLabel,bonusLabel);section.append(intControls);
      const intWarning=element("p",ui.invalidInt,"ref-warning");intWarning.hidden=true;section.append(intWarning);
      section.append(element("p",ui.intNote,"ref-source"));
      section.append(element("p",ui.notice,"ref-source"));
      const view=element("fieldset",null,"ref-view-controls");
      view.append(element("legend",ui.viewOptions));
      const viewActions=element("div",null,"ref-view-actions");
      const totalsLabel=element("label",null,"ref-view-check"),totalsInput=element("input");
      totalsInput.type="checkbox";totalsInput.checked=totalsOnly;
      totalsLabel.append(totalsInput,element("span",ui.totalsOnly));viewActions.append(totalsLabel);
      const allButton=element("button",ui.allModes,"ref-max-level"),expandButton=element("button",ui.expandAll,"ref-max-level"),collapseButton=element("button",ui.collapseAll,"ref-max-level");
      for(const b of [allButton,expandButton,collapseButton]){b.type="button";viewActions.append(b);}
      view.append(viewActions,element("p",ui.modeSelection,"ref-source"));
      const checks=element("div",null,"ref-mode-checks"),modeInputs=matrix.columns.map(col=>{
        const label=element("label",null,"ref-view-check"),input=element("input");input.type="checkbox";
        label.append(input,element("span",col.label));checks.append(label);return input;
      });
      view.append(checks,element("p",ui.totalsNote,"ref-source"));section.append(view);
      function syncView(){
        modeInputs.forEach((input,i)=>{input.checked=selectedModes.includes(matrix.columns[i].source);input.disabled=input.checked&&selectedModes.length===1;});
        allButton.disabled=selectedModes.length===modeNames.length;
      }
      function saveView(){
        const next=new URL(location.href);
        if(selectedModes.length===modeNames.length)next.searchParams.delete("modes");else next.searchParams.set("modes",selectedModes.join(","));
        if(totalsOnly)next.searchParams.set("totals","1");else next.searchParams.delete("totals");
        history.replaceState(history.state,"",next.pathname+next.search+next.hash);
      }
      const matrixBody=element("div",null,"ref-player-matrix");section.append(matrixBody);
      const wrap=element("div",null,"ref-table-wrap ref-player-table-wrap"),tb=element("table"),head=element("thead"),hr=element("tr");
      const noStats=element("p",ui.noStats,"ref-source");noStats.hidden=true;matrixBody.append(noStats);
      head.append(hr);tb.append(head);wrap.append(tb);matrixBody.append(wrap);
      let currentHeader="";
      syncView();
      function renderPlayerMatrix(){
        const left=wrap.scrollLeft,top=wrap.scrollTop;
        const indices=matrix.columns.map((col,i)=>selectedModes.includes(col.source)?i:-1).filter(i=>i>=0);
        const columns=indices.map(i=>matrix.columns[i]),headerKey=indices.join(",");
        if(headerKey!==currentHeader){
          hr.replaceChildren();
          for(const h of [t.field,...columns.map(c=>c.label+(c.conflict?" ⚠":""))]){const th=element("th",h);th.scope="col";hr.append(th);}
          wrap.dataset.modeCount=String(columns.length);
          tb.style.setProperty("--ref-table-min",String(236+104*columns.length)+"px");
          currentHeader=headerKey;
        }
        const rows=filterPlayerRows(buildPlayerRows(matrix,v.columns,previewLevel,previewIntelligence),indices,totalsOnly);
        noStats.hidden=rows.length>0;
        for(const body of Array.from(tb.tBodies))body.remove();
        for(const group of GROUP_ORDER){
          const groupRows=rows.filter(r=>r.group===group);if(!groupRows.length)continue;
          const body=element("tbody"),groupRow=element("tr",null,"ref-stat-group"),gh=element("th");
          gh.colSpan=1+columns.length;gh.scope="rowgroup";
          const toggle=element("button",null,"ref-group-toggle");toggle.type="button";
          function syncGroup(){
            const closed=collapsedGroups.has(group);
            toggle.textContent=(closed?"▸ ":"▾ ")+ui[group]+" ("+groupRows.length+")";
            toggle.setAttribute("aria-expanded",String(!closed));
            for(const tr of Array.from(body.rows).slice(1))tr.hidden=closed;
          }
          toggle.addEventListener("click",()=>{if(collapsedGroups.has(group))collapsedGroups.delete(group);else collapsedGroups.add(group);syncGroup();});
          gh.append(toggle);groupRow.append(gh);body.append(groupRow);
          for(const r of groupRows){
            const tr=element("tr",null,(r.kind==="total"||r.kind==="int-total")?"ref-stat-total":"");
            const title=element("th",skillRowLabel(r,root.dataset.lang,fmt));title.scope="row";tr.append(title);
            r.values.forEach((values,i)=>{
              const c=columns[i],td=element("td");
              const format=x=>x.value===null||x.value===undefined?"—":(typeof x.value==="number"?nf.format(x.value)+r.unit:String(contextValue(r.field,x.value,root.dataset.lang)))+(x.aboveCap?" *":"");
              if(!values.length){td.textContent="—";td.className="ref-missing";}
              else if(c.conflict){td.className="ref-conflict-cell";for(const x of values)td.append(element("span",format(x)+" · #"+x.line));}
              else td.textContent=[...new Set(values.map(format))].join(" / ");
              tr.append(td);
            });
            body.append(tr);
          }
          tb.append(body);syncGroup();
        }
        wrap.scrollLeft=left;wrap.scrollTop=top;
      }
      totalsInput.addEventListener("change",()=>{totalsOnly=totalsInput.checked;saveView();renderPlayerMatrix();});
      modeInputs.forEach((input,i)=>input.addEventListener("change",()=>{
        const next=modeNames.filter((_,j)=>modeInputs[j].checked);
        if(next.length)selectedModes=next;
        syncView();saveView();renderPlayerMatrix();
      }));
      allButton.addEventListener("click",()=>{selectedModes=[...modeNames];syncView();saveView();renderPlayerMatrix();});
      expandButton.addEventListener("click",()=>{collapsedGroups.clear();renderPlayerMatrix();});
      collapseButton.addEventListener("click",()=>{for(const group of GROUP_ORDER)collapsedGroups.add(group);renderPlayerMatrix();});
      function updatePreview(n,fromSlider){
        previewLevel=n;warning.hidden=true;input.setAttribute("aria-invalid","false");
        if(fromSlider)input.value=String(n);else syncSliderRange();
        renderPlayerMatrix();
        const next=new URL(location.href);next.searchParams.set("level",String(n));history.replaceState(history.state,"",next.pathname+next.search+next.hash);
      }
      input.addEventListener("input",()=>{
        const n=validLevel(input.value);warning.hidden=n!==null;input.setAttribute("aria-invalid",String(n===null));
        if(n!==null)updatePreview(n,false);
      });
      slider.addEventListener("input",()=>{const n=validLevel(slider.value);if(n!==null)updatePreview(n,true);});
      maxButton.addEventListener("click",()=>{input.value=String(cap);updatePreview(cap,false);});
      intInput.addEventListener("input",()=>{
        const n=validIntelligence(intInput.value);intWarning.hidden=n!==null;intInput.setAttribute("aria-invalid",String(n===null));
        if(n===null)return;
        previewIntelligence=n;updateBonus();renderPlayerMatrix();
        const next=new URL(location.href);if(n)next.searchParams.set("int",String(n));else next.searchParams.delete("int");
        history.replaceState(history.state,"",next.pathname+next.search+next.hash);
      });
      renderPlayerMatrix();
      if(matrix.columns.some(c=>c.conflict))section.append(element("p",t.conflict,"ref-warning"));
      const provenance=element("details");provenance.append(element("summary",t.source));
      table(provenance,[t.mode,t.source,t.field],matrix.columns.map(c=>[c.label,c.source+".ndt",c.lines.length?c.lines.map(n=>"#"+n).join(", "):t.missing]));
      section.append(element("p",contextText(root.dataset.lang).targetNote,"ref-source"));
      section.append(provenance);result.append(section);
      const gradeDetails=element("details");gradeDetails.append(element("summary",ui.gradeComparison));mountSkillProgression(gradeDetails,v,p,Number(grade.value),root.dataset.lang,t,{gradeOnly:true});result.append(gradeDetails);

    }
    function render(){
      result.replaceChildren();
      const p=byId.get(primary.value);
      if(!p){paragraph(t.missing);return;}
      if(section==="database")renderMerc(p);else renderSkill(p);
      const next=new URL(location.href);next.searchParams.set(section==="database"?"char":"skill",String(p[key]));
      if(secondary){if(secondary.value)next.searchParams.set("compare",secondary.value);else next.searchParams.delete("compare");}
      if(grade){if(grade.value)next.searchParams.set("grade",grade.value);else next.searchParams.delete("grade");if(previewLevel!==null)next.searchParams.set("level",String(previewLevel));if(previewIntelligence)next.searchParams.set("int",String(previewIntelligence));else next.searchParams.delete("int");}
      history.replaceState(history.state,"",next.pathname+next.search+next.hash);
    }
    search.addEventListener("input",()=>{fill(search.value);render();});
    for(const filter of filters)filter.addEventListener("change",()=>{fill(search.value);render();});
    bookFilter?.addEventListener("change",()=>{fill(search.value);render();});
    primary.addEventListener("change",render);secondary?.addEventListener("change",render);grade?.addEventListener("change",render);
    controls.hidden=false;render();
  }catch(err){scope.textContent=t.error;result.replaceChildren();controls.hidden=true;console.error("Reference catalog:",err);}
}
