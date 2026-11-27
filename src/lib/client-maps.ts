import {monsterMapLocations,mapDisplayName,mapHref} from '../data/client-maps.mjs';
import {mapText} from '../i18n/maps-ui.mjs';
let pending:Promise<any>|undefined;
export function loadClientMaps():Promise<any>{
 if(!pending)pending=fetch('/data/client-maps/catalog.json').then(r=>{
  if(!r.ok)throw Error('Map catalog unavailable');return r.json();
 }).then(data=>{
  if(data.schemaVersion!==1||!Array.isArray(data.areas)||!data.maps||!data.monsters)throw Error('Invalid map catalog');
  return data;
 }).catch(error=>{pending=undefined;throw error;});
 return pending;
}
// The caller attaches its own container; delayed results never replace a newer profile.
export async function populateMonsterLocations(container:HTMLElement,id:string,lang:string,prefix:string){
 const p=document.createElement('p');p.textContent=mapText(lang,'loading');container.append(p);
 try{
  const data=await loadClientMaps(),maps=monsterMapLocations(data,id);
  container.replaceChildren();
  if(!maps.length){p.textContent=mapText(lang,'noLocations');container.append(p);return;}
  const list=document.createElement('ul');list.className='monster-map-links';
  for(const map of maps){
   const li=document.createElement('li'),a=document.createElement('a');
   a.href=mapHref(prefix,map.id);a.textContent=mapDisplayName(map,mapText(lang,'unknown'));li.append(a);
   const areas=data.areas.filter((area:any)=>map.areas.includes(area.id)).map((a:any)=>a.name);
   if(areas.length){const span=document.createElement('span');span.textContent=' · '+areas.join(' / ');li.append(span);}
   list.append(li);
  }
  container.append(list);const note=document.createElement('p');note.className='subtle';note.textContent=mapText(lang,'notice');container.append(note);
 }catch{
  container.replaceChildren();p.textContent=mapText(lang,'error');container.append(p);
  const retry=document.createElement('button');retry.type='button';retry.textContent=mapText(lang,'retry');
  retry.addEventListener('click',()=>{container.replaceChildren();void populateMonsterLocations(container,id,lang,prefix);},{once:true});container.append(retry);
 }
}
