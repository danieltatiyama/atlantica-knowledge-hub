/**
 * Quantity controls for the player-facing crafting calculator.
 * A catalog hasCraftMaterials flag is only a shortlist: the original
 * parsed recipe in client details must be rechecked before selection.
 * No client source proves current live-server craftability.
 */
import {craftGameplayPolicy} from "./client-crafting-gameplay-policy.mjs";
export const CRAFT_PLAN_MAX_OUTPUT=10000;

export function isSourceRecipeCandidate(row){
  return Array.isArray(row)&&row.length===9&&row[6]==="named"&&
    row[7]===1&&typeof row[1]==="string"&&row[1].length>0;
}

export function resolveRootCraftBatch({recipes,category,selectedVariant,manualBatch}){
  if(!Array.isArray(recipes)||recipes.length===0)
    return {ready:false,reason:"no-source-recipe",variantCount:0};
  if(recipes.length>1&&
     (!Number.isInteger(selectedVariant)||selectedVariant<0||selectedVariant>=recipes.length))
    return {ready:false,reason:"choose-variant",variantCount:recipes.length};
  const index=recipes.length===1?0:selectedVariant;
  const recipe=recipes[index];
  const policy=craftGameplayPolicy(category);
  let batch,source;
  if(policy.equipment){
    batch=1;source="confirmed-equipment-rule";
  }else if(manualBatch!==undefined&&manualBatch!==null&&manualBatch!==""){
    const input=String(manualBatch);
    if(!/^[1-9]\d{0,5}$/.test(input))return {ready:false,reason:"invalid-manual-batch",variantCount:recipes.length};
    batch=Number(input);source="manual";
  }else if(Number.isSafeInteger(recipe.batchSize)&&recipe.batchSize>0){
    batch=recipe.batchSize;source="original-client-unit";
  }else{
    return {ready:false,reason:"missing-batch",variantCount:recipes.length};
  }
  if(!Number.isSafeInteger(batch)||batch<1||batch>CRAFT_PLAN_MAX_OUTPUT)
    return {ready:false,reason:"batch-over-limit",variantCount:recipes.length};
  const max=Math.floor(CRAFT_PLAN_MAX_OUTPUT/batch)*batch;
  return {
    ready:true,reason:null,variantCount:recipes.length,
    variantIndex:index,batch,step:batch,min:batch,max,
    maxPerOperation:policy.maxPerOperation,source,
  };
}

export function isAllowedCraftQuantity(value,batch,limit=CRAFT_PLAN_MAX_OUTPUT){
  if(!Number.isSafeInteger(batch)||batch<1||batch>limit)return false;
  const n=typeof value==="number"?value:Number(value);
  const raw=String(value);
  return /^\d+$/.test(raw)&&Number.isSafeInteger(n)&&
    n>=batch&&n<=limit&&n%batch===0;
}
