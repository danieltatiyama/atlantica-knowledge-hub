/**
 * Review-focused client equipment summaries from Items.csv source rows.
 *
 * Two definitions with the same Unique ID can have common values plus
 * different optional fields. NEVER invent missing zeros or replace real
 * conflicts with an arbitrary "canonical" source.
 *
 * An optional historical +1..+10 preview is explicitly isolated from the
 * original client values. Its multipliers came from OLD community tables.
 */
import {projectClassicStat, CLASSIC_ENCHANT_MULTIPLIER_TENTHS}
  from "./equipment-enchant-projection.mjs";

export const CLIENT_FIELDS=Object.freeze([
  {key:"MinDamage",group:"attack",en:"Min. attack",pt:"Ataque mínimo"},
  {key:"MaxDamage",group:"attack",en:"Max. attack",pt:"Ataque máximo"},
  {key:"AC",group:"defense",en:"Armor / AC",pt:"Defesa / AC"},
  {key:"MagicDef",group:"defense",en:"Magic Defense",pt:"Defesa mágica"},
  {key:"EV",group:"defense",en:"EV (raw)",pt:"EV (bruto)"},
  {key:"Str",group:"attributes",en:"Strength",pt:"Força"},
  {key:"Dex",group:"attributes",en:"Dexterity",pt:"Destreza"},
  {key:"Vit",group:"attributes",en:"Vitality",pt:"Vitalidade"},
  {key:"Mag",group:"attributes",en:"Mag (raw)",pt:"Mag (bruto)"},
  {key:"HitRate",group:"other",en:"Hit Rate",pt:"Precisão"},
  {key:"MagicSkillPlus",group:"other",en:"Magic Skill Plus",pt:"Bônus de habilidade mágica"},
  {key:"CriticalPlus",group:"other",en:"Critical Plus",pt:"Crítico adicional"},
]);

const GROUP_ORDER=Object.freeze(["attack","defense","attributes","other"]);
const projectedKeys=Object.freeze(["MinDamage","MaxDamage","AC","Str","Dex","Vit","Mag"]);
const scalable=new Set(projectedKeys);
const isRawNonnegativeInteger=value=>typeof value==="string" &&
  /^(?:0|[1-9][0-9]*)$/.test(value) &&
  Number.isSafeInteger(Number(value));

/**
 * Per-field consensus applies ONLY to source rows actually containing the
 * field. Missing is NEVER treated as zero. Full source count is retained.
 */
export function summarizeClientRawFields(item){
  if(!item||!Array.isArray(item.sourceRows)||!item.sourceRows.length){
    throw new TypeError("Client item must have at least one source row");
  }
  const occurrences=new Map();
  for(const source of item.sourceRows){
    if(!source||typeof source.sourceRowNumber!=="number"||
       !source.fieldsRaw||typeof source.fieldsRaw!=="object"||
       Array.isArray(source.fieldsRaw))throw new TypeError("Invalid client source row");
    for(const [key,value] of Object.entries(source.fieldsRaw)){
      if(typeof value!=="string")throw new TypeError("Unexpected non-string raw client value");
      if(!occurrences.has(key))occurrences.set(key,[]);
      occurrences.get(key).push({row:source.sourceRowNumber,value});
    }
  }
  const fields=[...occurrences].map(([key,observations])=>{
    const distinct=[...new Set(observations.map(x=>x.value))];
    return {
      key,
      value:distinct.length===1?distinct[0]:null,
      status:distinct.length>1?"conflict":
        observations.length<item.sourceRows.length?"partial":"consistent",
      sourceRowNumbers:observations.map(x=>x.row),
      observedIn:observations.length,
      sourceCount:item.sourceRows.length,
      observedValues:distinct,
    };
  });
  const byKey=new Map(fields.map(row=>[row.key,row]));
  const visibleGroups=GROUP_ORDER.map(group=>({
    group,
    fields:CLIENT_FIELDS.filter(x=>x.group===group)
      .map(def=>({...def,...byKey.get(def.key)}))
      .filter(x=>x.key && byKey.has(x.key) &&
        (byKey.get(x.key).status==="conflict" ||
         byKey.get(x.key).value!=="0")),
  })).filter(group=>group.fields.length>0);
  const extra=fields.filter(row=>!CLIENT_FIELDS.some(d=>d.key===row.key));
  return {
    sourceCount:item.sourceRows.length,
    fields,
    byKey,
    visibleGroups,
    additionalFieldCount:extra.length,
    conflictCount:fields.filter(f=>f.status==="conflict").length,
    partialCount:fields.filter(f=>f.status==="partial").length,
    allSourceRowNumbers:item.sourceRows.map(r=>r.sourceRowNumber),
  };
}

/**
 * Historical MODEL ONLY: do not project fixed MagicDef, EV, HitRate,
 * critical or other job/skill attributes. Requires a source consensus
 * for each included value. Decimal Mag (e.g. 292.5) remains visible
 * in the raw field table but is deliberately not projected.
 *
 * `grade:0` is a client RAW baseline, not a live-game +0 observation.
 */
export function buildHistoricalClientProjection(item){
  const summary=summarizeClientRawFields(item);
  const eligible=projectedKeys.filter(key=>{
    const field=summary.byKey.get(key);
    return field && field.status!=="conflict" &&
      isRawNonnegativeInteger(field.value) && Number(field.value)>0;
  });
  // No meaningful scalable source field means the item is not
  // suitable for even a labeled historical model preview.
  if(!eligible.length)return {fields:[],rows:[],excluded:[]};
  const excluded=projectedKeys.filter(key=>{
    const field=summary.byKey.get(key);
    return field&&(field.status==="conflict"||
      (field.value!=="0"&&!eligible.includes(key)));
  });
  const rows=CLASSIC_ENCHANT_MULTIPLIER_TENTHS.map((multiplier,grade)=>({
    grade,
    multiplierTenths:multiplier,
    status:grade===0?"client-raw-baseline":"historical-estimate",
    values:Object.fromEntries(eligible.map(key=>{
      const initial=Number(summary.byKey.get(key).value);
      return [key,grade===0?initial:projectClassicStat(initial,grade)];
    })),
  }));
  return {fields:eligible,rows,excluded};
}

export function labelForClientField(key,pt=false){
  const found=CLIENT_FIELDS.find(x=>x.key===key);
  return found?(pt?found.pt:found.en):key;
}
