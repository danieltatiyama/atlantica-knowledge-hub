/**
 * Game-client source inference, calibrated against the in-game Huge Crocodile
 * (CharID 289 / recorded level 71) loot panel on 2026-11-23.
 *
 * Every group contains GroupBands rows [sourceRow,Band,BandKey,EntryCount,RawSum].
 * BandKey behaves like a minimum character level: choose the HIGHEST BandKey
 * <= recorded character level. Then only GroupDrops rows with that Band match.
 *
 * The game panel confirms the 6 selected item IDs for Huge Crocodile:
 * Silver Thread, Thick/Large Animal Bone, Slab of Lumber, Pine,
 * Secret Material Chest. Gold Thread is an excluded Band 4 (threshold 80).
 *
 * For display only, candidate two-stage percentage =
 *   (CharacterGroupRefs.RawRate / 10000)
 *   * (GroupDrops.RawRate / 10000) * 100.
 * Server roll probabilities, rate modifiers, and tier boundaries are not
 * proven by a single screenshot. No chance is fabricated for no-match bands.
 * Original JSON inputs are read-only.
 */
const ID=/^[1-9]\d{0,12}$/;
const RAW=/^(?:0|[1-9]\d{0,4})$/;
const asRate=value=>{
  const s=String(value);
  if(!RAW.test(s))return null;
  const n=Number(s);
  return Number.isSafeInteger(n)&&n>=0&&n<=10000?n:null;
};
const asLevel=value=>{
  if(value===null||value===undefined||!(/^(?:0|[1-9]\d*)$/.test(String(value))))return null;
  const n=Number(value);
  return Number.isSafeInteger(n)?n:null;
};

export function selectClientLevelBand(group,level){
  const n=asLevel(level);
  if(!group||!Array.isArray(group.bands)||n===null)return null;
  const candidates=group.bands.filter(row=>
    Array.isArray(row)&&row.length>=3&&
    asLevel(row[2])!==null&&asLevel(row[2])<=n);
  if(!candidates.length)return null;
  const highest=candidates.reduce((best,row)=>
    asLevel(row[2])>asLevel(best[2])?row:best);
  return {
    band:String(highest[1]),
    minimumLevel:asLevel(highest[2]),
    originalBandRow:highest[0],
    entryCount:highest[3],
    rawSum:highest[4],
  };
}

export function estimatedTwoStagePercent(referenceRate,itemRate){
  const ref=asRate(referenceRate),drop=asRate(itemRate);
  if(ref===null||drop===null)return null;
  return (ref*drop)/1000000;
}

export function formatLevelResolvedPercent(value,lang="en"){
  if(value===null||!Number.isFinite(value)||value<0||value>100)return "—";
  const decimals=value>=1?2:value>=0.01?4:6;
  return new Intl.NumberFormat(lang==="pt-br"?"pt-BR":"en-US",{
    maximumFractionDigits:decimals,
  }).format(value)+"%";
}

export function resolveClientCreatureDrops(characterRow,source,groups){
  const rawLevel=characterRow?.[2];
  const rows=[];
  const unresolved=[];
  const sourceDirect=source?.direct??[];
  const sourceGroups=source?.groups??[];
  for(const drop of sourceDirect){
    const pct=asRate(drop[3]);
    rows.push({
      kind:"direct",itemId:drop[1],name:drop[2],
      min:drop[5],max:drop[6],
      estimatedPercent:pct===null?null:pct/100,
      direct:drop,groupRef:null,groupDrop:null,groupId:null,selectedBand:null,
    });
  }
  for(const ref of sourceGroups){
    const gid=ref[1],group=groups?.[gid];
    const selection=selectClientLevelBand(group,rawLevel);
    if(!selection){
      unresolved.push({ref,reason:group?"no-matching-level-band":"missing-group"});
      continue;
    }
    for(const drop of group.drops??[]){
      if(String(drop[1])!==selection.band)continue;
      rows.push({
        kind:"group",itemId:drop[2],name:drop[3],
        min:drop[6],max:drop[7],
        estimatedPercent:estimatedTwoStagePercent(ref[2],drop[4]),
        direct:null,groupRef:ref,groupDrop:drop,groupId:gid,
        selectedBand:selection,
      });
    }
  }
  return {rows,unresolved,rawDirectCount:sourceDirect.length,
    rawGroupReferenceCount:sourceGroups.length};
}

export function resolvedReverseRowForDrop(charId,charName,row){
  if(row.kind==="direct"){
    const drop=row.direct;
    return [charId,charName,drop[0],drop[3],drop[4],drop[5],drop[6]];
  }
  const ref=row.groupRef,drop=row.groupDrop;
  return [charId,charName,row.groupId,ref[0],drop[0],
    ref[2],drop[4],ref[3],drop[1],drop[6],drop[7]];
}

export function isOriginalReverseRowActive(row,character,group){
  if(!Array.isArray(row)||row.length!==11||!character)return false;
  const selection=selectClientLevelBand(group,character[2]);
  return selection!==null&&row[8]===selection.band;
}
