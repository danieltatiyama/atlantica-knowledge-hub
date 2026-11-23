/**
 * Community-facing recipe variants derived from exact original ItemType rows.
 *
 * This is deliberately independent of item names and the assumed live-server
 * craftability. Identical INGREDIENT lists collapse to one recipe even if
 * a generic row omitted Unit. Genuine material variants remain separate.
 * Conflicting known batch values are reported, never resolved arbitrarily.
 */
export function buildClientRecipeViews(sourceDefinitions){
  if(!Array.isArray(sourceDefinitions))throw new TypeError("Expected original ItemType rows");
  const grouped=new Map();
  for(const row of sourceDefinitions){
    if(!Array.isArray(row)||row.length!==10)throw new TypeError("Invalid client ItemType source row");
    const [recordId,,,,,,,unit,state,materials]=row;
    if(typeof state!=="string"||!state.startsWith("parsed-")||!Array.isArray(materials)||!materials.length)
      continue;
    if(!Number.isSafeInteger(recordId)||recordId<1)throw new TypeError("Invalid source row ID");
    const parts=materials.map(pair=>{
      if(!Array.isArray(pair)||pair.length!==2||
         typeof pair[0]!=="string"||!/^[1-9]\d*$/.test(pair[0])||
         !Number.isSafeInteger(pair[1])||pair[1]<1)
         throw new TypeError("Invalid original recipe material pair");
      return [...pair];
    }).sort((a,b)=>Number(a[0])-Number(b[0]));
    const key=JSON.stringify(parts);
    if(!grouped.has(key))grouped.set(key,{materials:parts,sourceRows:[],units:[],missingUnits:0});
    const g=grouped.get(key);
    if(g.sourceRows.includes(recordId))throw new TypeError("Repeated original source row");
    g.sourceRows.push(recordId);
    if(unit===null||unit===undefined||unit==="")g.missingUnits++;
    else if(!Number.isSafeInteger(Number(unit))||Number(unit)<1){
      g.units.push(null); // Invalid reported unit: do NOT infer a batch size.
    }else g.units.push(Number(unit));
  }
  return [...grouped.values()].map(g=>{
    const values=[...new Set(g.units.filter(n=>n!==null))].sort((a,b)=>a-b);
    const bad=g.units.includes(null);
    const batchStatus=bad?"invalid":values.length>1?"conflict":
      values.length===0?"not-provided":g.missingUnits?"partial":"consistent";
    return {
      materials:g.materials,
      sourceRows:g.sourceRows.sort((a,b)=>a-b),
      batchSize:values.length===1&&!bad?values[0]:null,
      batchStatus,
      reportedBatches:values,
    };
  });
}
