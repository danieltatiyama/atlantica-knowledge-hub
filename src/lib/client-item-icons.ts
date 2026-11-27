import {itemIconReference} from '../data/client-item-icons.mjs';
import '../styles/client-item-icons.css';

/** Decorative: the adjacent item name remains the accessible link text. */
export function prependItemIcon(parent:HTMLElement,id:unknown,size=32) {
  const ref=itemIconReference(id);
  if(!ref)return;
  const scale=size/40;
  const icon=document.createElement('span');
  icon.className='client-item-icon';
  icon.setAttribute('aria-hidden','true');
  icon.style.width=`${size}px`;
  icon.style.height=`${size}px`;
  icon.style.backgroundImage=`url("${ref.url}")`;
  icon.style.backgroundSize=`${512*scale}px ${512*scale}px`;
  icon.style.backgroundPosition=`${-ref.x*scale}px ${-ref.y*scale}px`;
  parent.classList.add('client-item-label');
  parent.prepend(icon);
}
