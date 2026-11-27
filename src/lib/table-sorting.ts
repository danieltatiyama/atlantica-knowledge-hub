import {sortRecords} from '../data/table-sort.mjs';
import {tableSortText} from '../i18n/table-sort-ui.mjs';
type Order={column:number;direction:'ascending'|'descending';type:string};
const states=new WeakMap<HTMLTableElement,Order>();
const labels=new WeakMap<HTMLTableCellElement,string>();
export const getTableSort=(table:HTMLTableElement)=>states.get(table);
export function clearTableSort(table:HTMLTableElement){states.delete(table);for(const th of table.querySelectorAll('th[aria-sort]'))th.removeAttribute('aria-sort');}
export function onTableSort(table:HTMLTableElement,callback:(order:Order)=>void){
 table.dataset.sortManaged='true';
 table.addEventListener('wiki:table-sort',(event:Event)=>{event.preventDefault();callback((event as CustomEvent<Order>).detail);});
}
export function sortTableData<T>(table:HTMLTableElement,rows:T[],value:(row:T,column:number)=>unknown):T[]{
 const order=states.get(table);return order?sortRecords(rows,(r:T)=>value(r,order.column),{...order,locale:document.documentElement.lang||'en'}):rows;
}
function cellValue(cell:HTMLTableCellElement|undefined){
 if(!cell)return null;
 if(cell.hasAttribute('data-sort-value')){
  const value=cell.dataset.sortValue??'';
  if(/^[+-]?\d+$/.test(value))return BigInt(value);
  if(/^[+-]?\d+\.\d+(?:[eE][+-]?\d+)?$/.test(value))return Number(value);
  return value;
 }
 const explicit=cell.querySelector<HTMLElement>('[data-sort-value]');
 if(explicit){const value=explicit.dataset.sortValue??'';if(/^[+-]?\d+$/.test(value))return BigInt(value);}
 const field=cell.querySelector<HTMLInputElement>('input[type="number"]');
 if(field)return field.value===''?null:Number(field.value);
 const clone=cell.cloneNode(true) as HTMLElement;
 clone.querySelectorAll('small,details,button,input,select,.profile-mark,.client-source-id,[aria-hidden="true"],[data-sort-ignore]').forEach(n=>n.remove());
 return clone.textContent?.trim()??null;
}
export function initTableSorting(){
 const pending=new Set<HTMLTableElement>();let scheduled=false;
 const locale=document.documentElement.lang||'en',lang=locale.toLowerCase()==='pt-br'?'pt-br':locale.toLowerCase();
 const status=document.createElement('span');status.className='wiki-sort-status';status.setAttribute('role','status');document.body.append(status);
 function headers(table:HTMLTableElement){
  const rows=table.tHead?Array.from(table.tHead.rows):[];
  if(!rows.length){const first=table.rows[0];if(first&&Array.from(first.cells).every(c=>c.tagName==='TH'))rows.push(first);}
  const grid:HTMLTableCellElement[][]=[];
  rows.forEach((row,y)=>{grid[y]??=[];let x=0;for(const cell of Array.from(row.cells)){
   while(grid[y][x])x++;
   for(let dy=0;dy<cell.rowSpan;dy++){grid[y+dy]??=[];for(let dx=0;dx<cell.colSpan;dx++)grid[y+dy][x+dx]=cell;}
   x+=cell.colSpan;
  }});
  return (grid.at(-1)??[]).map((cell,column)=>({cell,column})).filter(({cell})=>cell.colSpan===1&&cell.dataset.sort!=='none'&&!cell.querySelector('input,select,a,button:not(.wiki-sort-button)'));
 }
 function eligible(table:HTMLTableElement){
  if(table.closest('[data-sort="none"]'))return false;
  return Array.from(table.tBodies).every(body=>Array.from(body.rows).every(r=>r.hasAttribute('data-sort-fixed')||Array.from(r.cells).every(c=>c.rowSpan===1&&c.colSpan===1)));
 }
 function update(table:HTMLTableElement){
  if(!eligible(table))return;
  for(const {cell,column} of headers(table)){
   if(!labels.has(cell))labels.set(cell,cell.textContent?.trim()??'');
   const label=labels.get(cell)!;if(!label)continue;
   let button=cell.querySelector<HTMLButtonElement>(':scope > .wiki-sort-button');
   if(!button){
    button=document.createElement('button');button.type='button';button.className='wiki-sort-button';
    while(cell.firstChild)button.append(cell.firstChild);
    const indicator=document.createElement('span');indicator.className='wiki-sort-indicator';indicator.setAttribute('aria-hidden','true');button.append(indicator);cell.append(button);
    button.addEventListener('click',()=>{
     const old=states.get(table),order:Order={column,direction:old?.column===column&&old.direction==='ascending'?'descending':'ascending',type:cell.dataset.sortType??'auto'};
     states.set(table,order);
     const event=new CustomEvent('wiki:table-sort',{detail:order,cancelable:true});table.dispatchEvent(event);
     if(table.dataset.sortManaged==='true'&&!event.defaultPrevented){if(old)states.set(table,old);else states.delete(table);return;}
     enqueue(table);status.textContent=label+': '+tableSortText(lang,order.direction==='ascending'?2:3);
    });
   }
   const active=states.get(table),direction=active?.column===column?active.direction:null;
   if(direction)cell.setAttribute('aria-sort',direction);else cell.removeAttribute('aria-sort');
   button.setAttribute('aria-label',label+': '+tableSortText(lang,direction==='ascending'?1:0));
   button.title=button.getAttribute('aria-label')!;
   button.querySelector('.wiki-sort-indicator')!.textContent=direction==='ascending'?'▲':direction==='descending'?'▼':'↕';
  }
  const order=states.get(table);if(!order||table.dataset.sortManaged==='true')return;
  // Keep an editable price or planner control steady while the user is typing.
  if(table.contains(document.activeElement)&&document.activeElement?.matches('input,select,textarea'))return;
  for(const body of Array.from(table.tBodies)){
   const rows=Array.from(body.rows).filter(r=>!r.hasAttribute('data-sort-fixed')&&!Array.from(r.cells).every(c=>c.tagName==='TH'));
   const sorted=sortRecords(rows,(r:HTMLTableRowElement)=>cellValue(r.cells[order.column]),{...order,locale:table.dataset.sortLocale??locale});
   if(sorted.every((row:HTMLTableRowElement,i:number)=>row===rows[i]))continue;
   // Fixed totals and section labels retain their positions, as do footer rows.
   const placeholders=rows.map(row=>{const marker=document.createComment('sort-row');row.replaceWith(marker);return marker;});
   sorted.forEach((row:HTMLTableRowElement,i:number)=>placeholders[i].replaceWith(row));
  }
 }
 const observer=new MutationObserver(records=>{
  for(const record of records){
   const parent=(record.target as Element).closest?.('table');if(parent)enqueue(parent);
   for(const node of record.addedNodes)if(node instanceof Element){if(node.tagName==='TABLE')enqueue(node as HTMLTableElement);node.querySelectorAll('table').forEach(t=>enqueue(t));}
  }
 });
 function enqueue(table:HTMLTableElement){pending.add(table);if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{
  scheduled=false;observer.disconnect();try{for(const t of pending)if(t.isConnected)update(t);}finally{pending.clear();observer.observe(document.body,{childList:true,subtree:true});}
 });}
 document.querySelectorAll('table').forEach(t=>enqueue(t));observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('focusout',event=>{const table=(event.target as Element).closest?.('table');if(table&&states.has(table))enqueue(table);});
}
