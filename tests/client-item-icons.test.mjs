import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
import {itemIconReference} from '../src/data/client-item-icons.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const map=JSON.parse(read('src/data/client-item-icons.json'));
const manifest=JSON.parse(read('public/data/client-item-icons.json'));

test('published icon mapping covers only reconciled identities and available sheets',()=>{
  const meta=JSON.parse(read('public/data/client-items/manifest.json'));
  const named=new Set(meta.indexShards.flatMap(s=>JSON.parse(read('public/data/client-items/'+s)).rows).filter(r=>r[6]==='named').map(r=>r[0]));
  assert.equal(Object.keys(map).length,22483);
  assert.equal(manifest.publishedIds,Object.keys(map).length);
  assert.equal(manifest.extractedIds,manifest.publishedIds+manifest.excluded.length);
  const sheets=new Set(manifest.sheets.map(s=>s.sheet));
  for(const [id,[sheet,index]] of Object.entries(map)){
    assert.ok(named.has(id),id);assert.ok(sheets.has(sheet));assert.ok(Number.isInteger(index)&&index>=0&&index<120);
  }
  for(const row of manifest.excluded)assert.equal(itemIconReference(row.itemId),null);
  assert.equal(manifest.excluded.filter(r=>r.reason==='conflicting-references').length,303);
  assert.equal(itemIconReference(8144),null);
  for(const s of manifest.sheets){
    const b=readFileSync(new URL('../public/images/client-items/'+s.sheet+'.webp',import.meta.url));
    assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
    assert.equal(b.length,s.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),s.sha256);
  }
});
test('zero-based sprite coordinates reproduce confirmed crystal anchors',()=>{
  assert.deepEqual(itemIconReference(15005),{sheet:5,index:5,x:200,y:0,url:'/images/client-items/5.webp'});
  assert.equal(itemIconReference(15071).x,320);assert.equal(itemIconReference(15071).y,440);
  for(const id of [null,undefined,'__proto__','../5','0015005',-1,0,999999999999])assert.equal(itemIconReference(id),null);
});
test('decorative icon keeps text, uses scaled coordinates and leaves absent references untouched',()=>{
  const source=read('src/lib/client-item-icons.ts').replace(/^import .*;\s*$/gm,'');
  const code=transformSync(source,{loader:'ts',format:'cjs'}).code;
  const module={exports:{}};
  vm.runInNewContext(code,{module,document:{createElement:()=>({style:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;}})},itemIconReference});
  const parent={textContent:'Giant Crystal',children:[],classes:[],classList:{add(c){parent.classes.push(c);}},prepend(n){this.children.unshift(n);}};
  module.exports.prependItemIcon(parent,15005,64);
  assert.equal(parent.textContent,'Giant Crystal');assert.equal(parent.children.length,1);
  const icon=parent.children[0];assert.equal(icon.attributes['aria-hidden'],'true');
  assert.equal(icon.style.backgroundPosition,'-320px 0px');assert.equal(icon.style.width,'64px');
  module.exports.prependItemIcon(parent,8144);assert.equal(parent.children.length,1);
});
