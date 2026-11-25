import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {joinBuffStats,buildPlayerRows,validLevel,defaultSkillLevel,skillSliderMax,skillLevelCaps,selectPreviewLevel,validIntelligence,intelligenceBonusLevels,STAT_GROUPS} from '../src/scripts/skill-level-simulator.mjs';
import {joinProgression} from '../src/scripts/skill-progression.mjs';
import {joinSkillContext} from '../src/scripts/skill-context.mjs';
import {buildModeMatrix} from '../src/scripts/mercenary-reference.mjs';
import {levelText} from '../src/i18n/skill-level-ui.mjs';
const read=n=>JSON.parse(readFileSync('public/data/client-mercenaries/'+n+'.json'));
const base=joinSkillContext(joinProgression(read('modes'),read('mode-progression')),read('skill-context'));
const buff=read('skill-buff-stats'),data=joinBuffStats(base,buff);
const matrix=(kind,grade)=>buildModeMatrix(data,kind,grade);
const rows=(kind,grade,level)=>buildPlayerRows(matrix(kind,grade),data.columns,level);
const row=(r,key,kind)=>r.find(x=>x.key===key&&x.kind===kind);
test('five additional fields match the exact source export and preserve all original cells',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(buff.runs)).digest('hex'),'aed848a9d23413a6fc2f9d2b80ec818f656c33b102fc0d02f89515df63567485');
 assert.equal(data.columns.length,70);assert.equal(Object.values(data.modes).flat().length,42602);
 for(const [mode,rr] of Object.entries(data.modes))assert.deepEqual(rr.map(r=>r.slice(0,65)),base.modes[mode]);
 const bad=structuredClone(buff);bad.runs.Magic[0][0]=1;assert.throws(()=>joinBuffStats(base,bad));
});
test('grade 11 Excalibur source projection matches MP and attack scaling, not final game HP',()=>{
 const r=rows('MAGIC_ARTHUREX',11,80),v=(k,t)=>row(r,k,t).values[0][0].value;
 assert.equal(v('proc','base'),15);assert.equal(v('proc','increment'),3);assert.equal(v('proc','total'),252);
 assert.equal(v('scaling','base'),-13);assert.equal(v('scaling','increment'),-.48);assert.equal(v('scaling','total'),-50.92);
 assert.equal(v('mpcost','total'),432);assert.equal(v('hp','total'),-3496);
 assert.ok(!r.some(x=>['Probability','ProbabilityInc*10','EndowedAmount_MDEF','EndowedTurn','ActivePower'].includes(x.field)));
 assert.equal(defaultSkillLevel(matrix('MAGIC_ARTHUREX',11),data.columns),80);
});
test('level 1 equals base, distinct grades and conflicts keep source-row alignment',()=>{
 const m=matrix('MAGIC_ARTHURBLACK',9),r=buildPlayerRows(m,data.columns,20);
 const hp=row(r,'hp','total').values[2];
 assert.deepEqual(hp.map(v=>v.value),[-684,-741,-796]);assert.deepEqual(hp.map(v=>v.line),[244,245,246]);
 assert.equal(row(rows('MAGIC_ARTHURBLACK',9,1),'hp','total').values[2][0].value,-361);
 assert.notEqual(row(rows('MAGIC_ARTHUREX',9,80),'hp','total').values[0][0].value,-3496);
 assert.ok(row(rows('MAGIC_ARTHUREX',11,81),'hp','total').values[0][0].aboveCap);
});
test('all macro-derived paired status fields included, and nonzero values are never hidden',()=>{
 for(const k of ['accuracy','evasion','multihit','critical','ap','combo','modifier','str','dex','vit','int'])assert.ok(STAT_GROUPS.some(s=>s.key===k&&data.columns.includes(s.base)&&data.columns.includes(s.inc)));
 const cols=data.columns,record=Array(cols.length).fill('0');record[2]=1;
 for(const s of STAT_GROUPS){record[cols.indexOf(s.base)]='10';record[cols.indexOf(s.inc)]='10';}
 const fixture={columns:[{source:'Magic',rows:[record]},{source:'MagicPVP',rows:[record]},{source:'BF_Magic',rows:[]}]};
 const r=buildPlayerRows(fixture,cols,2);
 assert.equal(row(r,'combo','total').values[0][0].value,11);
 assert.equal(row(r,'modifier','total').values[0][0].value,null);assert.equal(row(r,'modifier','total').values[1][0].value,11);
 assert.equal(row(r,'critical','total').values[0][0].value,11);
 assert.deepEqual(row(r,'critical','total').values[2],[]);
});
test('validated level text and eight localized control dictionaries',()=>{
 for(const x of ['','-1','0','1.5','1e2','1001','abc'])assert.equal(validLevel(x),null);
 assert.equal(validLevel('80'),80);
 for(const lang of ['en','pt-br','es','fr','de','ko','ja','zh-hans'])assert.ok(Object.values(levelText(lang)).every(v=>v.trim()));
});

test('slider follows grade cap and permits explicit above-cap text previews',()=>{
 const m=matrix('MAGIC_ARTHUREX',11);
 assert.equal(skillSliderMax(m,data.columns,1),80);
 assert.equal(skillSliderMax(m,data.columns,80),80);
 assert.equal(skillSliderMax(m,data.columns,110),110);
 assert.equal(skillSliderMax(m,data.columns,1001),80);
 const empty={columns:[{rows:[]}]};
 assert.equal(skillSliderMax(empty,data.columns,1),1);
 assert.equal(skillSliderMax(empty,data.columns,80),80);
});
test('skill table controls stay synchronized and sticky header is scoped to the player matrix',()=>{
 const script=readFileSync('src/scripts/mercenary-reference.mjs','utf8');
 const style=readFileSync('src/components/MercenaryReferencePage.astro','utf8');
 assert.ok(script.includes('slider.addEventListener("input"'));
 assert.ok(script.includes('if(fromSlider)input.value=String(n);else syncSliderRange()'));
 assert.ok(script.includes('wrap.scrollLeft=left;wrap.scrollTop=top'));
 assert.ok(style.includes('@container skill-matrix (min-width:860px)'));
 assert.ok(style.includes('.ref-player-table-wrap thead th'));
 assert.ok(style.includes('tbody + tbody .ref-stat-group th'));
});

test('Betting cap distinguishes books and charms in all six modes, by grade',()=>{
 for(const [grade,book,total] of [[0,60,90],[5,70,100],[7,80,110],[11,80,110]]){
  const m=matrix('MAGIC_BETTING',grade);assert.equal(m.columns.filter(c=>c.rows.length).length,6);
  assert.deepEqual(skillLevelCaps(m,data.columns),{book:[book],total:[total]});
  assert.equal(skillSliderMax(m,data.columns,80),Math.max(80,total));
 }
 assert.equal(selectPreviewLevel(null,null,110,80,false),80);
 assert.equal(selectPreviewLevel(80,80,110,null,true),110);
 assert.equal(selectPreviewLevel(90,90,110,null,false),110);
 assert.equal(selectPreviewLevel(50,90,110,null,false),50);
});
test('INT floor / 75 reproduces all 13 visible Arthur observations, with unchanged other stats',()=>{
 const samples=[
 ['MAGIC_ARTHUREX',80,[-8248,-7672,-6664]],
 ['MAGIC_ARTHURSH',36,[1767,1655,1459]],
 ['MAGIC_ARTHURCOMMON',80,[46745,43225,null]],
 ['MAGIC_ARTHURBLACK',40,[-8587,-7835,-6519]],
 ['MAGIC_ARTHURORDER',20,[-3748,-3380,null]]
 ];
 let count=0;
 for(const [kind,lv,expected] of samples){
  const m=matrix(kind,11),plain=buildPlayerRows(m,data.columns,lv);
  assert.ok(!row(plain,'hp','int-total'));
  for(const [i,int] of [9950,8739,6669].entries()){
   const projected=buildPlayerRows(m,data.columns,lv,int),hp=row(projected,'hp','int-total');
   if(expected[i]!==null){assert.equal(hp.values[0][0].value,expected[i]);count++;}
   for(const mode of hp.values.slice(1))assert.ok(mode.every(x=>x.value===null));
   assert.deepEqual(projected.filter(r=>r.kind!=='int-total'),plain);
  }
 }
 assert.equal(count,13);
 assert.deepEqual([9950,8739,6669].map(intelligenceBonusLevels),[132,116,88]);
 assert.equal(intelligenceBonusLevels(9899),131);assert.equal(intelligenceBonusLevels(9900),132);
 for(const v of ['-1','1.5','1e2','','1000001'])assert.equal(validIntelligence(v),null);
 assert.equal(validIntelligence('0'),0);
});

test('Merlin grade 11: 14 independently observed PvE HP tooltips at three INT values',()=>{
 const samples=[
  ['MAGIC_MERDARK',61,5049,-571,-47,[-15188,null,-11992]],
  ['MAGIC_MERDESTROY',2,5073,1460,30,[9020,7670,6980]],
  ['MAGIC_MERAPPOINT',60,5037,828,15,[5478,4803,4458]],
  ['MAGIC_MERGUARD',62,5097,300,15,[4980,4305,3960]],
  ['MAGIC_MERDARKEX',78,5061,-128,-12,[-4064,-3524,-3248]]
 ];
 let count=0;
 for(const [kind,level,line,base,inc,observed] of samples){
  const m=matrix(kind,11),plain=buildPlayerRows(m,data.columns,level);
  assert.equal(row(plain,'hp','base').values[0][0].value,base);
  assert.equal(row(plain,'hp','increment').values[0][0].value,inc);
  assert.equal(row(plain,'hp','total').values[0][0].line,line);
  for(const [i,int] of [18854,15507,13725].entries()){
   if(observed[i]===null)continue;
   const projected=buildPlayerRows(m,data.columns,level,int);
   const hp=row(projected,'hp','int-total');
   assert.equal(hp.values[0][0].value,observed[i]);
   assert.equal(hp.values[0][0].line,line);
   assert.ok(hp.values.slice(1).every(mode=>mode.every(x=>x.value===null)));
   assert.deepEqual(projected.filter(r=>r.kind!=='int-total'),plain);
   count++;
  }
 }
 assert.equal(count,14);
 assert.deepEqual([18854,15507,13725].map(intelligenceBonusLevels),[251,206,183]);
 assert.equal(intelligenceBonusLevels(13724),182);
 assert.equal(intelligenceBonusLevels(13725),183);
 // Gwendolen's Touch has two separate source identities; the healing sample
 // is MAGIC_MERDESTROY (1118), never the zero-HP alternate (1119).
 const alternate=buildPlayerRows(matrix('MAGIC_MERDESTROY2',11),data.columns,2,18854);
 assert.ok(!row(alternate,'hp','int-total'));
});
