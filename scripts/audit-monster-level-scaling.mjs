#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {MAIN_LEVEL_CREATURES} from '../src/data/monster-level-policy.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const root='public/data/client-monsters/',manifest=read(root+'manifest.json');
const index=manifest.files.index.flatMap(p=>read(root+p).rows);
const loot=Object.assign({},...manifest.files.loot.map(p=>read(root+p).items));
const groups=Object.assign({},...manifest.files.groups.map(p=>read(root+p).items));
const candidates=[];
for(const row of index){
 if(row[2]!=='1')continue;
 const refs=(loot[row[0]]?.groups??[]).filter(ref=>(groups[ref[1]]?.bands.length??0)>1);
 if(!refs.length)continue;
 const confirmed=MAIN_LEVEL_CREATURES.some(c=>c.id===row[0]&&c.kind===row[3]);
 candidates.push({id:row[0],name:row[1],kind:row[3],rawLevel:row[2],status:confirmed?'player-confirmed':'unconfirmed-candidate',groups:refs.map(ref=>({id:ref[1],bands:groups[ref[1]].bands.map(b=>({band:b[1],minimumLevel:b[2]}))}))});
}
const report={rule:'Recorded level 1 and at least one referenced group with multiple bands. This is a review heuristic, not proof of adaptive level; it cannot find every scaled spawn or map rule.',confirmed:candidates.filter(c=>c.status==='player-confirmed').length,unconfirmed:candidates.filter(c=>c.status!=='player-confirmed').length,scanned:index.length,rows:candidates};
mkdirSync('docs/research',{recursive:true});
writeFileSync('docs/research/monster-level-scaling-candidates.json',JSON.stringify(report,null,2)+'\n');
const csv=['CharID,Name,Kind,Status,GroupIDs',...candidates.map(r=>[r.id,r.name,r.kind,r.status,r.groups.map(g=>g.id).join(';')].map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n';
writeFileSync('docs/research/monster-level-scaling-candidates.csv',csv);
console.log({scanned:report.scanned,confirmed:report.confirmed,unconfirmed:report.unconfirmed});
