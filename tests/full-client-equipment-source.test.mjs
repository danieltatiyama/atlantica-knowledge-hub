import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  EQUIPMENT_LIKE_CLIENT_CATEGORIES,FULL_CLIENT_EQUIPMENT_CATALOG,
  FULL_CLIENT_EQUIPMENT_COUNT,FULL_CLIENT_EQUIPMENT_NEW_COUNT,
  FULL_CLIENT_EQUIPMENT_REVIEWED_COUNT,getClientEquipmentSourceById,
  getClientEquipmentSourceProfile,getSourceItemLink,
  getOriginalClientItemIdentity,
} from "../src/data/full-client-equipment-source.mjs";
import {summarizeRawNumericRows} from "../src/data/full-client-stats-tools.mjs";
import {EQUIPMENT_ITEM_NAMES_EN} from "../src/data/equipment-item-names-en.ts";

test("equipment pages now cover exactly 2462 named original source IDs",()=>{
  assert.equal(FULL_CLIENT_EQUIPMENT_COUNT,2462);
  assert.equal(FULL_CLIENT_EQUIPMENT_REVIEWED_COUNT,551);
  assert.equal(FULL_CLIENT_EQUIPMENT_NEW_COUNT,1911);
  assert.equal(FULL_CLIENT_EQUIPMENT_CATALOG.length,2462);
  assert.equal(FULL_CLIENT_EQUIPMENT_CATALOG.filter(x=>x.reviewed).length,551);
  assert.equal(FULL_CLIENT_EQUIPMENT_CATALOG.filter(x=>!x.reviewed).length,1911);
  assert.equal(new Set(EQUIPMENT_LIKE_CLIENT_CATEGORIES).size,
    EQUIPMENT_LIKE_CLIENT_CATEGORIES.length);
  assert.equal(new Set(FULL_CLIENT_EQUIPMENT_CATALOG.map(x=>x.id)).size,2462);
  for(const item of FULL_CLIENT_EQUIPMENT_CATALOG){
    assert.match(item.id,/^[1-9]\d*$/);
    assert.ok(item.nameEn);
    assert.ok(EQUIPMENT_LIKE_CLIENT_CATEGORIES.includes(item.sourceCategory));
    assert.equal(Boolean(EQUIPMENT_ITEM_NAMES_EN[item.id]),item.reviewed);
    assert.deepEqual(getClientEquipmentSourceById(item.id),item);
  }
});

test("the original 551 names stay exact and are routed to original reviewed pages",()=>{
  for(const [id,name] of Object.entries(EQUIPMENT_ITEM_NAMES_EN)){
    const result=getClientEquipmentSourceProfile(id);
    assert.equal(result.item.reviewed,true);
    assert.equal(result.item.nameEn,name);
    assert.equal(getSourceItemLink(id,"/pt-br"),"/pt-br/items/"+id+"/");
  }
  assert.equal(getOriginalClientItemIdentity("1").nameEn,"Spirit Sword");
  assert.equal(getOriginalClientItemIdentity("429").nameEn,"Immortal Bow");
  assert.equal(getOriginalClientItemIdentity("437").nameEn,"Immortal Bow");
  assert.equal(getOriginalClientItemIdentity("3890").status,"collision");
  assert.equal(getOriginalClientItemIdentity("3890").nameEn,null);
  assert.equal(getSourceItemLink("5100"),"/items/profile/?id=5100");
});

test("every 1911 new source profile has original ItemType source definitions",()=>{
  const evidence=new Set(),seenSourceRows=new Set();
  let numericProfiles=0,parsedRecipes=0;
  for(const item of FULL_CLIENT_EQUIPMENT_CATALOG.filter(x=>!x.reviewed)){
    const profile=getClientEquipmentSourceProfile(item.id);
    assert.ok(profile.detail.s.length>0);
    assert.equal(profile.detail.s.length,item.sourceDefinitionCount);
    assert.ok(profile.detail.v.length>0);
    const sources=new Set(profile.detail.s.map(x=>x[0]));
    assert.equal(new Set(profile.detail.v.flat()).size,sources.size);
    for(const def of profile.detail.s){
      assert.ok(!seenSourceRows.has(def[0]),"Source record duplicated across separate IDs");
      seenSourceRows.add(def[0]);
      assert.match(def[1],/^[A-Za-z0-9_.-]+$/);
      assert.ok(["general","specific"].includes(def[2]));
      assert.equal(def.length,10);
      if(def[8].startsWith("parsed-")){
        assert.ok(def[9].length>0);
        parsedRecipes++;
      }
    }
    if(profile.rawStats){
      numericProfiles++;
      assert.ok(profile.summary?.sourceCount>0);
      assert.deepEqual(profile.summary,summarizeRawNumericRows(profile.rawStats));
      for(const [key,field] of profile.summary.fields){
        assert.ok(["consistent","partial","conflict"].includes(field.status));
        if(field.status==="conflict")assert.equal(field.rawValue,null);
      }
    }
    evidence.add(item.id);
  }
  assert.equal(evidence.size,1911);
  assert.ok(numericProfiles>0);
  assert.ok(parsedRecipes>0);
});

test("every new profile exposes safe crosslinks and separated source/review status",()=>{
  const page=readFileSync("src/components/ClientSourceEquipmentPage.astro","utf8");
  const en=readFileSync("src/pages/items/[id].astro","utf8");
  const pt=readFileSync("src/pages/pt-br/items/[id].astro","utf8");
  const catalog=readFileSync("src/components/ItemCatalogPage.astro","utf8");
  assert.ok(page.includes("getClientEquipmentSourceProfile(itemId)"));
  assert.ok(page.includes("getOriginalClientItemIdentity(id)"));
  assert.ok(page.includes("<ClientCraftingBacklinks"));
  assert.ok(page.includes("Where to obtain")||page.includes("How to obtain"));
  assert.ok(page.includes("ItemType*.ndt"));
  assert.ok(page.includes('id="crafting"'));
  assert.ok(page.includes('id="stats"'));
  assert.ok(page.includes('id="obtain"'));
  assert.ok(!page.includes(".innerHTML"));
  for(const p of [en,pt]){
    assert.ok(p.includes("FULL_CLIENT_EQUIPMENT_CATALOG.map"));
    assert.ok(p.includes("EQUIPMENT_ITEM_CATALOG_BY_ID.get"));
    assert.ok(p.includes("<ClientSourceEquipmentPage"));
    assert.ok(p.includes("<ItemDetailPage"));
  }
  assert.ok(catalog.includes("FULL_CLIENT_EQUIPMENT_CATALOG.map"));
  assert.ok(catalog.includes('id="item-evidence"'));
  assert.ok(catalog.includes("item.reviewed"));
});
