// Shared by the map catalog and monster profiles. No inferred dungeon propagation.
export const mapDisplayName = (map,unknown='Unresolved map') => map.name ?? `${unknown} #${map.id}`;
export const mapHref = (prefix,id,area) => `${prefix}/maps/?id=${encodeURIComponent(id)}`+(area===undefined?'':`&area=${encodeURIComponent(area)}`);
export function monsterMapLocations(data,charId){
 const id=Number(charId);
 return Object.values(data.maps).filter(m=>m.monsters.includes(id)).sort((a,b)=>
  (a.name??'').localeCompare(b.name??'','en')||a.id-b.id);
}
export function mapCatalogResults(data,query='',mode=''){
 const q=String(query).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
 const match=value=>!q||String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().includes(q);
 const mapMatches=map=>match(map.id)||match(map.name)||map.monsters.some(id=>match(id)||match(data.monsters[id]?.name));
 const areas=data.areas.filter(a=>(!mode||a.mode===mode)&&
  (match(a.name)||match(a.id)||a.sections.some(id=>mapMatches(data.maps[id]))));
 const others=mode?[]:Object.values(data.maps).filter(m=>!m.areas.length&&mapMatches(m));
 return {areas:areas.sort((a,b)=>a.name.localeCompare(b.name,'en')),others:others.sort((a,b)=>(a.name??'').localeCompare(b.name??'','en')||a.id-b.id)};
}
