import {mapImageResults} from '../data/map-images.mjs';
import {mapImageText} from '../i18n/map-images-ui.mjs';
import {localePrefix,localeTag} from '../i18n/locales.mjs';
let pending:Promise<any>|undefined;
export function loadMapImageLibrary():Promise<any>{
 return pending??=fetch('/data/client-maps/images.json').then(r=>{if(!r.ok)throw Error('Image library unavailable');return r.json();}).then(data=>{
  if(data.schemaVersion!==1||!data.assets||!Array.isArray(data.origins)||!data.mapCandidates)throw Error('Invalid image library');return data;
 }).catch(error=>{pending=undefined;throw error;});
}
export async function initMapImageLibrary(){
 const root=document.querySelector<HTMLElement>('#map-image-library');if(!root)return;
 const lang=root.dataset.lang??'en',prefix=localePrefix(lang),t=(key:string)=>mapImageText(lang,key),nf=new Intl.NumberFormat(localeTag(lang));
 const el=<T extends HTMLElement>(id:string)=>root.querySelector<T>('#'+id)!;
 const query=el<HTMLInputElement>('image-query'),scope=el<HTMLSelectElement>('image-scope'),sort=el<HTMLSelectElement>('image-sort');
 const grid=el('image-grid'),status=el('image-status'),previous=el<HTMLButtonElement>('image-prev'),next=el<HTMLButtonElement>('image-next');
 const dialog=el<HTMLDialogElement>('image-viewer'),close=el<HTMLButtonElement>('image-close');
 const make=(tag:string,text?:string)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 let library:any,page=0,filtered:any[]=[],opener:HTMLElement|undefined;
 try{library=await loadMapImageLibrary();}catch{status.textContent=t('error');el('image-retry').hidden=false;el('image-retry').onclick=()=>location.reload();return;}
 query.disabled=scope.disabled=sort.disabled=false;
 el('image-all').hidden=!new URL(location.href).searchParams.has('map');
 function open(asset:any,button:HTMLElement){
  opener=button;el('image-title').textContent=asset.origins[0].folder;
  const image=el<HTMLImageElement>('image-full');image.src=asset.src;image.alt=asset.origins[0].folder;image.width=asset.width;image.height=asset.height;
  el('image-size').textContent=`${asset.width} × ${asset.height} · ${nf.format(asset.bytes)} B`;
  el<HTMLAnchorElement>('image-original').href=asset.src;
  const origins=el('image-origins');origins.replaceChildren();
  for(const r of library.origins.filter((r:any)=>r.assetId===asset.id))origins.append(make('li',r.sourcePath));
  const maps=el('image-links');maps.replaceChildren();
  const ids=[...new Set<number>(library.origins.filter((r:any)=>r.assetId===asset.id).flatMap((r:any)=>r.mapIds))].sort((a,b)=>a-b);
  for(const id of ids){const li=make('li'),a=make('a',`${library.mapNames[id]??id} (#${id})`) as HTMLAnchorElement;a.href=prefix+'/maps/?id='+id;li.append(a);maps.append(li);}
  el('image-map-links').hidden=!ids.length;
  dialog.showModal();close.focus();
 }
 function render(){
  const size=48,max=Math.max(0,Math.ceil(filtered.length/size)-1);page=Math.min(page,max);grid.replaceChildren();
  status.textContent=`${t('results')}: ${nf.format(filtered.length)} · ${nf.format(page+1)} / ${nf.format(max+1)}`;
  previous.disabled=page===0;next.disabled=page===max;
  if(!filtered.length){grid.append(make('p',t('empty')));return;}
  for(const asset of filtered.slice(page*size,(page+1)*size)){
   const card=make('article'),button=make('button') as HTMLButtonElement;button.type='button';button.className='image-card';button.setAttribute('aria-label',t('open')+': '+asset.origins[0].folder+' / '+asset.origins[0].filename);
   const img=document.createElement('img');img.src=asset.thumbnail;img.alt='';img.loading='lazy';img.decoding='async';img.width=240;img.height=180;
   button.append(img,make('strong',asset.origins[0].folder),make('small',asset.origins[0].filename),make('span',`${asset.width} × ${asset.height} · ${t('origins')}: ${nf.format(asset.origins.length)}`));
   button.onclick=()=>open(asset,button);card.append(button);grid.append(card);
  }
 }
 function filter(){const p=new URL(location.href).searchParams;filtered=mapImageResults(library,{query:query.value,scope:scope.value,mapId:p.get('map')??'',sort:sort.value});render();}
 function restore(){const p=new URL(location.href).searchParams;query.value=p.get('q')??'';scope.value=p.get('scope')??'';sort.value=p.get('sort')??'name';page=0;filter();}
 function update(){const url=new URL(location.href);for(const [key,value] of [['q',query.value],['scope',scope.value],['sort',sort.value]]){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}history.replaceState({},'',url);page=0;filter();}
 query.addEventListener('input',update);scope.addEventListener('change',update);sort.addEventListener('change',update);
 previous.onclick=()=>{page--;render();};next.onclick=()=>{page++;render();};close.onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>opener?.focus());window.addEventListener('popstate',restore);restore();
}
