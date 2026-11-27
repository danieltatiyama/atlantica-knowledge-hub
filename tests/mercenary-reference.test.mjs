import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateReference,classRelatedProfiles,hasBookReference,buildModeMatrix,evolutionFamilyRows} from '../src/scripts/mercenary-reference.mjs';
import {referenceText} from '../src/i18n/mercenary-reference-ui.mjs';
import {LOCALE_IDS,languageDestination} from '../src/i18n/locales.mjs';
const read=name=>readFileSync('public/data/client-mercenaries/'+name+'.json');
const [m,s,v]=['mercenaries','skills','modes'].map(n=>JSON.parse(read(n)));
test('source-safe reference schema and pinned pilot',()=>{
 const {profiles,skillList}=validateReference(m,s,v);
 if(m.scope==='arthur-pilot-grade-9'){
  assert.equal(profiles.length,17);assert.equal(skillList.length,5);assert.equal(m.edges.length,14);
  const pins={mercenaries:'4eb8e808a00d9adb842b11d383b2fa9fafb3e1d3cdd211e50d0a040d46e1d5c9',skills:'b28f532d0a4ff791d16533b63dabd151e4e7c1e509fc7fc38978509c729fc5df',modes:'5b2ec0a2435bb766d7696c14add3a9db6e5dce561c0754971aec13b783d18838'};
  for(const [k,h] of Object.entries(pins))assert.equal(createHash('sha256').update(read(k)).digest('hex'),h);
 }else{
  assert.equal(m.scope,'expanded-reference-candidate');assert.equal(profiles.length,947);assert.equal(skillList.length,1336);assert.equal(m.edges.length,816);
  assert.equal(Object.values(v.modes).flat().length,42602);
  const pins={skills:'8bc9c76e03afaa7f8d6fc0f85efd3dbc7fd623965b8fc2b243e62a5d95fb3488',modes:'c2eaf8f3f2291986996f245c12aed9116d5d7acd3d8814e37c522a37c472b361'};
  for(const [k,h] of Object.entries(pins))assert.equal(createHash('sha256').update(read(k)).digest('hex'),h);
  assert.equal(skillList.reduce((n,s)=>n+s.books.length,0),1783);
  assert.equal(Object.values(v.modes).reduce((n,rows)=>n+new Set(rows.filter(r=>r[3]===1).map(r=>r[0]+'|'+r[1])).size,0),48);
  assert.equal(profiles.filter(p=>p.awakening).length,90);
  assert.equal(new Set(profiles.map(p=>p.baseGrade).filter(Boolean)).size,122);
  assert.equal(new Set(profiles.map(p=>p.classToken)).size,95);
  assert.equal(skillList.filter(p=>p.books.length).length,320);
  assert.equal(new Set(skillList.flatMap(p=>p.books.map(b=>b[0]))).size,1783);
  const bookMdefSamples=[['ETERNITY10',250],['BLACKARTHUR5',50],['SAE10',155],['SPARTACUS10',10]];
  for(const [char,value] of bookMdefSamples)assert.equal(profiles.find(p=>p.char===char)?.MagicDef,value);
  const normalKeys=new Set(v.modes.Magic.map(r=>r[0]));
  assert.equal(skillList.filter(p=>!normalKeys.has(p.magicKind)).length,26);
  assert.equal(validateReference(m,s,null).profiles.length,947);
  const pvpFields=['PvPDamageRate','PvPDamageRevision','PvPDamageStatus','PvPBaseLife','PvPLifeStatus','PvPDefBaseRate','PvPBGDamageRate','PvPBGDamageRevision','PvPBGDamageStatus','PvPBGBaseLife','PvPBGLifeStatus','PvPBGDefBaseRate'];
  assert.ok(pvpFields.every(k=>m.columns.includes(k)));
  assert.equal(profiles.filter(p=>pvpFields.every(k=>Number.isSafeInteger(p[k]))).length,947);
  const pvpSample=profiles.find(p=>p.char==='ETERNITY10');
  assert.deepEqual(pvpFields.map(k=>pvpSample[k]),[288,703,650,4200,900,70,243,394,650,2828,650,52]);
 }
 const dark=skillList.find(r=>r.skillIndex===995);
 assert.ok(dark.books.every(b=>b[2].includes('CLS1_BLACKARTHUR')&&!b[2].includes('CLS1_WHITEARTHUR')));
 const arthur=profiles.find(p=>p.char==='ARTHUR7');assert.ok(arthur);assert.equal(m.edges.some(e=>e[0]==='ARTHUR7'),false);
 const clash=v.modes.MagicPVPBattleGround.filter(r=>r[0]==='MAGIC_ARTHURBLACK'&&r[1]===9);
 assert.equal(clash.length,3);assert.ok(clash.every(r=>r[3]===1));assert.deepEqual(clash.map(r=>r[4]),['-361','-399','-435']);
 assert.throws(()=>validateReference({...m,scope:'wrong'},s,v));
});
test('all eight locale labels and alternate routes are present',()=>{
 for(const lang of LOCALE_IDS){
  const labels=referenceText(lang);assert.ok(Object.values(labels).every(x=>typeof x==='string'&&x.trim()));
  assert.equal(labels.magicDefLabel,'MagicDef*');assert.ok(labels.magicDefNote.includes('200'));
  for(const section of ['database','skills'])assert.equal(languageDestination({lang,path:'/mercenaries/'+section+'/'}),(lang==='en'?'':'/'+lang)+'/mercenaries/'+section+'/');
 }
});

test('derived names and search index match exact source identities',()=>{
 const lookup=JSON.parse(read('item-names')),search=JSON.parse(read('search-index'));
 assert.equal(lookup.scope,m.scope);assert.equal(search.scope,m.scope);
 const idx=new Map();for(let i=0;i<6;i++){
  const shard=JSON.parse(readFileSync('public/data/client-items/index-0'+i+'.json'));
  for(const r of shard.rows)idx.set(r[0],r);
 }
 const ids=new Set();for(const r of m.rows)for(const id of [r[14],r[16],r[19]?.[1]])if(/^[1-9]\d*$/.test(String(id)))ids.add(String(id));
 for(const r of s.rows)for(const b of r[5])ids.add(b[0]);
 assert.equal(ids.size,1827);assert.equal(lookup.rows.length,1827);
 for(const [id,name,status] of lookup.rows){assert.ok(ids.delete(id));assert.equal(status,'named');assert.equal(name,idx.get(id)[1]);assert.equal(idx.get(id)[6],'named');}
 assert.equal(ids.size,0);
 assert.deepEqual(search.rows,[...m.rows.map(r=>['mercenary',r[0],r[1],r[2]+' · G'+r[3]]),...s.rows.map(r=>['skill',String(r[0]),r[3],r[2]])]);
});

test('reverse book links preserve exact class restrictions, not name proximity',()=>{
 const {profiles,skillList}=validateReference(m,s,v);
 const dark=skillList.find(r=>r.skillIndex===995);
 const related=classRelatedProfiles(profiles,dark);
 assert.equal(related.length,5);
 assert.ok(related.every(p=>p.classToken==='CLS1_BLACKARTHUR'));
 assert.equal(hasBookReference(dark,'yes'),true);
 assert.equal(hasBookReference(dark,'no'),false);
 assert.equal(hasBookReference({books:[]},'no'),true);
 assert.equal(hasBookReference({books:[]},'yes'),false);
 assert.equal(hasBookReference({},undefined),true);
});

test('one mode matrix preserves every conflicting row and source line, and never fills missing modes',()=>{
 const matrix=buildModeMatrix(v,'MAGIC_ARTHURBLACK',9);
 assert.equal(matrix.columns.length,6);
 assert.deepEqual(matrix.columns.map(c=>c.label),['PvE / Normal','PvP / FL','PvP / Colosseum','TBS','TBS PvP','TBS League']);
 assert.deepEqual(matrix.columns[2].lines,[244,245,246]);
 assert.equal(matrix.columns[2].conflict,true);
 assert.deepEqual(matrix.fields.find(r=>r.field==='EndowedAmount_HP').values,[['-525'],['-261'],['-361','-399','-435'],['-500'],['-361'],['-361']]);
 assert.deepEqual(matrix.fields.find(r=>r.field==='ConsMP').values[2],['240','260','280']);
 const absent=buildModeMatrix(v,'MAGIC_UNKNOWN',99);
 assert.ok(absent.columns.every(c=>!c.lines.length&&!c.conflict));
 assert.ok(absent.fields.every(r=>r.values.every(a=>a.length===0)));
 for(const lang of LOCALE_IDS)assert.ok(referenceText(lang).field_EndowedAmount_HP&&referenceText(lang).modeLegend);
});

test('evolution family costs use the outgoing source grade, preserve alternatives and never price unlinked branches',()=>{
 const {profiles}=validateReference(m,s,v),byId=new Map(profiles.map(p=>[p.char,p]));
 const family=k=>evolutionFamilyRows(profiles,m.edges,byId.get(k));
 const sword=family('SWORDMAN1'),first=sword.find(r=>r.profile.char==='SWORDMAN1');
 assert.deepEqual(first.next,['SWORDMAN2']);
 assert.deepEqual(first.standard,{id:'15071',quantity:50});
 assert.deepEqual(first.alternative,{id:'21560',quantity:1});
 assert.deepEqual(sword.find(r=>r.profile.char==='SWORDMAN2').standard,{id:'15071',quantity:100});
 const gyebaek=sword.find(r=>r.profile.char==='SWORDMAN10');
 assert.deepEqual(gyebaek.standard,{id:'827',quantity:2});
 assert.deepEqual(gyebaek.alternative,{id:'11045',quantity:2});
 const arthur=family('ARTHUR1'),branch=arthur.find(r=>r.profile.char==='ARTHUR7');
 assert.deepEqual(branch.next,[]);assert.equal(branch.standard,null);assert.equal(branch.alternative,null);
 const trans=family('MERLIN10').find(r=>r.profile.char==='MERLIN10');
 assert.deepEqual(trans.standard,{id:'10742',quantity:2});assert.equal(trans.alternative,null);assert.equal(trans.sameMaterial,true);
 assert.equal(family('MERLIN12').find(r=>r.profile.char==='MERLIN12').standard,null);
 const families=[...new Set(profiles.map(p=>p.baseGrade).filter(Boolean))];
 const records=families.flatMap(k=>family(k)),edges=records.flatMap(r=>r.next.map(n=>[r.profile.char,n]));
 assert.deepEqual(edges.map(JSON.stringify).sort(),m.edges.map(JSON.stringify).sort());
 assert.equal(records.filter(r=>r.next.length&&r.standard).length,816);
 assert.equal(records.filter(r=>r.sameMaterial).length,12);
 assert.equal(records.filter(r=>r.alternative?.id==='21559').length,721);
 assert.equal(records.filter(r=>r.alternative?.id==='21560').length,73);
 assert.equal(records.filter(r=>r.alternative?.id==='11045').length,10);
 for(const lang of LOCALE_IDS)for(const key of ['upgradeMaterial','alternativeMaterial','noExplicitUpgrade','sameUpgradeMaterial','evolutionCostNote','pvp','pvpBG','pvpNotice','pvp_PvPDefBaseRate'])assert.ok(referenceText(lang)[key]);
});
