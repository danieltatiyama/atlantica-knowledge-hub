/**
 * Stage 20.35 — source-only exploration helpers for the 7,560 IDs with
 * Items.csv numeric rows. No game-server or upgrade calculations live here.
 * Missing, partial and disagreeing source rows must remain distinguishable.
 */
export const RAW_STATS_FIELDS=Object.freeze([
  {key:"MinDamage",group:"attack"},
  {key:"MaxDamage",group:"attack"},
  {key:"AC",group:"defense"},
  {key:"MagicDef",group:"defense"},
  {key:"EV",group:"defense"},
  {key:"MoveSpeed",group:"defense"},
  {key:"Str",group:"attributes"},
  {key:"Dex",group:"attributes"},
  {key:"Vit",group:"attributes"},
  {key:"Mag",group:"attributes"},
  {key:"HitRate",group:"other"},
  {key:"CriticalPlus",group:"other"},
  {key:"MagicSkillPlus",group:"other"},
  {key:"ActivePower",group:"other"},
  {key:"BuffUpPercentage",group:"other"},
]);

const VALID_FIELDS=new Set(RAW_STATS_FIELDS.map(f=>f.key));
const RAW_NUMBER=/^-?(?:0|[1-9][0-9]{0,15})(?:\.[0-9]{1,8})?$/;

/** Reconcile ORIGINAL rows only. Never select the first conflicting number. */
export function summarizeRawNumericRows(rows){
  if(!Array.isArray(rows)||rows.length===0)
    throw new TypeError("Numeric source rows are required");
  const seenRows=new Set(),found=new Map();
  for(const row of rows){
    if(!Array.isArray(row)||row.length!==2||
      !Number.isSafeInteger(row[0])||row[0]<=0||seenRows.has(row[0])||
      row[1]===null||typeof row[1]!=="object"||Array.isArray(row[1]))
      throw new TypeError("Invalid or duplicate numeric source row");
    seenRows.add(row[0]);
    for(const [key,value] of Object.entries(row[1])){
      if(!VALID_FIELDS.has(key)||typeof value!=="string"||!RAW_NUMBER.test(value))
        throw new TypeError("Unapproved numeric field or value");
      if(!found.has(key))found.set(key,[]);
      found.get(key).push({sourceRowNumber:row[0],value});
    }
  }
  const fields=new Map();
  for(const [key,observations] of found){
    const distinct=[...new Set(observations.map(x=>x.value))];
    fields.set(key,{
      key,
      rawValue:distinct.length===1?distinct[0]:null,
      values:distinct,
      status:distinct.length>1?"conflict":
        observations.length<rows.length?"partial":"consistent",
      observedIn:observations.length,
      sourceCount:rows.length,
      sourceRowNumbers:observations.map(x=>x.sourceRowNumber),
    });
  }
  return {sourceCount:rows.length,fields};
}

/** Returns null for a missing or conflicting field, NEVER a made-up zero. */
export function comparableRawNumber(summary,key){
  const field=summary?.fields?.get(key);
  if(!field||field.status==="conflict"||!RAW_NUMBER.test(field.rawValue??""))
    return null;
  const numeric=Number(field.rawValue);
  return Number.isFinite(numeric)&&
    (!Number.isInteger(numeric)||Number.isSafeInteger(numeric))
    ?numeric:null;
}

/** Inclusive numeric filtering. Only triggered after the optional stats load. */
export function matchesRawStat(summary,key,min=null,max=null){
  if(!VALID_FIELDS.has(key))return false;
  const numeric=comparableRawNumber(summary,key);
  return numeric!==null && (min===null||numeric>=min)
    &&(max===null||numeric<=max);
}

export function compareSourceStats(summaries,field){
  if(!VALID_FIELDS.has(field)||!Array.isArray(summaries)||summaries.length<2)
    return null;
  const values=summaries.map(summary=>{
    const record=summary?.fields?.get(field)??null;
    return {record,numeric:comparableRawNumber(summary,field)};
  });
  // A difference is shown ONLY where every original definition records
  // the same field and there are no conflicting or missing values.
  if(values.some(v=>v.numeric===null||v.record.status!=="consistent"))
    return {values,difference:null};
  const nums=values.map(v=>v.numeric);
  const magnitude=Math.max(...nums)-Math.min(...nums);
  return {values,difference:Number.isFinite(magnitude)?magnitude:null};
}

function safeCell(value,delimiter){
  let text=value===null||value===undefined?"":String(value);
  // Excel interprets + - = @ formulas even in quoted CSV cells.
  if(/^[\s\uFEFF]*[=+\-@]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}

/**
 * Exports every currently filtered index row, NOT just the current page.
 * The optional numeric column is sourced from one selected raw field;
 * no missing data is replaced with zero. UTF-8 BOM supports Excel.
 */
export function exportFilteredClientCsv(rows,{
  pt=false,field="",summaries=new Map(),
}={}){
  if(!Array.isArray(rows))throw new TypeError("Filtered source rows required");
  if(field&&!VALID_FIELDS.has(field))
    throw new TypeError("Unknown numeric source field");
  const delimiter=pt?";":",";
  const headings=[
    "ID","Official English name","Original category","Raw level",
    "Raw grade","Source definitions","Identity status","Reviewed equipment",
  ];
  if(field)headings.push("Raw "+field+" (client snapshot 1)","Numeric field source status");
  const lines=[headings.map(x=>safeCell(x,delimiter)).join(delimiter)];
  for(const row of rows){
    if(!Array.isArray(row)||row.length!==9)
      throw new TypeError("Invalid index record");
    const cells=[
      row[0],row[1]??"",row[2]??"",row[3]??"",row[4]??"",
      row[5],row[6],row[8]===1?"yes":"no",
    ];
    if(field){
      const rec=summaries.get(row[0])?.fields?.get(field);
      cells.push(rec?rec.values.join(" | "):"",rec?.status??"absent");
    }
    lines.push(cells.map(x=>safeCell(x,delimiter)).join(delimiter));
  }
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
