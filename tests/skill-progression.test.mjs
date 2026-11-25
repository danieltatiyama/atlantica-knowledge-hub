import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {joinProgression,modeGradeSeries,historicalProjection,sampleLevels,MODES} from '../src/scripts/skill-progression.mjs';
import {progressionText,progressionField} from '../src/i18n/skill-progression-ui.mjs';
const baseBytes=readFileSync(process.env.BASE_MODES??'public/data/client-mercenaries/modes.json');
const base=JSON.parse(baseBytes),extra=JSON.parse(readFileSync('public/data/client-mercenaries/mode-progression.json'));
const data=joinProgression(base,extra);
test('exact source identity alignment and no source replacement',()=>{
 assert.equal(createHash('sha256').update(baseBytes).digest('hex'),extra.baseSha256);
 assert.equal(data.columns.length,51);assert.equal(Object.values(data.modes).flat().length,42602);
 for(const mode of MODES)assert.deepEqual(data.modes[mode].map(r=>r.slice(0,12)),base.modes[mode]);
 assert.equal(Object.values(data.modes).reduce((n,rows)=>n+new Set(rows.filter(r=>r[3]===1).map(r=>r[0]+'|'+r[1])).size,0),48);
 const altered={...extra,modes:{...extra.modes,Magic:[...extra.modes.Magic]}};altered.modes.Magic[0]=[...altered.modes.Magic[0]];altered.modes.Magic[0][2]=-1;assert.throws(()=>joinProgression(base,altered),/identity/);
});
test('Excalibur historic trigger sample, no clipping or extrapolation',()=>{
 for(const [level,value] of [[1,15],[20,72],[30,102],[60,192]])assert.equal(historicalProjection(data,'MAGIC_ARTHUREX',6,'Magic',level,'proc').value,value);
 assert.equal(historicalProjection(data,'MAGIC_ARTHUREX',6,'Magic',61,'proc'),null);
 assert.equal(historicalProjection(data,'MAGIC_ARTHUREX',9,'Magic',80,'proc').value,252);
 assert.equal(historicalProjection(data,'MAGIC_ARTHUREX',9,'MagicPVP',80,'proc'),null);
});
test('Silence of the Grave matches seven historical MDEF values and level-61 threshold',()=>{
 for(const [level,value] of [[20,-177],[30,-207],[40,-237],[50,-267],[60,-297],[70,-327],[80,-357]])assert.equal(historicalProjection(data,'MAGIC_REAPERSILENCE',9,'Magic',level,'mdef').value,value);
 assert.equal(historicalProjection(data,'MAGIC_REAPERSILENCE',9,'Magic',61,'proc').value,100);
 assert.equal(historicalProjection(data,'MAGIC_REAPERSILENCE',9,'Magic',80,'proc').value,119);
 assert.equal(historicalProjection(data,'MAGIC_BOILINGEARTH',9,'Magic',80,'proc'),null);
});
test('grade progression preserves conflict and absence',()=>{
 const rows=modeGradeSeries(data,'MAGIC_ARTHURBLACK','MagicPVPBattleGround','EndowedAmount_HP');const r=rows.find(r=>r.grade===9);assert.equal(r.conflict,true);assert.deepEqual(r.values,['-361','-399','-435']);assert.deepEqual(r.lines,[244,245,246]);
 assert.deepEqual(modeGradeSeries(data,'MAGIC_UNKNOWN','Magic','MotionProbability'),[]);
 assert.deepEqual(sampleLevels(25),[1,10,20,25]);
 assert.deepEqual(sampleLevels(0),[]);
});
test('eight localized headings and readable field labels',()=>{
 for(const lang of ['en','pt-br','fr','de','es','ko','zh-hans','ja'])assert.ok(Object.values(progressionText(lang)).every(s=>s.trim()));
 assert.match(progressionField('MotionProbability','pt-br'),/ativação/);
 assert.match(progressionField('EndowedAmountInc_STR*10','en'),/Strength.*increment.*×10/);
});
