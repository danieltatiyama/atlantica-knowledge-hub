import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBookCandidates,parseBookName,readCatalog} from '../scripts/audit-client-skill-books.mjs';

const pilot=[
  [547,538,'Healing Pulse'],[548,539,'Arms of Atlantis'],[549,540,'Oriharukon Core'],
  [763,758,'Preemptive Strike'],[764,759,'Demeian Tactics'],[765,760,'Flashbang'],
  [792,784,'Carnage'],[793,785,'Morale Boost'],[794,786,'Blood Vendetta'],
  [914,906,'Evergreen Grace'],[915,907,'Shackles of the Thicket'],[916,908,'Wildwood Regeneration'],
  [987,979,'Mantle of Death'],[988,980,"Demon's Sickle"],[989,981,'Silence of the Grave'],
  [991,983,'Sage Sword Excalibur'],[992,984,"King's Command"],[993,985,'Guardian Sheath'],
  [994,986,"Sage King's Dignity"],[995,987,'Dark Legacy']
].map(([skillIndex,magicCode,englishName])=>({skillIndex,magicCode,englishName}));

test('book labels remain distinct from skill grade and raw suffix is preserved',()=>{
  assert.deepEqual(parseBookName('Magic Book: Dark Legacy [Lv.3] (No trade)'),
    {stem:'Dark Legacy',bookRankLabel:'Lv.3',rawSuffix:' (No trade)'});
  assert.deepEqual(parseBookName('Spellbook: Dark Legacy (IV)[No Trade]'),
    {stem:'Dark Legacy',bookRankLabel:'IV',rawSuffix:'[No Trade]'});
  for(const s of ['Dark Legacy','Book of Experience','Book: Dark Legacy IV',
    'Book: Dark Legacy [I] (Unknown)','Book: Dark Legacy [I]\n']) assert.equal(parseBookName(s),null);
});

test('ambiguous and unknown candidates are held; category and name identity are required',()=>{
  const row=(id,name,category='Book',state='named')=>[id,name,category,0,0,1,state];
  const result=buildBookCandidates([pilot.at(-1),{skillIndex:2000,magicCode:2001,englishName:'Dark Legacy'}],[
    row('1','Book: Dark Legacy [I]'),row('2','Book: dark legacy [I]'),
    row('3','Book: Dark Legacy [II]','Etc'),row('4','Book: Dark Legacy [I]','Book','collision'),
    row('5','Book: Experience [I]')]);
  assert.equal(result.counts.ambiguous,1);
  assert.deepEqual(result.records[0].candidates.map(s=>s.skillIndex),[995,2000]);
  assert.equal(result.counts.unmatched,2);
  assert.equal(result.counts.unparsed,1);
  assert.equal(result.counts.unique,0);
  assert.throws(()=>buildBookCandidates(pilot,[row('1','Book: Dark Legacy [I]'),row('1','Book: Other [I]')]));
  assert.throws(()=>buildBookCandidates([pilot[0],pilot[0]],[]));
});

test('actual snapshot 1: conservative book pattern and 20-skill pilot',()=>{
  const {rows}=readCatalog('public/data/client-items');
  const r=buildBookCandidates(pilot,rows);
  assert.equal(r.counts.totalBooks,1990);
  assert.equal(r.counts.parsedBooks,1576);
  assert.equal(r.counts.distinctStems,272);
  assert.equal(r.counts.unique,148);
  assert.equal(r.counts.ambiguous,0); // pilot only; full input may be ambiguous
  const dark=r.records.filter(x=>x.candidates.some(s=>s.skillIndex===995));
  assert.deepEqual(dark.map(x=>x.itemId).sort((a,b)=>Number(a)-Number(b)),
    ['10818','11376','21059','21226','21227','21228','21229']);
  assert.equal(r.records.filter(x=>x.candidates.some(s=>s.skillIndex>=991&&s.skillIndex<=995)).length,28);
});
