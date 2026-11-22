import test from "node:test";
import assert from "node:assert/strict";
import {
  CLASSIC_ENCHANT_MULTIPLIER_TENTHS,
  projectClassicStat,
  getEnchantStatRows,
} from "../src/data/equipment-enchant-projection.mjs";

// Numeric cross-checks from separately named community item pages:
// https://atlantica-online.wikidot.com/item:spirit-bow
// https://atlantica-online.wikidot.com/item:spirit-instrument
// https://atlantica-online.wikidot.com/item:destroyer-s-sword
// https://atlantica-online.wikidot.com/item:evil-sword
// https://atlantica-online.wikidot.com/item:pegasus-lance
// https://atlantica-online.wikidot.com/item:phoenix-s-light-armor
// https://atlantica-online.wikidot.com/item:dark-knight-s-shield
// https://atlantica-online.wikidot.com/item:excalibur
// Spirit Sword: https://atlantica.fandom.com/wiki/Spirit_Sword
// Facts calibrated as of 2026-11-22. Not a confirmed current game formula.

test("historic grade multipliers are fixed exact decimal tenths", () => {
  assert.deepEqual(CLASSIC_ENCHANT_MULTIPLIER_TENTHS,
    [10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 40]);
});

const cases = [
  {
    name: "Spirit Sword (sword)",
    base: {attackMin: 60, attackMax: 90, strength: 5, vitality: 5},
    checkpoints: {
      1: {attackMin:72,attackMax:108,strength:6,vitality:6},
      5: {attackMin:126,attackMax:189,strength:10,vitality:10},
      7: {attackMin:168,attackMax:252,strength:14,vitality:14},
      10: {attackMin:240,attackMax:360,strength:20,vitality:20},
    },
  },
  {
    name: "Spirit Bow (bow)",
    base: {attackMin:50,attackMax:100,dexterity:8},
    checkpoints: {
      1: {attackMin:60,attackMax:120,dexterity:9},
      5: {attackMin:105,attackMax:210,dexterity:16},
      7: {attackMin:140,attackMax:280,dexterity:22},
      10: {attackMin:200,attackMax:400,dexterity:32},
    },
  },
  {
    name: "Spirit Instrument (instrument)",
    base: {attackMin:40,attackMax:50,intelligence:16,vitality:6},
    checkpoints: {
      3: {attackMin:64,attackMax:80,intelligence:25,vitality:9},
      5: {attackMin:84,attackMax:105,intelligence:33,vitality:12},
      8: {attackMin:128,attackMax:160,intelligence:51,vitality:19},
      10: {attackMin:160,attackMax:200,intelligence:64,vitality:24},
    },
  },
  {
    name: "Destroyer's Sword (sword level 35)",
    base: {attackMin:130,attackMax:180,strength:11,vitality:11},
    checkpoints: {
      1: {attackMin:156,attackMax:216,strength:13,vitality:13},
      5: {attackMin:273,attackMax:378,strength:23,vitality:23},
      7: {attackMin:364,attackMax:504,strength:30,vitality:30},
      10: {attackMin:520,attackMax:720,strength:44,vitality:44},
    },
  },
  {
    name: "Evil Sword (sword level 130)",
    base: {attackMin:1595,attackMax:2000,strength:133,vitality:133},
    checkpoints: {
      1: {attackMin:1914,attackMax:2400,strength:159,vitality:159},
      5: {attackMin:3349,attackMax:4200,strength:279,vitality:279},
      7: {attackMin:4466,attackMax:5600,strength:372,vitality:372},
      10: {attackMin:6380,attackMax:8000,strength:532,vitality:532},
    },
  },
  {
    name: "Pegasus Lance (spear level 140)",
    base: {attackMin:2512,attackMax:3301,strength:345,vitality:104},
    checkpoints: {
      3: {attackMin:4019,attackMax:5281,strength:552,vitality:166},
      5: {attackMin:5275,attackMax:6932,strength:724,vitality:218},
      10: {attackMin:10048,attackMax:13204,strength:1380,vitality:416},
    },
  },
  {
    name: "Phoenix's Light Armor (armor level 113)",
    base: {defense:4896,dexterity:150,vitality:139},
    checkpoints: {
      5: {defense:10281,dexterity:315,vitality:291},
      7: {defense:13708,dexterity:420,vitality:389},
      9: {defense:17625,dexterity:540,vitality:500},
      10: {defense:19584,dexterity:600,vitality:556},
    },
  },
  {
    name: "Dark Knight's Shield (shield level 50)",
    base: {defense:860,vitality:16},
    checkpoints: {
      5: {defense:1806,vitality:33},
      7: {defense:2408,vitality:44},
      10: {defense:3440,vitality:64},
    },
  },
  {
    name: "Excalibur (special weapon +0..+10 only; NOT legendary)",
    base: {attackMin:3016,attackMax:3782,strength:250,vitality:250},
    checkpoints: {
      5: {attackMin:6333,attackMax:7942,strength:525,vitality:525},
      7: {attackMin:8444,attackMax:10589,strength:700,vitality:700},
      10: {attackMin:12064,attackMax:15128,strength:1000,vitality:1000},
    },
  },
];
test("historical community tables agree with floor(base * grade multiplier)", () => {
  let checked = 0;
  for (const sample of cases) {
    for (const [grade, values] of Object.entries(sample.checkpoints)) {
      for (const [field, expected] of Object.entries(values)) {
        assert.equal(projectClassicStat(sample.base[field], Number(grade)),
          expected, sample.name + " +" + grade + " " + field);
        checked++;
      }
    }
  }
  assert.ok(checked >= 100); // Broad weapon, armor, shield and instrument coverage.
});

test("Spirit Sword projected table retains observed +0 and labels other grades estimated", () => {
  const rows = getEnchantStatRows([
    {enchantLevel:0,attackMin:60,attackMax:90,strength:5,vitality:5},
  ], "wikidot-classic-v1");
  assert.equal(rows.length, 11);
  assert.equal(rows[0].origin, "observed");
  assert.equal(rows[1].origin, "estimated");
  assert.deepEqual(rows[5], {
    enchantLevel:5, origin:"estimated", attackMin:126,attackMax:189,
    strength:10,vitality:10,
  });
  assert.deepEqual(rows[10], {
    enchantLevel:10,origin:"estimated",attackMin:240,attackMax:360,
    strength:20,vitality:20,
  });
});

test("new in-game observations override predictions for that exact grade", () => {
  const observed = [
    {enchantLevel:0,attackMin:60,attackMax:90,strength:5,vitality:5},
    {enchantLevel:5,attackMin:130,attackMax:195,strength:11,vitality:11},
  ];
  const rows = getEnchantStatRows(observed,"wikidot-classic-v1");
  assert.equal(rows[5].origin,"observed");
  assert.equal(rows[5].attackMin,130);
  assert.equal(rows[4].origin,"estimated");
  assert.equal(rows[6].origin,"estimated");
});

test("does not extrapolate magic defense, fixed evasion, passive effects or Atlas costs", () => {
  const projected = getEnchantStatRows([
    {enchantLevel:0,defense:860,vitality:16,magicDefense:45},
  ], "wikidot-classic-v1");
  assert.equal(projected[0].magicDefense,45);
  assert.equal(projected[5].magicDefense,undefined);
  assert.equal(projected[5].defense,1806);
});

test("opt-in is required; unknown model, illegal grade, negative input are blocked", () => {
  const base=[{enchantLevel:0,attackMin:60,attackMax:90}];
  assert.equal(getEnchantStatRows(base,null).length,1);
  assert.throws(()=>getEnchantStatRows(base,"unverified-v2"),RangeError);
  assert.equal(getEnchantStatRows([{enchantLevel:5,strength:5}],"wikidot-classic-v1").length,1);
  assert.throws(()=>projectClassicStat(10,-1),RangeError);
  assert.throws(()=>projectClassicStat(10,11),RangeError);
  assert.throws(()=>projectClassicStat(-10,5),RangeError);
  assert.throws(()=>getEnchantStatRows([...base,...base],"wikidot-classic-v1"),RangeError);
});
