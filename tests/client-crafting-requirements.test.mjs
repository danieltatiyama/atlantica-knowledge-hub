import test from "node:test";
import assert from "node:assert/strict";
import clientItems from "../src/data/client-equipment-facts.json" with {type:"json"};
import clientAttributes from "../src/data/client-item-attributes.json" with {type:"json"};
import {
  getClientMaterialName,CLIENT_MATERIAL_NAMES_EN,CLIENT_MATERIAL_NAME_COUNT
} from "../src/data/client-material-names-en.mjs";
import {
  summarizeSourceRawField,normalizeSourceIngredients,summarizeClientCrafting
} from "../src/data/client-equipment-crafting-summary.mjs";
import {
  getClientRawRequirements,CLIENT_RAW_REQUIREMENTS_COUNT,
  CLIENT_CLASS_CODE_ITEM_COUNT,CLIENT_CLASS_CODE_SOURCE_ROWS
} from "../src/data/client-source-requirements.mjs";

const find=id=>clientItems.records.find(r=>r.id===String(id));
const clone=o=>JSON.parse(JSON.stringify(o));

test("all 84 client material names are unique, exact-ID and cover all 551 source recipes",()=>{
  assert.equal(CLIENT_MATERIAL_NAME_COUNT,84);
  assert.equal(Object.keys(CLIENT_MATERIAL_NAMES_EN).length,84);
  assert.equal(getClientMaterialName("5100"),"Coral");
  assert.equal(getClientMaterialName(6080),"Maple");
  assert.equal(getClientMaterialName("7050"),"Thread");
  assert.equal(getClientMaterialName("5340"),"Large Diamond");
  assert.equal(getClientMaterialName("28308"),"Earth Essence");
  assert.equal(getClientMaterialName("0"),undefined);
  assert.equal(getClientMaterialName("999999999"),undefined);
  const ids=new Set(),quantities=[];
  for(const item of clientItems.records){
    for(const src of item.sourceDefinitions)for(const m of src.ingredients){
      ids.add(m.itemId);
      assert.ok(getClientMaterialName(m.itemId),item.nameEn+" missing "+m.itemId);
      quantities.push(m.quantity);
    }
  }
  assert.equal(clientItems.records.length,551);
  assert.equal(ids.size,84);
  assert.equal(quantities.length,7506);
  assert.ok(quantities.every(n=>Number.isSafeInteger(n)&&n>0));
});

test("all general/specific recipe lists agree after order-independent normalization",()=>{
  let withMaterials=0,withoutMaterials=0,parsedSourceRows=0;
  for(const item of clientItems.records){
    const result=summarizeClientCrafting(item);
    assert.equal(result.recipes.length<=1,true,item.nameEn+" has divergent material lists");
    assert.equal(result.missingMaterialNames,0);
    assert.equal(result.sourceCount,item.sourceDefinitions.length);
    assert.equal(result.fields.workRaw.status,"consistent");
    assert.ok(result.fields.unitRaw.status==="partial" ||
              result.fields.unitRaw.status==="consistent" ||
              result.fields.unitRaw.status==="not-provided");
    assert.equal(result.status==="different-source-materials",false);
    if(result.recipes.length){
      withMaterials++;
      assert.equal(result.recipes[0].sourceRecordIds.length,result.sourceCount);
      parsedSourceRows+=result.parsedSourceCount;
    }else{
      withoutMaterials++;
      assert.equal(result.status,"not-provided");
    }
  }
  assert.equal(withMaterials,529);
  assert.equal(withoutMaterials,22);
  assert.equal(parsedSourceRows,987);
});

test("Spirit Sword preserves source work, partial unit and two material names",()=>{
  const result=summarizeClientCrafting(find(1));
  assert.equal(result.status,"same-source-materials");
  assert.equal(result.sourceCount,2);
  assert.equal(result.fields.workRaw.value,"450");
  assert.equal(result.fields.workRaw.status,"consistent");
  assert.equal(result.fields.unitRaw.value,"1");
  assert.equal(result.fields.unitRaw.status,"partial");
  assert.deepEqual(result.recipes[0].materials,[
    {itemId:"5100",quantity:5,nameEn:"Coral"},
    {itemId:"6080",quantity:4,nameEn:"Maple"},
  ]);
  assert.deepEqual(result.recipes[0].sourceRecordIds,[112473,192767]);
  const phoenix=summarizeClientCrafting(find(1420));
  assert.equal(phoenix.fields.workRaw.value,"60000000");
  assert.equal(phoenix.recipes[0].materials.length,9);
  assert.ok(phoenix.recipes[0].materials.some(x=>
    x.nameEn==="Phoenix's Feather"&&x.quantity===8));
});

test("no materials does not prove noncraftability, raw zero work is preserved",()=>{
  const item=find(26);
  const view=summarizeClientCrafting(item);
  assert.equal(view.status,"not-provided");
  assert.equal(view.recipes.length,0);
  assert.equal(view.fields.workRaw.value,"0");
  assert.equal(view.sourcesWithoutIngredients,item.sourceDefinitions.length);
});

test("future conflicts remain separate; missing unit cannot invent zero",()=>{
  const item=clone(find(1));
  item.sourceDefinitions[1].ingredients[0].quantity=6;
  const diff=summarizeClientCrafting(item);
  assert.equal(diff.status,"different-source-materials");
  assert.equal(diff.recipes.length,2);
  assert.equal(diff.recipes[0].materials[0].quantity,5);
  assert.equal(diff.recipes[1].materials[0].quantity,6);
  item.sourceDefinitions[1].workRaw=777;
  const work=summarizeClientCrafting(item).fields.workRaw;
  assert.equal(work.status,"conflict");
  assert.equal(work.value,null);
  assert.deepEqual(work.observations.map(x=>x.value),["450","777"]);
  const missing=summarizeSourceRawField([
    {recordId:1,unitRaw:null},{recordId:2,unitRaw:1}
  ],"unitRaw");
  assert.equal(missing.status,"partial");
  assert.equal(missing.value,"1");
  assert.deepEqual(normalizeSourceIngredients({
    ingredientsStatus:"parsed-client-recipe",
    ingredients:[{itemId:"6080",quantity:4},{itemId:"5100",quantity:5}]
  }),[{itemId:"5100",quantity:5},{itemId:"6080",quantity:4}]);
  assert.throws(()=>normalizeSourceIngredients({
    ingredientsStatus:"parsed-client-recipe",
    ingredients:[{itemId:"0",quantity:1}]
  }),TypeError);
  assert.throws(()=>summarizeClientCrafting({sourceDefinitions:[]}),TypeError);
});

test("original MakeSkillLevel available for 551 existing items, source rows match",()=>{
  assert.equal(CLIENT_RAW_REQUIREMENTS_COUNT,551);
  assert.equal(CLIENT_CLASS_CODE_ITEM_COUNT,222);
  assert.equal(CLIENT_CLASS_CODE_SOURCE_ROWS,242);
  const byId=new Map(clientAttributes.records.map(item=>[item.id,item]));
  assert.equal(byId.size,551);
  let classes=0,classRows=0;
  for(const [id,source] of byId){
    const req=getClientRawRequirements(id);
    assert.equal(req.id,id);
    assert.equal(req.nameEn,source.nameEn);
    assert.match(req.makeSkillLevelRaw,/^(0|[1-9]\d*)$/);
    assert.deepEqual(req.makeSkillSourceRows,
      source.sourceRows.map(row=>row.sourceRowNumber));
    for(const row of req.classSourceRows){
      assert.ok(req.makeSkillSourceRows.includes(row.sourceRowNumber));
      assert.ok(row.classCodes.length);
      assert.ok(row.classCodes.every(token=>/^CLS(?:1)?_[A-Z0-9_]+$/.test(token)));
      classRows++;
    }
    if(req.classSourceRows.length)classes++;
  }
  assert.equal(classes,222);
  assert.equal(classRows,242);
  assert.equal(getClientRawRequirements("99999999"),undefined);
});

test("MakeSkillLevel is distinct from raw equip level and class code lists never auto-union",()=>{
  const sword=getClientRawRequirements(1);
  assert.equal(sword.makeSkillLevelRaw,"1");
  assert.deepEqual(sword.makeSkillSourceRows,[11299,13493]);
  assert.deepEqual(sword.classSourceRows.map(s=>s.sourceRowNumber),[11299,13493]);
  assert.equal(sword.classSourceRows[0].classCodes.length,9);
  assert.equal(sword.classSourceRows[1].classCodes.length,21);
  assert.ok(sword.classSourceRows[1].classCodes.includes("CLS1_ARTHUR"));
  assert.ok(!sword.classSourceRows[0].classCodes.includes("CLS1_ARTHUR"));
  const instrument=getClientRawRequirements(1420);
  assert.equal(instrument.makeSkillLevelRaw,"85");
  assert.equal(instrument.classSourceRows.length,1);
  assert.ok(instrument.classSourceRows[0].classCodes.includes("CLS_GUITARIST"));
  const robe=getClientRawRequirements(650);
  assert.equal(robe.makeSkillLevelRaw,"4");
  assert.equal(robe.classSourceRows.length,0);
  const bow=getClientRawRequirements(196);
  assert.equal(bow.makeSkillLevelRaw,"120"); // Not a minimum character level.
  assert.equal(bow.classSourceRows.length,0);
});
