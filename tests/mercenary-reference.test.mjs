import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateReference,filterReference,classRelatedProfiles} from '../src/scripts/mercenary-reference.mjs';
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
  const pins={mercenaries:'69ea9e0ca8de22852bdcab29184fa2a619a841f0940e6df0383e6233df7a5421',skills:'8bc9c76e03afaa7f8d6fc0f85efd3dbc7fd623965b8fc2b243e62a5d95fb3488',modes:'c2eaf8f3f2291986996f245c12aed9116d5d7acd3d8814e37c522a37c472b361'};
  for(const [k,h] of Object.entries(pins))assert.equal(createHash('sha256').update(read(k)).digest('hex'),h);
  assert.equal(new Set(profiles.map(p=>p.baseGrade).filter(Boolean)).size,122);
  assert.equal(new Set(profiles.map(p=>p.classToken)).size,95);
  assert.equal(profiles.filter(p=>p.awakening).length,90);
  assert.equal(skillList.filter(p=>p.books.length).length,320);
  const books=skillList.flatMap(p=>p.books);assert.equal(books.length,1783);assert.equal(new Set(books.map(b=>b[0])).size,1783);
  assert.equal(Object.values(v.modes).reduce((n,rows)=>n+new Set(rows.filter(r=>r[3]).map(r=>r[0]+":"+r[1])).size,0),48);
  assert.equal(skillList.filter(p=>!v.modes.Magic.some(r=>r[0]===p.magicKind)).length,26);
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
  for(const section of ['database','skills'])assert.equal(languageDestination({lang,path:'/mercenaries/'+section+'/'}),(lang==='en'?'':'/'+lang)+'/mercenaries/'+section+'/');
 }
});

test('filters preserve exact identities and family, rank, book evidence',()=>{
 const {profiles,skillList}=validateReference(m,s,v);
 assert.equal(filterReference(profiles,{family:'ARTHUR1'}).length,17);
 assert.equal(filterReference(profiles,{family:'ARTHUR1',rank:'S'}).length,10);
 assert.equal(filterReference(profiles,{query:'WHITEARTHUR5'})[0].char,'WHITEARTHUR5');
 const dark=skillList.find(r=>r.skillIndex===995);
 const related=classRelatedProfiles(profiles,dark);
 assert.equal(related.length,5);
 assert.ok(related.every(p=>p.classToken==='CLS1_BLACKARTHUR'));
 assert.equal(filterReference(skillList,{query:'Dark Legacy',bookFilter:'yes'}).some(r=>r.skillIndex===995),true);
 assert.equal(filterReference(skillList,{query:'Dark Legacy',bookFilter:'no'}).some(r=>r.skillIndex===995),false);
 const duplicates=[{name:'Same',skillIndex:1,books:[]},{name:'Same',skillIndex:2,books:[]}];
 assert.equal(filterReference(duplicates,{query:'same'}).length,2);
});
