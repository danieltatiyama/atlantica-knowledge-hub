import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {EQUIPMENT_ITEM_NAMES_EN} from "../src/data/equipment-item-names-en.ts";

const directory=resolve("public/data/client-items");
const read=path=>JSON.parse(readFileSync(resolve(directory,path),"utf8"));
const manifest=read("manifest.json");
const indexes=manifest.indexShards.map(read);
const rows=indexes.flatMap(x=>x.rows);
const byId=new Map(rows.map(row=>[row[0],row]));
const count=(field,value)=>rows.filter(r=>r[field]===value).length;

test("source manifest is complete, sharded, stable and preserves identity quarantine",()=>{
  assert.equal(manifest.dataset,"all-client-items");
  assert.equal(manifest.schemaVersion,"1.0");
  assert.equal(manifest.snapshotId,1);
  assert.equal(manifest.totalIds,23586);
  assert.equal(manifest.namedIds,22702);
  assert.equal(manifest.collisionIds,290);
  assert.equal(manifest.unresolvedIds,594);
  assert.equal(manifest.reviewedEquipmentIds,551);
  assert.equal(manifest.sourceDefinitionRows,27281);
  assert.equal(manifest.indexShards.length,6);
  assert.equal(manifest.detailBucketWidth,1000);
  assert.equal(rows.length,23586);
  assert.equal(byId.size,23586);
  assert.equal(count(6,"named"),22702);
  assert.equal(count(6,"collision"),290);
  assert.equal(count(6,"unresolved"),594);
  assert.equal(rows.filter(r=>r[8]===1).length,551);
  assert.equal(rows.reduce((n,r)=>n+r[5],0),27281);
  assert.equal(new Set(rows.map(r=>r[2]).filter(Boolean)).size,84);
  assert.deepEqual(indexes.map(x=>x.rows.length),[4000,4000,4000,4000,4000,3586]);
});

test("every item index row has grounded original ID and no invented identity for unresolved",()=>{
  const identity=new Set(["named","collision","unresolved"]);
  let last=0;
  for(const row of rows){
    assert.equal(row.length,9);
    const [id,name,category,level,grade,sourceCount,status,hasMaterials,reviewed]=row;
    assert.match(id,/^[1-9]\d*$/);
    assert.ok(Number(id)>last);
    last=Number(id);
    assert.ok(identity.has(status));
    assert.ok(Number.isInteger(sourceCount)&&sourceCount>=1);
    assert.ok(hasMaterials===0||hasMaterials===1);
    assert.ok(reviewed===0||reviewed===1);
    assert.ok(category===null||(typeof category==="string"&&category.length>0));
    assert.ok(level===null||typeof level==="string");
    assert.ok(grade===null||typeof grade==="string");
    if(status==="named"){
      assert.ok(typeof name==="string"&&name.trim()===name&&name.length>0);
    }else{
      assert.equal(name,null,"Unresolved ID published an unapproved English name");
      assert.equal(reviewed,0);
    }
  }
});

test("551 prior reviewed equipment names and IDs are preserved exactly",()=>{
  assert.equal(Object.keys(EQUIPMENT_ITEM_NAMES_EN).length,551);
  for(const [id,name]of Object.entries(EQUIPMENT_ITEM_NAMES_EN)){
    const row=byId.get(id);
    assert.ok(row,"Missing reviewed item "+id);
    assert.equal(row[1],name);
    assert.equal(row[6],"named");
    assert.equal(row[8],1);
  }
  assert.deepEqual(byId.get("1").slice(0,5),["1","Spirit Sword","Sword","1","NORMAL"]);
  assert.equal(byId.get("429")[1],"Immortal Bow");
  assert.equal(byId.get("437")[1],"Immortal Bow");
  assert.equal(byId.get("3890")[6],"collision");
  assert.equal(byId.get("3890")[1],null);
});

test("30 lazy-loaded detail buckets cover exactly named items and all their original source definitions",()=>{
  let named=0,records=0,materials=0,originalSourceIds=new Set();
  const allowedStates=new Set(["parsed-client-material","parsed-client-recipe","none","unsupported"]);
  for(let bucket=0;bucket<30;bucket++){
    const data=read("details/"+String(bucket).padStart(2,"0")+".json");
    assert.equal(data.schemaVersion,"1.0");
    assert.equal(data.snapshotId,1);
    assert.equal(data.bucket,bucket);
    for(const [id,record]of Object.entries(data.items)){
      named++;
      assert.equal(Math.floor(Number(id)/1000),bucket);
      assert.equal(byId.get(id)?.[6],"named");
      assert.equal(record.s.length,byId.get(id)[5]);
      assert.ok(record.v.length);
      const allIds=new Set();
      for(const def of record.s){
        const [sourceRowId,file,role,category,level,grade,work,unit,state,ingredients]=def;
        assert.equal(def.length,10);
        assert.ok(Number.isSafeInteger(sourceRowId)&&sourceRowId>0);
        assert.ok(!originalSourceIds.has(sourceRowId));
        originalSourceIds.add(sourceRowId);
        allIds.add(sourceRowId);
        records++;
        assert.match(file,/^[A-Za-z0-9_.-]+$/);
        assert.ok(role==="general"||role==="specific");
        assert.ok(typeof category==="string"&&category.length>0);
        assert.ok(level===null||typeof level==="string"||typeof level==="number");
        assert.ok(grade===null||typeof grade==="string"||typeof grade==="number");
        assert.ok(work===null||Number.isSafeInteger(work));
        assert.ok(unit===null||Number.isSafeInteger(unit));
        assert.ok(allowedStates.has(state));
        if(!state.startsWith("parsed-"))assert.equal(ingredients.length,0);
        for(const [itemId,quantity]of ingredients){
          assert.match(itemId,/^[1-9]\d*$/);
          assert.ok(Number.isSafeInteger(quantity)&&quantity>0);
          materials++;
        }
      }
      const groupIds=new Set(record.v.flat());
      assert.deepEqual([...groupIds].sort((a,b)=>a-b),[...allIds].sort((a,b)=>a-b));
    }
  }
  assert.equal(named,22702);
  assert.equal(records,25064);
  assert.equal(27281-records,2217,"Unresolved IDs must not have named detail records");
  assert.ok(materials>10000);
});

test("full database includes equipment-like categories beyond the 551 reviewed box items",()=>{
  const eligible=new Set([
    "Weapon","Defence","Sword","Spear","Axe","Bow","Gun","Cannon",
    "Staff","Guitar","Saw","Whip","Shield","Orb","Armor","Pants",
    "Boots","Helmet","Glove","Ring","Accessories","Neck","EARRING","BRACELET"
  ]);
  const possible=rows.filter(row=>row[6]==="named"&&eligible.has(row[2]));
  assert.equal(possible.length,2462);
  assert.equal(possible.filter(row=>row[8]===1).length,551);
  assert.equal(possible.filter(row=>row[8]===0).length,1911);
  // Raw categories are candidates, not proof the live server allows
  // their items to be equipped, crafted or upgraded.
});

test("original Spirit Sword material and file provenance survives the full source import",()=>{
  const sword=read("details/00.json").items["1"];
  assert.equal(sword.s.length,2);
  assert.deepEqual(sword.s.map(s=>s[1]),["ItemTypeWeapon.ndt","ItemTypeSword.ndt"]);
  assert.deepEqual(sword.s[1][9],[["5100",5],["6080",4]]);
  assert.equal(sword.s[1][4],"1");
  assert.equal(sword.s[1][6],450);
  assert.ok(sword.v.every(group=>group.every(id=>sword.s.some(r=>r[0]===id))));
  assert.equal(read("details/24.json").items["24120"]?.s?.[0]?.[3],"Scroll");
});

test("browser only renders untrusted item names as text (no HTML injection)",()=>{
  const template=readFileSync("src/components/FullClientItemDatabasePage.astro","utf8");
  assert.ok(template.includes("textContent"));
  assert.ok(!template.includes(".innerHTML"));
  assert.ok(template.includes("encodeURIComponent(id)"));
  assert.ok(template.includes("detailCache"));
  assert.ok(template.includes('id="db-equipment-only"'));
  assert.ok(template.includes("equipmentCandidateCategories"));
  assert.ok(template.includes("buildHistoricalClientProjection"));
  // All 7,560 source-derived stat candidates may display exact raw numeric
  // values; only equipment-like source categories get the historic model.
  assert.ok(template.includes("function addRawNumericSourceTable("));
  assert.ok(template.includes("addRawNumericSourceTable(details,rawStats)"));
  assert.ok(template.includes('if(equipmentCandidateCategories.has(row[2]??""))'));
  assert.ok(template.indexOf("addHistoricalGradeTable(details,rawStats)") <
    template.indexOf("addItemOverview(details,row,data)"));
  assert.ok(template.indexOf("addItemOverview(details,row,data)") <
    template.indexOf("addRawNumericSourceTable(details,rawStats)"));

  assert.ok(template.includes("Math.floor"));
  assert.ok(template.includes("id=\"db-category\""));
  assert.ok(template.includes("data-lang={lang}"));
  assert.ok(template.includes("full-client-db"));
});
