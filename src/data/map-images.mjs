export function sectionMapImage(library,map){
 if(map.image)return {...map.image,association:'reviewed'};
 const ids=library?.mapCandidates?.[map.id]??[];
 return ids.length===1&&library.assets[ids[0]]?{...library.assets[ids[0]],association:'client-type'}:null;
}
export function mapImageResults(library,{query='',scope='',mapId='',sort='name'}={}){
 const normalize=s=>String(s??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 const q=normalize(query).trim(),groups=new Map();
 for(const origin of library.origins){
  if(scope&&origin.scope!==scope||mapId&&!origin.mapIds.includes(Number(mapId)))continue;
  const names=origin.mapIds.map(id=>library.mapNames[id]);
  if(q&&!normalize([origin.sourcePath,...origin.mapIds,...names].join(' ')).includes(q))continue;
  if(!groups.has(origin.assetId))groups.set(origin.assetId,{...library.assets[origin.assetId],origins:[]});
  groups.get(origin.assetId).origins.push(origin);
 }
 return [...groups.values()].sort((a,b)=>(sort==='size'?b.bytes-a.bytes:sort==='dimensions'?b.width*b.height-a.width*a.height:a.origins[0].folder.localeCompare(b.origins[0].folder,'en',{numeric:true}))||a.id.localeCompare(b.id));
}
