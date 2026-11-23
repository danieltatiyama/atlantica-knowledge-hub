/**
 * Original client ItemType unitRaw is a SOURCE VALUE, not proof that a
 * particular item is craftable in today's live game. It can be absent in
 * generic rows or disagree across source variants. Never invent 1.
 *
 * The current client batch limit below is a user-supplied gameplay rule,
 * intentionally separated from the source-extracted unitRaw field.
 */
export const MAX_CRAFT_OUTPUT_PER_OPERATION=10000;
const GOOD=/^[1-9][0-9]{0,14}$/;

export function summarizeCraftBatch(sourceDefinitions){
  if(!Array.isArray(sourceDefinitions)||sourceDefinitions.length<1)
    throw new TypeError("Original source item definitions are required");
  const seen=new Set(),observations=[],invalid=[];
  for(const source of sourceDefinitions){
    let rowId,raw;
    if(Array.isArray(source)){
      if(source.length!==10)throw new TypeError("Invalid original ItemType source record");
      rowId=source[0];raw=source[7];
    }else if(source&&typeof source==="object"){
      rowId=source.recordId;raw=source.unitRaw;
    }else throw new TypeError("Invalid original source record");
    if(!Number.isSafeInteger(rowId)||rowId<=0||seen.has(rowId))
      throw new TypeError("Duplicate or invalid original source row number");
    seen.add(rowId);
    if(raw===null||raw===undefined||raw==="")continue;
    if((typeof raw!=="number"&&typeof raw!=="string")||
       !GOOD.test(String(raw))||!Number.isSafeInteger(Number(raw))){
      invalid.push({rowId,raw:String(raw)});
      continue;
    }
    observations.push({rowId,unit:Number(raw)});
  }
  const units=[...new Set(observations.map(x=>x.unit))].sort((a,b)=>a-b);
  const status=invalid.length?"invalid":units.length>1?"conflict":
    units.length===0?"not-provided":
    observations.length<sourceDefinitions.length?"partial":"consistent";
  const batchSize=(status==="consistent"||status==="partial")?units[0]:null;
  const maxBatchesPerOperation=batchSize===null?null:
    Math.floor(MAX_CRAFT_OUTPUT_PER_OPERATION/batchSize);
  const maxCraftQuantityPerOperation=batchSize===null?null:
    maxBatchesPerOperation*batchSize;
  return {
    status,batchSize,
    sourceValues:units,observations,invalid,
    observedIn:observations.length,sourceCount:sourceDefinitions.length,
    minCraftQuantity:batchSize,
    increment:batchSize,
    maxPerOperation:MAX_CRAFT_OUTPUT_PER_OPERATION,
    maxBatchesPerOperation,
    maxCraftQuantityPerOperation,
    ruleSource:"user-reported-gameplay",
    unitSource:"game-client-itemtype-unitRaw",
  };
}

/**
 * A small pure primitive for a FUTURE material calculator.
 * Calculation only; does not imply actual craftability/availability.
 * All quantities are integer units. Rounds desired output UP to batch.
 * For > 10k or non-divisor batches, splits into legal operation sizes.
 */
export function planCraftBatchOperations(requested,batch){
  if(!Number.isSafeInteger(requested)||requested<1||
     !Number.isSafeInteger(batch)||batch<1||
     batch>MAX_CRAFT_OUTPUT_PER_OPERATION)
    throw new RangeError("Requested output and source batch must be positive valid integers");
  const batches=Math.ceil(requested/batch);
  const perOperation=Math.floor(MAX_CRAFT_OUTPUT_PER_OPERATION/batch);
  const whole=Math.floor(batches/perOperation);
  const remainder=batches%perOperation;
  const operations=[];
  if(whole)operations.push({count:whole,batchesEach:perOperation,
    outputEach:perOperation*batch});
  if(remainder)operations.push({count:1,batchesEach:remainder,
    outputEach:remainder*batch});
  return {
    requested,
    batch,
    totalBatches:batches,
    totalOutput:batches*batch,
    excess:batches*batch-requested,
    totalOperations:whole+(remainder?1:0),
    operations,
  };
}
