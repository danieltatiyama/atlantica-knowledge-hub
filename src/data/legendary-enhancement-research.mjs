/**
 * Gate for historical community examples on the Legendary research page.
 * This is deliberately separate from the 551 item-ID reviewed-name catalog:
 * these named weapons currently have NO independently matched public item IDs.
 *
 * Never invent an item ID, assert current-game eligibility, derive special
 * effects, or silently treat a documented +0 as an in-game observation.
 */
import { projectClassicStat } from "./equipment-enchant-projection.mjs";

const numeric = (value) => Number.isSafeInteger(value) && value >= 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const keys = (value, allowed, required = []) => object(value) &&
  Object.keys(value).every(key => allowed.includes(key)) &&
  required.every(key => Object.hasOwn(value, key));
const all = ["attackMin", "attackMax", "strength", "vitality",
  "dexterity", "intelligence", "defense"];
const fix = ["magicDefense"];
const safeText = (v) => typeof v === "string" && v.length >= 2 && v.length <= 400 &&
  v.trim() === v && !/[<>{}\r\n\\]/.test(v) && !/^(?:\/|[A-Za-z]:)/.test(v);
const safeSource = (value) => {
  if (!keys(value, ["label", "url"], ["label", "url"]) || !safeText(value.label)) return false;
  try {
    const url = new URL(value.url);
    return url.protocol === "https:" &&
      ["atlantica.fandom.com", "atlantica-online.wikidot.com"].includes(url.hostname) &&
      !url.username && !url.password && url.search === "" && url.hash === "";
  } catch { return false; }
};
const statBlock = (value) => keys(value, all) && Object.keys(value).length > 0 &&
  Object.entries(value).every(([field, amount]) => all.includes(field) && numeric(amount)) &&
  (Object.hasOwn(value, "attackMin") === Object.hasOwn(value, "attackMax")) &&
  (!Object.hasOwn(value, "attackMin") || value.attackMin <= value.attackMax);

export function validateLegendaryResearch(data) {
  const errors = [];
  if (!keys(data, ["schemaVersion", "dataset", "model", "sourceScope", "items"],
    ["schemaVersion", "dataset", "model", "sourceScope", "items"]) ||
    data.schemaVersion !== "1.0" || data.dataset !== "legendary-enhancement-research" ||
    data.model !== "wikidot-legendary-43-v1" ||
    data.sourceScope !== "historical-community-tables" ||
    !Array.isArray(data.items) || data.items.length === 0 || data.items.length > 30) {
    return {ok: false, errors:["Invalid Legendary research dataset"], items:[]};
  }
  const seen = new Set();
  for(const [idx, item] of data.items.entries()) {
    const label = "reference " + (idx + 1);
    if (!keys(item, ["nameEn","typeEn","minimumLevel","legendaryEligible",
      "base","legendaryObserved","unchangedAtLegendary","source","eligibilitySource",
      "noteEn","notePt"],
      ["nameEn","typeEn","minimumLevel","legendaryEligible","base","legendaryObserved",
       "source","noteEn","notePt"])) {
      errors.push(label+" has unrecognized fields");continue;
    }
    if (!safeText(item.nameEn) || !safeText(item.typeEn) ||
        seen.has(item.nameEn) || !numeric(item.minimumLevel) ||
        item.legendaryEligible !== true ||
        !safeText(item.noteEn) || !safeText(item.notePt) ||
        !safeSource(item.source) ||
        (item.eligibilitySource !== undefined && !safeSource(item.eligibilitySource))) {
      errors.push(label+" has invalid identity, eligibility or citation");
      continue;
    }
    seen.add(item.nameEn);
    if (!statBlock(item.base) ||
        !(item.legendaryObserved === null || statBlock(item.legendaryObserved)) ||
        (item.unchangedAtLegendary !== undefined &&
          (!keys(item.unchangedAtLegendary, fix) ||
           !Object.values(item.unchangedAtLegendary).every(numeric)))) {
      errors.push(label+" has invalid base/Legendary stat values");
      continue;
    }
    if (item.legendaryObserved !== null) {
      if (Object.keys(item.legendaryObserved).length !== Object.keys(item.base).length ||
          Object.entries(item.base).some(([field, base]) =>
            !Object.hasOwn(item.legendaryObserved, field) ||
            item.legendaryObserved[field] !== projectClassicStat(base, "L"))) {
        errors.push(label+" has a Legendary value inconsistent with sourced 4.3x table");
      }
    } else if (!item.eligibilitySource && !item.source) {
      errors.push(label+" estimates Legendary without an eligibility citation");
    }
  }
  return {ok:errors.length===0, errors, items:errors.length ? [] : data.items};
}

export function getLegendaryResearchRows(data) {
  const check = validateLegendaryResearch(data);
  if (!check.ok) throw new Error("Legendary research publication blocked: "+check.errors.join("; "));
  return check.items.map((item) => ({
    ...item,
    plusTen: Object.fromEntries(Object.entries(item.base).map(
      ([field, value])=>[field, projectClassicStat(value,10)])),
    legendary: item.legendaryObserved ?? Object.fromEntries(
      Object.entries(item.base).map(([field, value])=>[field, projectClassicStat(value,"L")])),
    legendaryBasis: item.legendaryObserved ? "historical-table" : "estimated",
  }));
}
