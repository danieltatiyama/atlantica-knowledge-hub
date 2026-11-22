/**
 * Community-derived empirical rule for the BASE numeric stats on classic gear.
 *
 * Values are predictions, NOT official game formulas or direct in-game
 * observations. Verified against multiple independent historic item tables
 * on atlantica-online.wikidot.com and the Spirit Sword table on Fandom.
 * Validated only for attack min/max, STR/VIT/DEX/INT and physical defense.
 * Does not apply to Magic Defense, evasion, durability, Atlas costs,
 * enchantment rates, skills, set effects or legendary grades.
 */
export const CLASSIC_ENCHANT_MULTIPLIER_TENTHS =
  Object.freeze([10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 40]);

const SCALABLE_FIELDS = Object.freeze([
  "attackMin", "attackMax", "strength", "vitality", "dexterity",
  "intelligence", "defense",
]);

export function projectClassicStat(baseValue, enchantLevel) {
  if (!Number.isSafeInteger(baseValue) || baseValue < 0 ||
      !Number.isInteger(enchantLevel) ||
      enchantLevel < 0 || enchantLevel > 10) {
    throw new RangeError("Cannot project an invalid stat or enchantment grade");
  }
  // Integer tenths avoid 1595 * 2.8 = 4465.999999999999 float underflow.
  const value = Math.floor(
    (baseValue * CLASSIC_ENCHANT_MULTIPLIER_TENTHS[enchantLevel]) / 10
  );
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("Projected value exceeds safe integer bounds");
  }
  return value;
}

/**
 * @param {Array<Record<string, number>>} observed
 * @param {"wikidot-classic-v1" | null} model
 * @returns {Array<Record<string, number|string>>} merged rows sorted 0..10
 */
export function getEnchantStatRows(observed, model = null) {
  if (!Array.isArray(observed)) throw new TypeError("Observed data must be an array");
  const result = new Map();
  for (const row of observed) {
    if (!Number.isInteger(row?.enchantLevel) ||
        row.enchantLevel < 0 || row.enchantLevel > 10 ||
        result.has(row.enchantLevel)) {
      throw new RangeError("Invalid observed enchantment rows");
    }
    result.set(row.enchantLevel, {...row, origin: "observed"});
  }
  const base = result.get(0);
  if (model === "wikidot-classic-v1" && base) {
    for (let grade = 1; grade <= 10; grade++) {
      if (result.has(grade)) continue;
      const computed = { enchantLevel: grade, origin: "estimated" };
      for (const field of SCALABLE_FIELDS) {
        if (Number.isSafeInteger(base[field]) && base[field] >= 0) {
          computed[field] = projectClassicStat(base[field], grade);
        }
      }
      if (Object.keys(computed).length > 2) result.set(grade, computed);
    }
  } else if (model !== null && model !== "wikidot-classic-v1") {
    throw new RangeError("Unrecognized enchantment prediction model");
  }
  return [...result.values()].sort((a, b) => a.enchantLevel - b.enchantLevel);
}
