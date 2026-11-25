import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateReference} from '../src/scripts/mercenary-reference.mjs';
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
  assert.equal(skillList.reduce((n,s)=>n+s.books.length,0),1783);
  assert.equal(Object.values(v.modes).reduce((n,rows)=>n+new Set(rows.filter(r=>r[3]===1).map(r=>r[0]+'|'+r[1])).size,0),48);
  assert.equal(profiles.filter(p=>p.awakening).length,90);
  assert.equal(validateReference(m,s,null).profiles.length,947);
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
