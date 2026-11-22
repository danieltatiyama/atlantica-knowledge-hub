/**
 * Community-derived empirical rule for the BASE numeric stats on classic gear.
 *
 * Values are predictions, NOT official game formulas or direct in-game
 * observations. Verified against multiple independent historic item tables
 * on atlantica-online.wikidot.com and the Spirit Sword table on Fandom.
 * Validated only for attack min/max, STR/VIT/DEX/INT and physical defense.
 * Does not apply to Magic Defense, evasion, durability, Atlas costs,
 * enchantment rates, skills or set effects. A separately opted-in
 * historical Legendary (L / +11) multiplier is calibrated below.
 */
export const CLASSIC_ENCHANT_MULTIPLIER_TENTHS =
  Object.freeze([10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 40]);

// Empirical L/Legendary enhancement follows +10, but only explicitly
// eligible equipment may display a predicted L row.
// 4.3x vs +0, i.e. 7.5% above 4.0x +10 (before truncation).
export const LEGENDARY_ENCHANT_MULTIPLIER_TENTHS = 43;
export const LEGENDARY_PROJECTION_MODEL = "wikidot-legendary-43-v1";

const SCALABLE_FIELDS = Object.freeze([
  "attackMin", "attackMax", "strength", "vitality", "dexterity",
  "intelligence", "defense",
]);

export function projectClassicStat(baseValue, enchantLevel) {
  if (!Number.isSafeInteger(baseValue) || baseValue < 0 ||
      !(enchantLevel === "L" ||
        (Number.isInteger(enchantLevel) && enchantLevel >= 0 && enchantLevel <= 10))) {
    throw new RangeError("Cannot project an invalid stat or enchantment grade");
  }
  // Integer tenths avoid 1595 * 2.8 = 4465.999999999999 float underflow.
  // BigInt preserves floor/truncation even for very large safe integer inputs.
  const multiplier = enchantLevel === "L"
    ? LEGENDARY_ENCHANT_MULTIPLIER_TENTHS
    : CLASSIC_ENCHANT_MULTIPLIER_TENTHS[enchantLevel];
  const exact = BigInt(baseValue) * BigInt(multiplier) / 10n;
  if (exact > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError("Projected value exceeds safe integer bounds");
  }
  return Number(exact);
}

/**
 * @param {Array<Record<string, number>>} observed
 * @param {"wikidot-classic-v1" | null} model
 * @param {"wikidot-legendary-43-v1" | null} legendaryModel
 * @returns {Array<Record<string, number|string>>} merged rows sorted +0..+10, L
 */
export function getEnchantStatRows(observed, model = null, legendaryModel = null) {
  if (!Array.isArray(observed)) throw new TypeError("Observed data must be an array");
  const result = new Map();
  for (const row of observed) {
    if (!(row?.enchantLevel === "L" ||
          (Number.isInteger(row?.enchantLevel) &&
            row.enchantLevel >= 0 && row.enchantLevel <= 10)) ||
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
  if (legendaryModel !== null && legendaryModel !== LEGENDARY_PROJECTION_MODEL) {
    throw new RangeError("Unrecognized Legendary prediction model");
  }
  if (legendaryModel === LEGENDARY_PROJECTION_MODEL) {
    // L is NOT inferred solely from +10. Editorial eligibility and
    // sources must explicitly enable it. Model opt-in also requires +0.
    if (model !== "wikidot-classic-v1" || !base) {
      throw new RangeError("Legendary model requires a +0 baseline and classic model");
    }
    if (!result.has("L")) {
      const projected = { enchantLevel: "L", origin: "estimated" };
      for (const field of SCALABLE_FIELDS) {
        if (Number.isSafeInteger(base[field]) && base[field] >= 0) {
          projected[field] = projectClassicStat(base[field], "L");
        }
      }
      if (Object.keys(projected).length > 2) result.set("L", projected);
    }
  }
  return [...result.values()].sort((a, b) =>
    (a.enchantLevel === "L" ? 11 : a.enchantLevel) -
    (b.enchantLevel === "L" ? 11 : b.enchantLevel)
  );
}
