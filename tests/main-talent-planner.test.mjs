import test from 'node:test';
import assert from 'node:assert/strict';
import {TALENT_GROUPS,TALENT_ROWS,TALENT_TIERS,talentRows} from '../src/data/main-talent-source.mjs';
import {emptyTalentPlan,validateTalentPlan,summarizeTalentPlan,encodeTalentPlan,decodeTalentPlan} from '../src/data/main-talent-planner.mjs';
import {talentText} from '../src/i18n/main-talent-ui.mjs';
test('198 exact identities, 11 groups, six tiers with three slots each',()=>{
 assert.equal(TALENT_ROWS.length,198);assert.equal(new Set(TALENT_ROWS.map(r=>r[0])).size,198);assert.equal(TALENT_GROUPS.length,11);
 for(const g of TALENT_GROUPS){const rows=talentRows(g.id);assert.equal(rows.length,18);for(const tier of TALENT_TIERS){const rr=rows.filter(r=>r[2]===tier);assert.equal(rr.length,3);assert.ok(rr.every(r=>r[4]===(tier===180?20:10)&&r[5]===1&&r[1]===g.weapon));}assert.equal(summarizeTalentPlan(emptyTalentPlan(g.id)).capacity,210);}
});
test('Bow and Celestial Hunter keep independent talent identities and names',()=>{
 const bow=TALENT_GROUPS.find(g=>g.id==='BOW'),hunter=TALENT_GROUPS.find(g=>g.id==='SHBOW');assert.equal(bow.weapon,hunter.weapon);assert.equal(hunter.label,'Celestial Hunter');assert.equal(talentRows('SHBOW').find(r=>r[0]==='SHBOWSUB130')[3],'One with Nature');assert.equal(talentRows('BOW').find(r=>r[0]==='BOWSUB130')[3],'Magic Mastery');assert.throws(()=>validateTalentPlan({...emptyTalentPlan('BOW'),levels:{SHBOWATK130:1}}));
});
test('Mage allocation validates costs, caps and level gates separately',()=>{
 const p={...emptyTalentPlan(),characterLevel:170,budget:12,levels:{STFATK130:10,STFSUB180:4}};const s=summarizeTalentPlan(p);assert.equal(s.spent,14);assert.equal(s.remaining,-2);assert.equal(s.withinBudget,false);assert.deepEqual(s.belowLevel,['STFSUB180']);assert.throws(()=>validateTalentPlan({...p,levels:{STFATK130:11}}));assert.throws(()=>validateTalentPlan({...p,levels:{STFATK130:1.5}}));
});
test('shareable links are versioned and reject malformed, foreign or duplicate entries',()=>{
 for(const g of TALENT_GROUPS){const p={...emptyTalentPlan(g.id),budget:30,levels:{[talentRows(g.id)[0][0]]:10,[talentRows(g.id)[17][0]]:20}};assert.deepEqual(decodeTalentPlan(encodeTalentPlan(p)),p);}
 for(const raw of ['','v2~STF~180~0','v1~BAD~180~0','v1~STF~180~0~0.11','v1~STF~180~0~0.1~0.2','v1~STF~180~0~18.1','v1~STF~0~0'])assert.throws(()=>decodeTalentPlan(raw));
});
test('all eight locale dictionaries contain the same nonempty keys',()=>{
 const keys=Object.keys(talentText('en'));for(const lang of ['en','pt-br','fr','de','es','ko','zh-hans','ja']){assert.deepEqual(Object.keys(talentText(lang)),keys);assert.ok(Object.values(talentText(lang)).every(v=>v.trim()));}
});
