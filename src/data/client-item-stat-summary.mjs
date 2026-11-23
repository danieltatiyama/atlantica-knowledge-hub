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
  {key:"EV",group:"defense",en:"Evasion / EV (raw)",pt:"Evasão / EV (bruto)"},
  {key:"MoveSpeed",group:"defense",en:"Movement speed (raw)",pt:"Velocidade de movimento (bruto)"},
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
// Only these client field names are treated as constant across grade rows.
// More source fields MUST NOT enter the +0..+10 model without verifying
// their upgrade mechanics. Missing is never equivalent to zero.
export const FIXED_ENCHANT_FIELDS=Object.freeze(["MagicDef","EV","MoveSpeed"]);
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
 * Historical MODEL ONLY: scales ONLY base damage, AC and primary attributes.
 * MagicDef, EV and MoveSpeed are copied UNCHANGED to every grade from the
 * client; HitRate, crit, skill and job bonuses are not guessed/scaled.
 * Requires a source consensus for each included value. Decimal Mag (e.g.
 * 292.5) remains visible in +0 source rows, but does not get projected.
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
  // Fractional or negative original primary attributes remain observable
  // in the +0 row, but never receive a fabricated integer projection.
  const baselineOnlyFields=projectedKeys.filter(key=>{
    const field=summary.byKey.get(key);
    return field&&field.status!=="conflict"&&!eligible.includes(key) &&
      field.value!=="0" && typeof field.value==="string" &&
      /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(field.value);
  });
  const fixedFields=FIXED_ENCHANT_FIELDS.map(key=>{
    const field=summary.byKey.get(key);
    return field&&field.status!=="conflict"&&
      typeof field.value==="string"&&/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(field.value)
      ? {key,value:field.value,status:field.status,
         observedIn:field.observedIn,sourceCount:field.sourceCount,
         sourceRowNumbers:field.sourceRowNumbers}
      : null;
  }).filter(Boolean);
  const fixedConflicts=FIXED_ENCHANT_FIELDS.filter(key=>
    summary.byKey.get(key)?.status==="conflict");
  // All 551 reviewed equipment have at least one positive original
  // scalable field. In future exports, still show known FIXED fields even
  // when no numeric scaling baseline is available.
  if(!eligible.length&&!fixedFields.length&&!baselineOnlyFields.length){
    return {fields:[],baselineOnlyFields:[],fixedFields:[],rows:[],excluded:[],fixedConflicts};
  }
  const excluded=projectedKeys.filter(key=>{
    const field=summary.byKey.get(key);
    return field&&(field.status==="conflict"||
      (field.value!=="0"&&!eligible.includes(key)));
  });
  const rows=CLASSIC_ENCHANT_MULTIPLIER_TENTHS.map((multiplier,grade)=>({
    grade,
    multiplierTenths:multiplier,
    status:grade===0?"client-raw-baseline":"historical-estimate",
    values:{
      ...Object.fromEntries(eligible.map(key=>{
        const initial=Number(summary.byKey.get(key).value);
        return [key,grade===0?initial:projectClassicStat(initial,grade)];
      })),
      // Fractional/negative original fields belong to the RAW +0 row
      // only. Later grades have no supported rounding/scaling rule.
      ...(grade===0
        ? Object.fromEntries(baselineOnlyFields.map(key=>[
            key,summary.byKey.get(key).value
          ]))
        : {}),
      // FIXED client values are copied literally from source, never
      // projected or rounded. Repeated values are NOT "estimated".
      ...Object.fromEntries(fixedFields.map(field=>[field.key,field.value])),
    },
  }));
  return {fields:eligible,baselineOnlyFields,fixedFields,rows,excluded,fixedConflicts};
}

export function labelForClientField(key,pt=false){
  const found=CLIENT_FIELDS.find(x=>x.key===key);
  return found?(pt?found.pt:found.en):key;
}
