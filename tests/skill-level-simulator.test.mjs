import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {joinBuffStats,buildPlayerRows,validLevel,defaultSkillLevel,skillSliderMax,skillLevelCaps,selectPreviewLevel,validIntelligence,intelligenceBonusLevels,STAT_GROUPS,parseSkillModes,filterPlayerRows} from '../src/scripts/skill-level-simulator.mjs';
import {joinProgression} from '../src/scripts/skill-progression.mjs';
import {joinSkillContext} from '../src/scripts/skill-context.mjs';
import {buildModeMatrix} from '../src/scripts/mercenary-reference.mjs';
import {levelText} from '../src/i18n/skill-level-ui.mjs';
import {compareSkillRows,availableSkillGrades,comparisonDelta} from '../src/scripts/skill-comparison.mjs';
import {comparisonText} from '../src/i18n/skill-comparison-ui.mjs';
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

test('Wicked Bill grade 11: six independently observed PvE HP tooltips at two INT values',()=>{
 const samples=[
  ['MAGIC_BETTING',62,9102,-746,-40,[-8146,-7386],850,-41.06,110],
  ['MAGIC_DEATHCOIN',62,9090,-630,-54,[-10620,-9594],850,-222.58,110],
  ['MAGIC_INSTINCET',80,9066,-1227,-49,[-11174,-10243],614,-292.7,80]
 ];
 let count=0;
 for(const [kind,level,line,base,inc,observed,mp,scaling,cap] of samples){
  const m=matrix(kind,11),plain=buildPlayerRows(m,data.columns,level);
  assert.equal(row(plain,'hp','base').values[0][0].value,base);
  assert.equal(row(plain,'hp','increment').values[0][0].value,inc);
  assert.equal(row(plain,'hp','total').values[0][0].line,line);
  assert.equal(row(plain,'mpcost','total').values[0][0].value,mp);
  assert.equal(row(plain,'scaling','total').values[0][0].value,scaling);
  assert.equal(defaultSkillLevel(m,data.columns),cap);
  for(const [i,int] of [9310,7893].entries()){
   const projected=buildPlayerRows(m,data.columns,level,int);
   const hp=row(projected,'hp','int-total');
   assert.equal(hp.values[0][0].value,observed[i]);
   assert.equal(hp.values[0][0].line,line);
   assert.ok(hp.values.slice(1).every(mode=>mode.every(x=>x.value===null)));
   assert.deepEqual(projected.filter(r=>r.kind!=='int-total'),plain);
   count++;
  }
 }
 assert.equal(count,6);
 assert.deepEqual([9310,7893].map(intelligenceBonusLevels),[124,105]);
});

test('combat mode selection is stable, ordered and cannot remove every mode',()=>{
 const modes=['Magic','MagicPVP','MagicPVPBattleGround','BF_Magic','BF_MagicPvP','BF_MagicPvPLeague'];
 assert.deepEqual(parseSkillModes(null,modes),modes);
 assert.deepEqual(parseSkillModes('bad,,',modes),modes);
 assert.deepEqual(parseSkillModes('BF_Magic,Magic,BF_Magic,unknown',modes),['Magic','BF_Magic']);
 const all=buildPlayerRows(matrix('MAGIC_ARTHUREX',11),data.columns,80,9950);
 assert.deepEqual(filterPlayerRows(all,[0,1,2,3,4,5]),all);
 const pve=filterPlayerRows(all,[0],true);
 assert.equal(row(pve,'hp','total').values[0][0].value,-3496);
 assert.equal(row(pve,'hp','int-total').values[0][0].value,-8248);
 assert.ok(!row(pve,'hp','base')&&!row(pve,'hp','increment'));
 assert.ok(pve.some(r=>r.field==='MaxTotalSkillLevel'));
 assert.ok(!row(filterPlayerRows(all,[1],true),'hp','int-total'));
 assert.equal(row(filterPlayerRows(all,[1],true),'hp','total').values[0][0].value,-2336);
});
test('totals-only preserves unresolved source alternatives and static fields',()=>{
 const val=(value,line)=>({value,line,aboveCap:false});
 const make=(key,kind,values)=>({key,kind,group:'combat',field:key,unit:'',values});
 const input=[
  make('hp','base',[[val(-20,1),val(-30,2)],[val(-5,3)]]),
  make('hp','increment',[[val(-2,1),val(-3,2)],[val(-1,3)]]),
  make('hp','total',[[val(-40,1),val(null,2)],[val(-15,3)]]),
  make('fixed','base',[[val(5,1)],[val(0,3)]]),
  make('static','raw',[[val('ALL',1)],[val('ALL',3)]])
 ];
 const before=JSON.stringify(input),pve=filterPlayerRows(input,[0],true);
 assert.ok(row(pve,'hp','base')&&row(pve,'hp','increment'));
 assert.equal(row(pve,'hp','total').values[0][1].value,null);
 assert.ok(row(pve,'fixed','base'));
 const pvp=filterPlayerRows(input,[1],true);
 assert.ok(!row(pvp,'hp','base')&&!row(pvp,'hp','increment')&&!row(pvp,'fixed','base'));
 assert.ok(row(pvp,'static','raw'));
 assert.equal(JSON.stringify(input),before);
});
test('view controls have eight localized dictionaries and preserve selected modes in URL',()=>{
 const script=readFileSync('src/scripts/mercenary-reference.mjs','utf8');
 for(const lang of ['en','pt-br','es','fr','de','ko','ja','zh-hans']){
  const labels=levelText(lang);
  for(const key of ['viewOptions','totalsOnly','modeSelection','allModes','expandAll','collapseAll','totalsNote','noStats'])assert.ok(labels[key]?.trim());
 }
 assert.ok(script.includes('next.searchParams.set("modes",selectedModes.join(","))'));
 assert.ok(script.includes('next.searchParams.set("totals","1")'));
 assert.ok(script.includes('toggle.setAttribute("aria-expanded",String(!closed))'));
 assert.ok(script.includes('gh.colSpan=1+columns.length'));
});

test('skill comparison uses independent grade, level, INT and one selected mode',()=>{
 const side=(kind,grade,level,intelligence,mode=0)=>({matrix:{columns:[matrix(kind,grade).columns[mode]]},level,intelligence});
 const result=compareSkillRows(side('MAGIC_ARTHUREX',11,80,9950),side('MAGIC_BETTING',11,62,9310),data.columns);
 assert.deepEqual(row(result,'hp','total').values.map(c=>c[0].value),[-3496,-3186]);
 assert.deepEqual(row(result,'hp','int-total').values.map(c=>c[0].value),[-8248,-8146]);
 assert.equal(comparisonDelta(row(result,'hp','int-total')),102);
 assert.ok(!row(result,'hp','base'));
 const same=compareSkillRows(side('MAGIC_ARTHUREX',11,1,0),side('MAGIC_ARTHUREX',11,80,9950),data.columns,{totalsOnly:false});
 assert.deepEqual(row(same,'hp','base').values.map(c=>c[0].value),[-652,-652]);
 assert.deepEqual(row(same,'hp','int-total').values.map(c=>c[0].value),[-652,-8248]);
 const pvp=compareSkillRows(side('MAGIC_ARTHUREX',11,80,9950,1),side('MAGIC_ARTHUREX',11,80,0,1),data.columns);
 assert.ok(!row(pvp,'hp','int-total'));
 assert.deepEqual(availableSkillGrades(data,'MAGIC_BETTING'),[0,1,2,3,4,5,6,7,8,9,10,11]);
});
test('comparison distinguishes explicit zero from missing and keeps unresolved alternatives',()=>{
 const side=(kind,grade,level,mode=0)=>({matrix:{columns:[matrix(kind,grade).columns[mode]]},level,intelligence:0});
 const missing={matrix:{columns:[{source:'Magic',rows:[],conflict:false,lines:[]}]},level:80,intelligence:0};
 const result=compareSkillRows(side('MAGIC_ARTHUREX',11,80),missing,data.columns);
 assert.deepEqual(row(result,'hp','total').values[1],[]);
 assert.equal(comparisonDelta(row(result,'hp','total')),null);
 const cols=data.columns,record=Array(cols.length).fill('0');record[2]=1;
 const other=[...record];other[2]=2;other[cols.indexOf('EndowedAmount_HP')]='10';other[cols.indexOf('EndowedAmountInc_HP')]='2';
 const fixture=r=>({matrix:{columns:[{source:'Magic',rows:[r]}]},level:2,intelligence:0});
 const zero=compareSkillRows(fixture(record),fixture(other),cols);
 assert.deepEqual(row(zero,'hp','total').values.map(c=>c[0].value),[0,12]);
 assert.equal(comparisonDelta(row(zero,'hp','total')),12);
 const conflict=compareSkillRows(side('MAGIC_ARTHURBLACK',9,20,2),side('MAGIC_ARTHUREX',11,20,2),cols);
 assert.deepEqual(row(conflict,'hp','total').values[0].map(x=>x.line),[244,245,246]);
 assert.equal(comparisonDelta(row(conflict,'hp','total'),[true,false]),null);
 const modifier=[...other];modifier[cols.indexOf('EndowedAmount_Immune')]='10';modifier[cols.indexOf('EndowedAmount_ImmuneIncRaw')]='1';
 const unresolved=compareSkillRows(fixture(record),fixture(modifier),cols);
 assert.ok(row(unresolved,'modifier','base')&&row(unresolved,'modifier','increment'));
 assert.equal(comparisonDelta(row(unresolved,'modifier','total')),null);
});
test('comparison labels cover eight locales and comparison is opt-in within skill page',()=>{
 for(const lang of ['en','pt-br','es','fr','de','ko','ja','zh-hans'])assert.ok(Object.values(comparisonText(lang)).every(v=>v.trim()));
 const script=readFileSync('src/scripts/skill-comparison.mjs','utf8');
 assert.ok(script.includes("detail.open=byId.has(params.get('compareSkillB'))"));
 assert.ok(script.includes("compareGrade"));
 assert.ok(script.includes("compareInt"));
 assert.ok(script.includes("compareMode"));
});
