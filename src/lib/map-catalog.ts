import {loadMapImageLibrary} from './map-image-library';
import {sectionMapImage} from '../data/map-images.mjs';
import {mapImageText} from '../i18n/map-images-ui.mjs';
import {loadClientMaps} from './client-maps';
import {mapText,mapModeText} from '../i18n/maps-ui.mjs';
import {localePrefix,localeTag} from '../i18n/locales.mjs';
import {mapCatalogResults,mapDisplayName,mapHref} from '../data/client-maps.mjs';
import {MAIN_LEVEL_CREATURES} from '../data/monster-level-policy.mjs';

export async function initMapCatalog(){
 const root=document.querySelector<HTMLElement>('#map-catalog');if(!root)return;
 const lang=root.dataset.lang??'en',prefix=localePrefix(lang),t=(key:string)=>mapText(lang,key);
 const nf=new Intl.NumberFormat(localeTag(lang));
 const el=<T extends HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const query=el<HTMLInputElement>('map-query'),mode=el<HTMLSelectElement>('map-mode');
 const areaSelect=el<HTMLSelectElement>('map-area'),sectionSelect=el<HTMLSelectElement>('map-section');
 const status=el('map-status'),selection=el('map-selection'),rows=el('map-rows');
 const results=el<HTMLDetailsElement>('map-results'),retry=el<HTMLButtonElement>('map-retry');
 const make=(tag:string,text?:string)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const option=(value:number|string,text:string)=>{const o=document.createElement('option');o.value=String(value);o.textContent=text;return o;};
 let data:any,imageLibrary:any;
 const libraryPromise=loadMapImageLibrary().catch(()=>null);
 try{data=await loadClientMaps();}catch{status.textContent=t('error');retry.hidden=false;retry.onclick=()=>location.reload();return;}
 query.disabled=mode.disabled=false;
 for(const m of [...new Set<string>(data.areas.map((a:any)=>a.mode))].sort())mode.append(option(m,mapModeText(lang,m)));
 const sortedAreas=[...data.areas].sort((a,b)=>a.name.localeCompare(b.name,'en'));
 areaSelect.append(option('',t('other')));
 for(const a of sortedAreas)areaSelect.append(option(a.id,a.name));
 function restoreFilters(){const p=new URL(location.href).searchParams;query.value=p.get('q')??'';mode.value=p.get('type')??'';}
 function filter(){
  const {areas,others}=mapCatalogResults(data,query.value,mode.value);rows.replaceChildren();
  status.textContent=t('results')+': '+nf.format(areas.length+others.length);
  const add=(name:string,id:number,area:number|undefined,type:string,sectionCount:number,monsters:number)=>{
   const row=make('tr'),cell=make('td'),a=make('a',name) as HTMLAnchorElement;a.href=mapHref(prefix,id,area);
   a.addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();navigate(id,area);});
   cell.append(a);row.append(cell,make('td',type),make('td',nf.format(sectionCount)),make('td',nf.format(monsters)));rows.append(row);
  };
  for(const a of areas){
   const count=new Set(a.sections.flatMap((id:number)=>data.maps[id].monsters)).size;
   // When searching a creature, open the matching section rather than always the first floor.
   const matches=mapCatalogResults({...data,areas:[],maps:Object.fromEntries(a.sections.map((id:number)=>[id,{...data.maps[id],areas:[]}]))},query.value).others;
   const first=matches[0]?.id??a.sections[0];
   if(first!==undefined)add(a.name,first,a.id,mapModeText(lang,a.mode),a.sections.length,count);
  }
  for(const m of others)add(mapDisplayName(m,t('unknown')),m.id,undefined,t('other'),1,m.monsters.length);
 }
 function showSelected(){
  const params=new URL(location.href).searchParams,id=params.get('id');selection.hidden=!id;
  if(!id){document.title=t('maps')+' | Atlantica Knowledge Hub';return;}
  const map=data.maps[id];
  if(!map){selection.hidden=true;status.textContent=t('notFound');results.open=true;return;}
  const requested=Number(params.get('area'));
  const area=data.areas.find((a:any)=>a.id===requested&&a.sections.includes(map.id))??data.areas.find((a:any)=>a.sections.includes(map.id));
  areaSelect.value=area?String(area.id):'';sectionSelect.replaceChildren();
  const ids=area?area.sections:Object.values(data.maps).filter((m:any)=>!m.areas.length).map((m:any)=>m.id);
  for(const sid of ids)sectionSelect.append(option(sid,mapDisplayName(data.maps[sid],t('unknown'))));
  sectionSelect.value=String(map.id);
  const name=mapDisplayName(map,t('unknown'));el('map-heading').textContent=name;document.title=name+' | Atlantica Knowledge Hub';
  el('map-entry').textContent=map.minLevel===null?'':t('entry')+': '+map.minLevel+'–'+map.maxLevel;
  const image=el('map-image');image.replaceChildren();
  if(map.image){const img=document.createElement('img');img.src=map.image.src;img.width=map.image.width;img.height=map.image.height;img.alt=name;img.decoding='async';image.append(img);}
  else image.append(make('p',t('imageMissing')));
  const drawImage=()=>{
   const asset=sectionMapImage(imageLibrary,map);if(asset){
    image.replaceChildren();const a=document.createElement('a'),img=document.createElement('img');
    a.href=asset.src;a.target='_blank';a.rel='noopener';a.setAttribute('aria-label',mapImageText(lang,'open')+': '+name);
    img.onerror=()=>{if(!img.isConnected)return;const note=el('map-image-note');note.hidden=false;note.textContent=mapImageText(lang,'error');};
    img.src=asset.src;img.width=asset.width;img.height=asset.height;img.alt=name;img.decoding='async';a.append(img);image.append(a);
   }
   const note=el('map-image-note');note.hidden=!asset;note.textContent=asset?mapImageText(lang,asset.association==='reviewed'?'reviewed':'sectionNote'):'';
   const variants=el<HTMLAnchorElement>('map-image-variants');variants.hidden=!(imageLibrary?.mapCandidates?.[map.id]?.length);variants.href=prefix+'/maps/images/?map='+map.id;
  };drawImage();
  void libraryPromise.then(library=>{imageLibrary=library;if(new URL(location.href).searchParams.get('id')!==String(map.id))return;drawImage();if(!library&&!map.image){image.replaceChildren(make('p',mapImageText(lang,'error')));const retry=make('button',t('retry')) as HTMLButtonElement;retry.type='button';retry.onclick=()=>location.reload();image.append(retry);}});
  const body=el('map-monsters');body.replaceChildren();
  const list=map.monsters.map((id:number)=>({id,...data.monsters[id]})).sort((a:any,b:any)=>a.name.localeCompare(b.name,'en'));
  for(const m of list){
   const row=make('tr'),cell=make('td'),a=make('a',m.name) as HTMLAnchorElement;
   a.href=prefix+'/monsters/profile/?id='+encodeURIComponent(m.id);cell.append(a);
   const adaptive=MAIN_LEVEL_CREATURES.some(r=>r.id===String(m.id)&&r.kind===m.kind);
   row.append(cell,make('td',adaptive?'—':String(m.level??'—')));body.append(row);
  }
  el('map-monsters-table').hidden=!list.length;el('map-monsters-empty').hidden=!!list.length;
 }
 function navigate(id:number,area?:number){
  const url=new URL(location.href);url.searchParams.set('id',String(id));
  if(area===undefined)url.searchParams.delete('area');else url.searchParams.set('area',String(area));
  history.pushState({},'',url);showSelected();results.open=false;
  el('map-heading').focus({preventScroll:true});selection.scrollIntoView({behavior:'smooth',block:'start'});
 }
 const syncFilters=()=>{const url=new URL(location.href);for(const [key,value] of [['q',query.value],['type',mode.value]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState({},'',url);filter();results.open=true;};
 query.addEventListener('input',syncFilters);mode.addEventListener('change',syncFilters);
 areaSelect.addEventListener('change',()=>{const a=data.areas.find((a:any)=>String(a.id)===areaSelect.value);if(a)navigate(a.sections[0],a.id);else{const m=Object.values(data.maps).find((m:any)=>!m.areas.length) as any;if(m)navigate(m.id);}});
 sectionSelect.addEventListener('change',()=>navigate(Number(sectionSelect.value),areaSelect.value?Number(areaSelect.value):undefined));
 el<HTMLAnchorElement>('map-browse').href=prefix+'/maps/';
 window.addEventListener('popstate',()=>{restoreFilters();filter();showSelected();results.open=!new URL(location.href).searchParams.has('id');});
 restoreFilters();filter();showSelected();results.open=!new URL(location.href).searchParams.has('id');
}
