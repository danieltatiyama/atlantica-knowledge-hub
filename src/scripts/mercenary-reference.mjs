const directory="/data/client-mercenaries/";
const modeNames=["Magic","MagicPVP","MagicPVPBattleGround","BF_Magic","BF_MagicPvP","BF_MagicPvPLeague"];
const stats=["Grade","Str","Dex","Vit","Intl","MinDmg","MaxDmg","AC","MagicDef","CriticalRate"];
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
  need(merc.scope===skills.scope && skills.scope===modes.scope,"Mixed reference scopes");
  need(Array.isArray(merc.rows)&&Array.isArray(skills.rows)&&Array.isArray(merc.edges),"Missing rows");
  for(const d of [merc,skills]){
    need(new Set(d.columns).size===d.columns.length && d.rows.every(r=>Array.isArray(r)&&r.length===d.columns.length),"Invalid row");
    need(new Set(d.rows.map(r=>r[0])).size===d.rows.length,"Duplicate identity");
  }
  const profiles=asObjects(merc), skillList=asObjects(skills);
  const ids=new Set(profiles.map(r=>r.char));
  need(merc.edges.every(e=>e.length===2&&e.every(k=>ids.has(k))),"Unknown evolution edge");
  const magic=new Set(skillList.map(r=>r.magicKind));
  need(skillList.every(s=>Number.isSafeInteger(s.skillIndex)&&Array.isArray(s.books)&&s.books.every(b=>/^[1-9]\d*$/.test(b[0])&&Array.isArray(b[2]))),"Invalid skill record");
  need(modeNames.every(k=>Array.isArray(modes.modes[k])&&modes.modes[k].every(r=>r.length===modes.columns.length&&magic.has(r[0])&&Number.isInteger(r[1])&&[0,1].includes(r[3]))),"Invalid mode row");
  return {profiles,skillList};
}
// Keep names/IDs separate; shared names must never collapse identities.
export function filterReference(records,{query="",rank="",family="",bookFilter=""}={}){
  const q=query.trim().toLowerCase();
  return records.filter(r=>
    (!q||[r.name,r.char,r.skillIndex,r.classToken,r.magicKind,r.baseGrade].filter(x=>x!=null).join(" ").toLowerCase().includes(q)) &&
    (!rank||(rank==="__missing__"?r.Rank==null:r.Rank===rank)) &&
    (!family||r.baseGrade===family) &&
    (!bookFilter||(bookFilter==="yes"?r.books?.length>0:r.books?.length===0)));
}
export function classRelatedProfiles(profiles,skill){
  const classes=new Set(skill.books.flatMap(b=>b[2]));
  return profiles.filter(p=>classes.has(p.classToken));
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
  const result=root.querySelector("[data-result]"),scope=root.querySelector("[data-scope]"),controls=root.querySelector("[data-controls]");
  const primary=root.querySelector("[data-primary]"),secondary=root.querySelector("[data-secondary]"),search=root.querySelector("[data-search]"),grade=root.querySelector("[data-grade]");
  const rank=root.querySelector("[data-rank]"),familyFilter=root.querySelector("[data-family]"),bookFilter=root.querySelector("[data-book-filter]"),count=root.querySelector("[data-count]");
  const heading=(name,level="h2")=>result.append(element(level,name));
  const paragraph=(value,cls)=>result.append(element("p",value,cls));
  const itemHref=id=>prefix+"/items/database/?id="+encodeURIComponent(id);
  const item=id=>/^[1-9]\d*$/.test(String(id))?link(t.items+" "+id,itemHref(id)):String(id??"—");
  const profileHref=id=>prefix+"/mercenaries/database/?char="+encodeURIComponent(id);
  const skillHref=id=>prefix+"/mercenaries/skills/?skill="+encodeURIComponent(id);
  try{
    const [m,s,v]=await Promise.all([load("mercenaries"),load("skills"),load("modes")]);
    const {profiles,skillList}=validateReference(m,s,v);
    scope.textContent=m.scope==="arthur-pilot-grade-9"?t.pilot:t.expanded;
    const records=section==="database"?profiles:skillList, key=section==="database"?"char":"skillIndex";
    const url=new URL(location.href),requested=url.searchParams.get(section==="database"?"char":"skill");
    const byId=new Map(records.map(r=>[String(r[key]),r]));
    const label=r=>r.name+" · "+r[key]+(section==="database"?" · G"+r.Grade:"");
    if(rank){
      for(const value of ["S","A","B","C","D"])if(profiles.some(p=>p.Rank===value))rank.append(option(value,value));
      if(profiles.some(p=>p.Rank==null))rank.append(option("__missing__",t.missing));
    }
    if(familyFilter){
      const families=[...new Set(profiles.map(p=>p.baseGrade).filter(Boolean))];
      const names=new Map(profiles.map(p=>[p.char,p.name]));
      for(const value of families.sort((a,b)=>(names.get(a)??a).localeCompare(names.get(b)??b)))familyFilter.append(option(value,(names.get(value)??value)+" · "+value));
    }
    const sorted=[...records].sort((a,b)=>a.name.localeCompare(b.name)||String(a[key]).localeCompare(String(b[key])));
    function fill(query="",preferred=primary.value){
      const filtered=filterReference(sorted,{query,rank:rank?.value,family:familyFilter?.value,bookFilter:bookFilter?.value});
      primary.replaceChildren(...filtered.map(r=>option(r[key],label(r))));
      if(Array.from(primary.options).some(o=>o.value===preferred))primary.value=preferred;
      count.textContent=t.results+": "+new Intl.NumberFormat(root.dataset.lang).format(filtered.length);
    }
    fill("",requested??"");
    if(secondary){secondary.replaceChildren(option("",t.clear),...sorted.map(r=>option(r[key],label(r))));const other=url.searchParams.get("compare");if(other&&byId.has(other))secondary.value=other;}
    const profileMap=new Map(profiles.map(p=>[p.char,p]));
    const displayProfile=p=>link(profileMap.get(p)?.name??p,profileHref(p));
    function renderMerc(p){
      const other=secondary&&byId.get(secondary.value);
      heading(p.name);paragraph(p.char+" · "+p.classToken+" · "+(p.Rank??"—"));
      heading(t.raw);
      table(result,[t.raw,p.name,...(other?[other.name]:[])],stats.map(k=>[k,p[k],...(other?[other[k]]:[])]));
      heading(t.requirements);
      table(result,[t.field,p.name,...(other?[other.name]:[])],["NeedLevel","CrystalUnique","CrystalNum","AtlasUnique","AtlasNum"].map(k=>[k,k.endsWith("Unique")?item(p[k]):p[k],...(other?[k.endsWith("Unique")?item(other[k]):other[k]]:[])]));
      heading(t.awakening);
      if(p.awakening)table(result,["NeedLevel","NeedItemUnique","NeedNum"],[[p.awakening[0],item(p.awakening[1]),p.awakening[2]]]);else paragraph(t.missing);
      heading(t.family);
      const family=profiles.filter(x=>p.baseGrade&&x.baseGrade===p.baseGrade).sort((a,b)=>a.Grade-b.Grade||a.char.localeCompare(b.char));
      if(family.length)table(result,[t.grade,t.select,t.before,t.after],family.map(x=>[x.Grade,displayProfile(x.char),m.edges.filter(e=>e[1]===x.char).map(e=>e[0]).join(", ")||"—",m.edges.filter(e=>e[0]===x.char).map(e=>e[1]).join(", ")||"—"]));else paragraph(t.missing);
      heading(t.configured);
      if(p.configuredMagic?.length)table(result,["Magic_Kind","Skill"],p.configuredMagic);else paragraph(t.missing);
      heading(t.books);paragraph(t.bookNotice);
      const related=skillList.filter(x=>x.books.some(b=>b[2].includes(p.classToken)));
      if(related.length)table(result,["SkillIndex",t.skills,t.books],related.map(x=>[x.skillIndex,link(x.name,skillHref(x.skillIndex)),x.books.filter(b=>b[2].includes(p.classToken)).length]));else paragraph(t.missing);
      paragraph(t.source+": CharAttackInfo.ndt #"+p.attackLine+" · OneLevelSolInfo_ENG.vna #"+(p.evolutionLine??"—")+" · ItemTypeBook.ndt","ref-source");
    }
    function renderSkill(p){
      heading(p.name);paragraph("SkillIndex "+p.skillIndex+" · MagicCode "+p.magicCode+" · "+p.magicKind);
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
      heading(t.mode);
      const available=new Set();for(const mode of modeNames)for(const r of v.modes[mode])if(r[0]===p.magicKind)available.add(r[1]);
      const previous=grade.value||url.searchParams.get("grade")||"";
      grade.replaceChildren(...[...available].sort((a,b)=>a-b).map(x=>option(x,x)));
      if(available.has(Number(previous))&&previous!=="")grade.value=previous;
      if(!available.size){paragraph(t.missing);return;}
      const g=Number(grade.value);
      for(const mode of modeNames){
        heading(mode+".ndt","h3");
        const rows=v.modes[mode].filter(r=>r[0]===p.magicKind&&r[1]===g);
        if(!rows.length){paragraph(t.missing);continue;}
        if(rows.some(r=>r[3]===1))paragraph(t.conflict,"ref-warning");
        table(result,[t.raw,...rows.map(r=>t.source+" #"+r[2])],v.columns.slice(4).map((f,i)=>[f,...rows.map(r=>r[i+4])]));
      }
      paragraph(t.source+": SkillInfoIndex.ndt · MagicIndex.ndt · TextMgr_Magic_ENG.ntx #"+p.nameTextId,"ref-source");
    }
    function render(){
      result.replaceChildren();
      const p=byId.get(primary.value);
      if(!p){paragraph(t.missing);return;}
      if(section==="database")renderMerc(p);else renderSkill(p);
      url.searchParams.set(section==="database"?"char":"skill",String(p[key]));
      if(secondary){if(secondary.value)url.searchParams.set("compare",secondary.value);else url.searchParams.delete("compare");}
      if(grade){if(grade.value)url.searchParams.set("grade",grade.value);else url.searchParams.delete("grade");}
      history.replaceState(history.state,"",url);
    }
    const refilter=()=>{fill(search.value);render();};
    search.addEventListener("input",refilter);
    rank?.addEventListener("change",refilter);familyFilter?.addEventListener("change",refilter);bookFilter?.addEventListener("change",refilter);
    primary.addEventListener("change",render);secondary?.addEventListener("change",render);grade?.addEventListener("change",render);
    controls.hidden=false;render();
  }catch(err){scope.textContent=t.error;result.replaceChildren();controls.hidden=true;console.error("Reference catalog:",err);}
}
