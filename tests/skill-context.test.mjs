import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {joinSkillContext,comboReferences,combosForSkill,CONTEXT_FIELDS} from '../src/scripts/skill-context.mjs';
import {contextField,contextText,contextValue} from '../src/i18n/skill-context-ui.mjs';
import {joinProgression} from '../src/scripts/skill-progression.mjs';
const read=p=>readFileSync(p),parse=b=>JSON.parse(b),sha=b=>createHash('sha256').update(b).digest('hex');
const prefix='public/data/client-mercenaries/';
const baseBytes=read(process.env.BASE_MODES??prefix+'modes.json'),skillBytes=read(process.env.BASE_SKILLS??prefix+'skills.json'),extraBytes=read(prefix+'skill-context.json'),ext=JSON.parse(extraBytes),base=parse(baseBytes),s=parse(skillBytes),skills=s.rows.map(r=>Object.fromEntries(s.columns.map((k,i)=>[k,r[i]]))),full=joinProgression(base,parse(read(process.env.PROGRESSION_DATA??prefix+'mode-progression.json'))),joined=joinSkillContext(full,ext),combos=comboReferences(ext,skills);
test('context projection has exact aligned identities, hashes and 14 fields',()=>{
 assert.equal(sha(baseBytes),ext.baseSha256);assert.equal(sha(skillBytes),ext.skillsSha256);assert.equal(sha(extraBytes),'b329542d56695a392edac72eccc12ea002f6062bfccbb2c782751bf021f65131');
 assert.equal(ext.dictionary.length,1114);assert.equal(CONTEXT_FIELDS.length,14);assert.equal(joined.columns.length,65);assert.equal(Object.values(joined.modes).flat().length,42602);
 for(const mode of Object.keys(base.modes))assert.deepEqual(joined.modes[mode].map(r=>r.slice(0,full.columns.length)),full.modes[mode]);
});
test('target codes remain distinct for four documented skills',()=>{
 const get=kind=>{const r=joined.modes.Magic.find(r=>r[0]===kind&&r[1]===9);return Object.fromEntries(joined.columns.map((k,i)=>[k,r[i]]));};
 assert.deepEqual([get('MAGIC_ARTHUREX').Grid,get('MAGIC_REAPERSILENCE').Grid,get('MAGIC_BOILINGEARTH').EndowedObj,get('MAGIC_ARTHURBLACK').Grid],['AT_GRID_ALL','AT_GRID_LINE','ENEMYMELEE','AT_GRID_COLUMN']);
 assert.equal(get('MAGIC_REAPERSILENCE').Reach,'AT_REACH_0');assert.equal(contextValue('Reach','AT_REACH_0','pt-br'),'AT_REACH_0');
});
test('all 28 explicit combos link exact skill identities in the stored direction',()=>{
 assert.equal(combos.length,28);assert.equal(new Set(combos.flatMap(c=>[c.original.magicKind,c.added.magicKind,c.result.magicKind])).size,64);
 const [r]=combosForSkill(combos,'MAGIC_REAPERSILENCE');assert.deepEqual([r.line,r.original.skillIndex,r.added.skillIndex,r.result.skillIndex],[23,989,629,990]);
 assert.deepEqual(combosForSkill(combos,'UNKNOWN'),[]);assert.throws(()=>comboReferences(ext,skills.filter(s=>s.magicKind!=='MAGIC_REAPERSILENCE')),/ambiguous/);
});
test('conflicts and invalid references fail closed',()=>{
 const broken={...ext,modes:{...ext.modes,Magic:[...ext.modes.Magic]}};broken.modes.Magic[0]=[...broken.modes.Magic[0]];broken.modes.Magic[0][4]=-1;assert.throws(()=>joinSkillContext(full,broken),/dictionary index/);
 const r=joined.modes.MagicPVPBattleGround.filter(r=>r[0]==='MAGIC_ARTHURBLACK'&&r[1]===9);assert.equal(r.length,3);assert.ok(r.every(x=>x[3]===1));assert.deepEqual(r.map(x=>x[4]),['-361','-399','-435']);
});
test('localized headings and safe token naming',()=>{
 for(const lang of ['en','pt-br','fr','de','es','ko','zh-hans','ja'])assert.ok(Object.values(contextText(lang)).every(x=>x.trim()));
 for(const f of CONTEXT_FIELDS)assert.ok(contextField(f,'pt-br')&&contextField(f,'en'));
 assert.equal(contextValue('Grid','AT_GRID_STTWO','en'),'AT_GRID_STTWO');assert.equal(contextValue('EndowedObj','ENEMY','pt-br'),'Inimigo (ENEMY)');
});
