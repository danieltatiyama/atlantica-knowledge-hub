/**
 * Player-facing crafting planner with source-derived recipes and explicit
 * user-confirmed gameplay overrides for equipment. Read-only calculations.
 * Inspiration: Jana4U's MIT-licensed open-source calculator (linked in docs).
 * This is an independent implementation using our own client data and UI.
 */
import {craftGameplayPolicy,OTHER_MAX_PER_OPERATION} from "./client-crafting-gameplay-policy.mjs";
const ID=/^[1-9][0-9]{0,12}$/;
const POS=/^[1-9][0-9]*$/;
const valid=id=>ID.test(String(id));
const count=value=>{
  const text=String(value??"");
  if(!POS.test(text)||text.length>36)throw new RangeError("Expected positive integer quantity");
  return BigInt(text);
};
/**
 * Every crafting stage, including intermediate products, is split into
 * legal per-operation chunks. Grouping keeps even huge plans at <=2 rows.
 *
 * Example: requested 250, batch 20 -> 13 batches -> 260 produced;
 * those 13 batches consume ingredients for 260, not for 250.
 */
export function splitCraftOperations({
  batches,batchSize,maxPerOperation,ingredients=[],maxIngredientPerOperation=OTHER_MAX_PER_OPERATION,
}){
  const n=count(batches),unit=count(batchSize),limit=count(maxPerOperation);
  const ingredientLimit=count(maxIngredientPerOperation);
  if(unit>limit)throw new RangeError("Batch exceeds the per-operation output limit");
  let batchesPerOperation=limit/unit;
  const bounds=[];
  for(const [itemId,quantityPerBatch] of ingredients){
    if(!valid(itemId))throw new RangeError("Invalid ingredient ID");
    const perBatch=count(quantityPerBatch);
    const cap=ingredientLimit/perBatch;
    if(cap<1n)throw new RangeError(
      "Ingredient "+itemId+" exceeds the 10,000-per-ingredient operation limit for a single batch");
    bounds.push({itemId:String(itemId),perBatch:String(perBatch),batchesMax:String(cap)});
    if(cap<batchesPerOperation)batchesPerOperation=cap;
  }
  const complete=n/batchesPerOperation,remainder=n%batchesPerOperation;
  const groups=[];
  if(complete>0n)groups.push({
    operations:String(complete),
    batchesEach:String(batchesPerOperation),
    outputEach:String(batchesPerOperation*unit),
  });
  if(remainder>0n)groups.push({
    operations:"1",batchesEach:String(remainder),outputEach:String(remainder*unit),
  });
  const operations=complete+(remainder>0n?1n:0n);
  const limitingIngredients=bounds.filter(x=>BigInt(x.batchesMax)===batchesPerOperation);
  return {
    operations:String(operations),groups,
    batchesPerOperation:String(batchesPerOperation),
    maxOutputPerOperation:String(batchesPerOperation*unit),
    maxIngredientPerOperation:String(ingredientLimit),
    limitingIngredients,
  };
}
/**
 * Turn a parent's legal operation groups into the actual ingredient
 * consumption per operation. The raw recipe specifies ingredient units per
 * PARENT BATCH, not per item and not per entire crafting request.
 *
 * Parent: 7 operations of 20 armors and 1 of 2, batch size 1.
 * Ingredient: 250 stones per armor batch.
 * Result: 7 × 5000 + 1 × 500 = 35,500 stones.
 *
 * Intermediate batches are rounded separately in the planner. This helper
 * must never round the consumption imposed by the parent recipe.
 */
export function deriveParentConsumptionGroups({
  unitsPerParentBatch,parentBatchSize,parentOperationGroups,
}){
  const units=count(unitsPerParentBatch),batch=count(parentBatchSize);
  if(!Array.isArray(parentOperationGroups))throw new TypeError("Missing parent operation groups");
  return parentOperationGroups.map(group=>{
    const operations=count(group.operations),output=count(group.outputEach);
    if(output%batch!==0n)
      throw new RangeError("Parent operation output must be a full multiple of its batch");
    const consumedEach=units*(output/batch);
    return {
      operations:String(operations),
      consumedEach:String(consumedEach),
      totalConsumed:String(operations*consumedEach),
    };
  });
}
export function planClientCrafting({
  itemId,quantity,recipesById={},choices={},batchOverrides={},
  itemCategories={},buyIds=[],doneIds=[],strictTargetBatch=false,
}){
  if(!valid(itemId))throw new RangeError("Invalid target ItemID");
  const requested=count(quantity);
  if(strictTargetBatch&&requested>10000n)
    throw new RangeError("Requested output exceeds the 10,000-item planning limit");
  const buy=new Set(buyIds.map(String)),done=new Set(doneIds.map(String));
  if([...buy,...done].some(id=>!valid(id)))
    throw new RangeError("Invalid purchased/completed ItemID");
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
    if(done.has(id)){
      // Already fulfilled in this plan: no more crafting, purchasing or
      // descendant ingredients are needed for this ItemID.
      mode="done";
    }else if(buy.has(id)){
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
      if(!reason&&recipe.materials.some(([,qty])=>count(qty)>BigInt(OTHER_MAX_PER_OPERATION)))
        reason="ingredient-over-limit";
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
      const distribution=splitCraftOperations({
        batches:String(batches),batchSize:String(batch),
        maxPerOperation:String(maxPerOperation),
        ingredients:node.recipe.materials,
      });
      steps.push({itemId:id,requested:String(needed),batchSize:String(batch),
        totalBatches:String(batches),output:String(produced),
        excess:String(produced-needed),operations:distribution.operations,
        operationGroups:distribution.groups,
        maxBatchesPerOperation:distribution.batchesPerOperation,
        maxOutputPerOperation:distribution.maxOutputPerOperation,
        maxIngredientPerOperation:distribution.maxIngredientPerOperation,
        limitingIngredients:distribution.limitingIngredients,
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
    }else if(needed>0n&&node.mode!=="done"){
      leaves.push({itemId:id,quantity:String(needed)});
    }
  }
  if(processed!==nodes.size)throw Error("Circular recipe graph");
  const stepMap=new Map(steps.map(step=>[step.itemId,step]));
  // Keep a reversible, consolidated record of completed ItemIDs. Its
  // quantity is the demand that was already covered, not a new purchase.
  const completedRows=[...nodes.values()]
    .filter(node=>node.mode==="done"&&(demand.get(node.id)??0n)>0n)
    .map(node=>({itemId:node.id,quantity:String(demand.get(node.id))}));
  
  const tree=[],visitedTree=new Set();
  function treeWalk(id,depth,branchQty,ancestorPath="",consumption=null){
    const node=nodes.get(id),step=stepMap.get(id);
    // Remove the completed item AND its subtree from the pending tree.
    // A shared ingredient required by another unfinished parent remains.
    if(node.mode==="done")return;
    const parentStep=consumption?stepMap.get(consumption.parentItemId):null;
    const consumptionGroups=consumption?deriveParentConsumptionGroups({
      unitsPerParentBatch:consumption.unitsPerParentBatch,
      parentBatchSize:parentStep?.batchSize,
      parentOperationGroups:parentStep?.operationGroups,
    }):[];
    if(consumption&&consumptionGroups.reduce(
      (sum,group)=>sum+BigInt(group.totalConsumed),0n)!==BigInt(branchQty))
      throw new Error("Parent operation consumption must match the source recipe branch");
    const repeated=visitedTree.has(id);
    visitedTree.add(id);
    tree.push({
      itemId:id,depth,path:ancestorPath+"/"+id,branchQuantity:String(branchQty),
      parentItemId:consumption?.parentItemId??null,
      unitsPerParentBatch:consumption?.unitsPerParentBatch??null,
      parentBatches:consumption?.parentBatches??null,
      consumptionGroups,
      totalRequired:String(demand.get(id)??0n),
      output:step?.output??null,
      excess:step?.excess??null,
      mode:node.mode,
      sharedReference:repeated,
      batchSize:step?.batchSize??null,
      totalBatches:step?.totalBatches??null,
      operations:step?.operations??null,
      operationGroups:step?.operationGroups??[],
      maxOutputPerOperation:step?.maxOutputPerOperation??null,
      limitingIngredients:step?.limitingIngredients??[],
      batchSource:step?.batchSource??null,
    });
    if(!repeated&&node.recipe){
      const batches=BigInt(step.totalBatches);
      for(const [child,rawQty] of node.recipe.materials)
        treeWalk(child,depth+1,count(rawQty)*batches,ancestorPath+"/"+id,{
          parentItemId:id,unitsPerParentBatch:String(rawQty),parentBatches:String(batches),
        });
    }
  }
  treeWalk(String(itemId),0,requested);
  return {
    targetItemId:String(itemId),requested:String(requested),
    steps,leaves,issues,tree,completedRows,
    complete:issues.length===0&&(steps.length>0||done.has(String(itemId))),
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
