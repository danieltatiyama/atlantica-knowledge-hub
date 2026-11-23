/**
 * Player-facing crafting planner with source-derived recipes and explicit
 * user-confirmed gameplay overrides for equipment. Read-only calculations.
 * Inspiration: Jana4U's MIT-licensed open-source calculator (linked in docs).
 * This is an independent implementation using our own client data and UI.
 */
import {craftGameplayPolicy} from "./client-crafting-gameplay-policy.mjs";
const ID=/^[1-9][0-9]{0,12}$/;
const POS=/^[1-9][0-9]*$/;
const valid=id=>ID.test(String(id));
const count=value=>{
  const text=String(value??"");
  if(!POS.test(text)||text.length>36)throw new RangeError("Expected positive integer quantity");
  return BigInt(text);
};
export function planClientCrafting({
  itemId,quantity,recipesById={},choices={},batchOverrides={},
  itemCategories={},buyIds=[],strictTargetBatch=false,
}){
  if(!valid(itemId))throw new RangeError("Invalid target ItemID");
  const requested=count(quantity);
  // A player-facing craft plan must never present a recipe-less target as a
  // purchasable leaf. This also protects future callers that bypass the UI.
  if(strictTargetBatch&&(!Array.isArray(recipesById[String(itemId)])||
     recipesById[String(itemId)].length===0))
    throw new Error("Target item has no parsed client crafting recipe");
  if(strictTargetBatch&&requested>10000n)
    throw new RangeError("Requested output exceeds the 10,000-item planning limit");
  const buy=new Set(buyIds.map(String));
  if([...buy].some(id=>!valid(id)))throw new RangeError("Invalid purchased ItemID");
  const nodes=new Map(),visiting=new Set(),visited=new Set(),issues=[];
  function walk(id){
    if(visiting.has(id))throw Error("Circular recipe dependency involving ItemID "+id);
    if(visited.has(id))return;
    if(nodes.size>=250)throw Error("Recipe graph exceeds 250 unique IDs");
    visiting.add(id);
    const variants=recipesById[id]??[];
    if(!Array.isArray(variants))throw Error("Invalid recipe variants for "+id);
    const policy=craftGameplayPolicy(itemCategories[id]);
    let recipe=null,batch=null,reason=null,manual=false,mode="base",batchSource=null;
    if(buy.has(id)){
      mode="buy";
    }else if(variants.length>1&&!(id in choices)){
      reason="choose-variant";mode="unresolved";
    }else if(variants.length){
      const selected=variants.length===1?0:Number(choices[id]);
      if(!Number.isSafeInteger(selected)||selected<0||selected>=variants.length)
        throw Error("Invalid recipe selection for "+id);
      recipe=variants[selected];mode="craft";
      if(!Array.isArray(recipe.materials)||recipe.materials.length<1)
        throw Error("Invalid source ingredients for "+id);
      if(policy.equipment){
        batch=1n;batchSource="confirmed-equipment-rule";
      }else if(recipe.batchSize!==null&&recipe.batchSize!==undefined){
        batch=count(recipe.batchSize);batchSource="original-client-unit";
      }else if(id in batchOverrides){
        batch=count(batchOverrides[id]);manual=true;batchSource="manual";
      }else reason="missing-batch";
      if(batch!==null&&batch>BigInt(policy.maxPerOperation))reason="batch-over-limit";
      if(reason)mode="unresolved";
    }
    if(reason){
      issues.push({itemId:id,kind:reason,variantCount:variants.length});
      recipe=null;
    }
    nodes.set(id,{id,recipe,batch,manual,mode,batchSource,policy,
      hasRecipe:variants.length>0,reason});
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
  // Aggregate every parent's requirements BEFORE rounding a shared child.
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
      const batch=node.batch;
      if(strictTargetBatch&&id===String(itemId)&&needed%batch!==0n)
        throw new RangeError("Requested output must be an exact multiple of its source batch");
      const batches=(needed+batch-1n)/batch;
      const produced=batches*batch;
      const maxPerOperation=BigInt(node.policy.maxPerOperation);
      const batchesPerOperation=maxPerOperation/batch;
      const operations=(batches+batchesPerOperation-1n)/batchesPerOperation;
      steps.push({itemId:id,requested:String(needed),batchSize:String(batch),
        totalBatches:String(batches),output:String(produced),
        excess:String(produced-needed),operations:String(operations),
        maxPerOperation:String(maxPerOperation),
        manualBatch:node.manual,batchSource:node.batchSource});
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
  const stepMap=new Map(steps.map(step=>[step.itemId,step]));
  
  const tree=[],visitedTree=new Set();
  function treeWalk(id,depth,branchQty){
    const node=nodes.get(id),step=stepMap.get(id);
    const repeated=visitedTree.has(id);
    visitedTree.add(id);
    tree.push({
      itemId:id,depth,branchQuantity:String(branchQty),
      totalRequired:String(demand.get(id)??0n),
      output:step?.output??null,
      excess:step?.excess??null,
      mode:node.mode,
      sharedReference:repeated,
      batchSize:step?.batchSize??null,
      batchSource:step?.batchSource??null,
    });
    if(!repeated&&node.recipe){
      const batches=BigInt(step.totalBatches);
      for(const [child,rawQty] of node.recipe.materials)
        treeWalk(child,depth+1,count(rawQty)*batches);
    }
  }
  treeWalk(String(itemId),0,requested);
  return {
    targetItemId:String(itemId),requested:String(requested),
    steps,leaves,issues,tree,
    complete:issues.length===0&&steps.length>0,
    totalOperations:steps.reduce((sum,row)=>sum+BigInt(row.operations),0n).toString(),
    totalBatches:steps.reduce((sum,row)=>sum+BigInt(row.totalBatches),0n).toString(),
    rootOutput:stepMap.get(String(itemId))?.output??String(requested),
    leftoverRows:steps.filter(row=>BigInt(row.excess)>0n)
      .map(row=>({itemId:row.itemId,quantity:row.excess})),
  };
}
export function priceCraftLeaves(leaves,prices={}){
  let known=0n;
  const rows=leaves.map(row=>{
    const input=String(prices[row.itemId]??"").trim();
    if(!input)return {...row,unitPrice:null,total:null};
    if(!/^\d{1,20}$/.test(input))throw new RangeError("Invalid item market price");
    const unit=BigInt(input),total=unit*BigInt(row.quantity);
    known+=total;
    return {...row,unitPrice:String(unit),total:String(total)};
  });
  const unpricedItems=rows.filter(row=>row.total===null).length;
  return {rows,knownTotal:String(known),unpricedItems,
    complete:unpricedItems===0};
}
