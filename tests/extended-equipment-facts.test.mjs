import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {loadReviewedEquipmentNames} from "../scripts/read-reviewed-equipment-names.mjs";
import {
  validateExtendedEquipmentFacts, getReviewedExtendedFacts
} from "../src/data/extended-equipment-facts-gate.mjs";
import {projectClassicStat} from "../src/data/equipment-enchant-projection.mjs";

const file=fileURLToPath(new URL("../src/data/extended-equipment-facts.json",import.meta.url));
const original=JSON.parse(readFileSync(file,"utf8"));
const names=loadReviewedEquipmentNames();
const clone=x=>JSON.parse(JSON.stringify(x));

test("Dell'arte equipped Legendary tooltip is separate from bare historical 4.3x L",()=>{
  const checked=validateExtendedEquipmentFacts(original,names);
  assert.equal(checked.ok,true,checked.errors.join("; "));
  const item=getReviewedExtendedFacts(original,names)[0];
  assert.equal(item.itemId,null); // not invented from an unreviewed client source
  assert.equal(item.slug,"dell-artes-ambition");
  assert.equal(item.grade,"L");
  assert.equal(item.minimumLevel,180);
  assert.equal(item.typeEn,"Sword");
  assert.ok(item.eligibleClasses.includes("Harlequin")===false);
  assert.equal(item.eligibleClasses.length,21);
  assert.deepEqual(item.derived.bareL,{attackMin:20231,attackMax:25374});
  assert.equal(item.observedTooltip.attackMin,26300);
  assert.equal(item.observedTooltip.attackMax,32985);
  assert.equal(item.observedTooltip.intelligence,1715);
  assert.equal(item.observedTooltip.strength,1715);
  assert.equal(item.observedTooltip.vitality,1715);
  assert.equal(item.observedTooltip.magicSkillLevelBonus,48);
});

test("three identical Gold Eagle [VI] stones explain the full observed 26,300–32,985 range",()=>{
  const item=getReviewedExtendedFacts(original,names)[0];
  assert.equal(item.socketedModifiers.count,3);
  assert.equal(item.socketedModifiers.itemName,"Star Stone: Gold Eagle [VI]");
  assert.equal(item.socketedModifiers.perStone.attackEnhancePercent,10);
  assert.equal(projectClassicStat(item.baseHistorical.attackMin,"L"),20231);
  assert.equal(projectClassicStat(item.baseHistorical.attackMax,"L"),25374);
  assert.deepEqual(item.derived.perStoneAttack,{min:2023,max:2537});
  assert.deepEqual(item.derived.socketAttackTotal,{min:6069,max:7611});
  assert.equal(20231 + 3*2023, 26300);
  assert.equal(25374 + 3*2537, 32985);
  assert.equal(item.observedTooltip.critical,3*3);
  assert.equal(item.observedTooltip.multiHitRate,3*2);
  assert.equal(item.observedTooltip.actionPowerMod,3*1);
  assert.deepEqual(item.specialEffects.map(x=>x.valuePercent),[10,54]);
  assert.equal(item.craftingStatus,"historical-not-craftable");
  assert.equal(item.evidence.tooltip.kind,"user-supplied-ingame-screenshot");
});

test("tampered attack, socket bonus, critical/AP and omitted source are rejected",()=>{
  for(const mutate of [
    x=>{x.records[0].observedTooltip.attackMin=26301;},
    x=>{x.records[0].observedTooltip.attackMax=32984;},
    x=>{x.records[0].socketedModifiers.count=2;},
    x=>{x.records[0].socketedModifiers.perStone.displayedAttackBonusMin=2024;},
    x=>{x.records[0].observedTooltip.critical=10;},
    x=>{x.records[0].observedTooltip.multiHitRate=5;},
    x=>{x.records[0].observedTooltip.actionPowerMod=4;},
    x=>{x.records[0].baseHistorical.attackMin=4706;},
    x=>{x.records[0].evidence.baseline.url="https://evil.example/private";},
    x=>{x.records[0].evidence.tooltip.label="C:\\private\\screenshot.png";},
    x=>{x.records[0].socketedModifiers.rawRecipe="SECRET";},
    x=>{x.records[0].itemId="112473";},
    x=>{x.records[0].nameEn="Different Sword";},
    x=>{x.records.push(clone(x.records[0]));},
  ]) {
    const bad=clone(original);
    mutate(bad);
    const result=validateExtendedEquipmentFacts(bad,names);
    assert.equal(result.ok,false,JSON.stringify(bad.records[0]));
  }
});

test("source descriptions and expected numeric schema do not publish screenshot contents",()=>{
  const serialized=JSON.stringify(original);
  for(const forbidden of [
    "data:image/png","base64,","/mnt/data/","ItemTypeSword.ndt",
    "catalog_items:snapshot","192767","112473",
  ])assert.equal(serialized.includes(forbidden),false);
  const observed=original.records[0].observedTooltip;
  assert.deepEqual(Object.keys(observed).sort(),[
    "actionPowerMod","attackMax","attackMin","critical",
    "intelligence","magicSkillLevelBonus","multiHitRate",
    "strength","vitality",
  ]);
});
