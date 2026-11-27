import icons from './client-item-icons.json' with {type:'json'};

// Only unambiguous references joined to named IDs from the published catalog.
// Missing, conflicting and unreconciled identities deliberately have no icon.
export function itemIconReference(id) {
  const key=String(id);
  if(!/^[1-9]\d{0,11}$/.test(key)||!Object.hasOwn(icons,key))return null;
  const [sheet,index]=icons[key];
  return {sheet,index,x:(index%10)*40,y:Math.floor(index/10)*40,
    url:`/images/client-items/${sheet}.webp`};
}
