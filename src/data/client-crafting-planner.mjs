/**
 * Read-only, graph-based crafting math from exact parsed client recipes.
 * All recipe ingredient quantities are per recorded batch, not per item.
 * Never infer missing Unit, or choose conflicting recipe variants.
 * Aggregates shared intermediate demand BEFORE rounding to source batches.
 */
const ID=/^[1-9][0-9]{0,12}$/;
const POS=/^[1-9][0-9]*$/;
const LIMIT=10000n;
const valid=id=>ID.test(String(id));
const count=value=>{
  const text=String(value??"");
  if(!POS.test(text)||text.length>36)throw new RangeError("Expected positive integer quantity");
  return BigInt(text);
};
export function planClientCrafting({itemId,quantity,recipesById={},choices={},batchOverrides={}}){
  if(!valid(itemId))throw new RangeError("Invalid target ItemID");
  const requested=count(quantity);
  const nodes=new Map(),visiting=new Set(),visited=new Set(),issues=[];
  function walk(id){
    if(visiting.has(id))throw Error("Circular recipe dependency involving ItemID "+id);
    if(visited.has(id))return;
    if(nodes.size>=250)throw Error("Recipe graph exceeds 250 unique IDs");
    visiting.add(id);
    const variants=recipesById[id]??[];
    if(!Array.isArray(variants))throw Error("Invalid recipe variants for "+id);
    let recipe=null,batch=null,reason=null,manual=false;
    if(variants.length>1&&!(id in choices)){
      reason="choose-variant";
    }else if(variants.length){
      const selected=variants.length===1?0:Number(choices[id]);
      if(!Number.isSafeInteger(selected)||selected<0||selected>=variants.length)
        throw Error("Invalid recipe selection for "+id);
      recipe=variants[selected];
      if(!Array.isArray(recipe.materials)||recipe.materials.length<1)
        throw Error("Invalid source ingredients for "+id);
      if(id in batchOverrides){
        batch=count(batchOverrides[id]);manual=true;
      }else if(recipe.batchSize!==null&&recipe.batchSize!==undefined){
        batch=count(recipe.batchSize);
      }else reason="missing-batch";
      if(batch!==null&&batch>LIMIT)reason="batch-over-limit";
    }
    if(reason){issues.push({itemId:id,kind:reason,variantCount:variants.length});recipe=null;}
    nodes.set(id,{id,recipe,batch,manual});
    if(recipe){
      const seen=new Set();
      for(const [materialId,qty] of recipe.materials){
        if(!valid(materialId)||seen.has(materialId))throw Error("Invalid source ingredient ID");
        seen.add(materialId);
        count(qty);
        walk(materialId);
      }
    }
    visiting.delete(id);visited.add(id);
  }
  walk(String(itemId));
  // Kahn topological order ensures every parent's demand has been collected
  // before a shared child is rounded to its own batch size.
  const incoming=new Map([...nodes.keys()].map(id=>[id,0]));
  for(const node of nodes.values())if(node.recipe){
    for(const [child] of node.recipe.materials)
      incoming.set(child,(incoming.get(child)??0)+1);
  }
  const ready=[...incoming].filter(([,n])=>n===0).map(([id])=>id);
  const demand=new Map([[String(itemId),requested]]);
  const steps=[],leaves=[];
  let processed=0;
  while(ready.length){
    const id=ready.shift(),node=nodes.get(id);
    processed++;
    const needed=demand.get(id)??0n;
    if(node.recipe){
      const batch=node.batch,batches=(needed+batch-1n)/batch;
      const produced=batches*batch;
      const batchesPerOperation=LIMIT/batch;
      const operations=(batches+batchesPerOperation-1n)/batchesPerOperation;
      steps.push({itemId:id,requested:String(needed),batchSize:String(batch),
        totalBatches:String(batches),output:String(produced),
        excess:String(produced-needed),operations:String(operations),manualBatch:node.manual});
      for(const [child,rawQty] of node.recipe.materials){
        const required=count(rawQty)*batches;
        const total=(demand.get(child)??0n)+required;
        if(String(total).length>36)throw new RangeError("Craft quantities exceed safety limit");
        demand.set(child,total);
        incoming.set(child,incoming.get(child)-1);
        if(incoming.get(child)===0)ready.push(child);
      }
    }else if(needed>0n){
      leaves.push({itemId:id,quantity:String(needed)});
    }
  }
  if(processed!==nodes.size)throw Error("Circular recipe graph");
  return {targetItemId:String(itemId),requested:String(requested),
    steps,leaves,issues,complete:issues.length===0&&steps.length>0,
    totalOperations:steps.reduce((sum,row)=>sum+BigInt(row.operations),0n).toString()};
}
export function priceCraftLeaves(leaves,prices={}){
  let known=0n,unknown=0;
  const rows=leaves.map(row=>{
    const input=String(prices[row.itemId]??"").trim();
    if(!input)return {...row,unitPrice:null,total:null};
    if(!/^\d{1,20}$/.test(input))throw new RangeError("Invalid item market price");
    const unit=BigInt(input),total=unit*BigInt(row.quantity);
    known+=total;return {...row,unitPrice:String(unit),total:String(total)};
  });
  unknown=rows.filter(row=>row.total===null).length;
  return {rows,knownTotal:String(known),unpricedItems:unknown,complete:unknown===0};
}
