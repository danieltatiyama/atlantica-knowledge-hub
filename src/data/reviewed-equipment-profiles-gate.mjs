/**
 * Evidence-first publishing gate for public, editor-reviewed in-game item
 * information. Separate from Miner-only raw metadata gate by design:
 * game tooltip screenshots and community source information are different
 * evidence types, and must never be silently equated.
 */
const object = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const exact = (value, keys) =>
  object(value) && Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));
const allowed = (value, keys) =>
  object(value) && Object.keys(value).every((key) => keys.includes(key));
const natural = (v, limit = 1000000000000) =>
  Number.isSafeInteger(v) && v >= 0 && v <= limit;
const positive = (v, limit = 1000000000000) => natural(v, limit) && v > 0;
const simple = (v, limit = 160) =>
  typeof v === "string" && v.length > 0 && v.length <= limit &&
  v.trim() === v && !/[<>{}\n\r\\]/.test(v) &&
  !/^(?:\/|[A-Za-z]:)/.test(v) && !v.includes("/mnt/data/");
const STAT_FIELDS = ["enchantLevel", "attackMin", "attackMax", "strength", "vitality",
  "dexterity", "intelligence", "defense", "magicDefense"];
const EVIDENCE_TYPES = ["ingame-screenshot", "community-reference", "not-provided"];
const REQUIRED_SECTIONS = ["overview", "stats", "crafting", "materials"];

export function validateReviewedProfiles(payload, nameRegistry) {
  const errors = [];
  const fail = (msg) => errors.push(msg); // fixed diagnostics, no raw value disclosure.
  if (!exact(payload, ["schemaVersion", "dataset", "records"]) ||
      payload.schemaVersion !== "1.0" ||
      payload.dataset !== "reviewed-equipment-profiles" ||
      !Array.isArray(payload.records) || !object(nameRegistry)) {
    return {ok: false, errors: ["Invalid reviewed item profile dataset contract"], records: []};
  }
  const used = new Set();
  for (const [i, item] of payload.records.entries()) {
    const label = "profile " + (i + 1);
    if (!exact(item, ["id", "nameEn", "overview", "stats", "crafting", "evidence"])) {
      fail(label + " has invalid keys");
      continue;
    }
    if (typeof item.id !== "string" || !/^[1-9][0-9]*$/.test(item.id) ||
        !Object.prototype.hasOwnProperty.call(nameRegistry, item.id) ||
        item.nameEn !== nameRegistry[item.id] || used.has(item.id)) {
      fail(label + " has an unknown, duplicated or mismatched reviewed item ID/name");
      continue;
    }
    used.add(item.id);
    if (item.overview !== null) {
      const overview = item.overview;
      if (!exact(overview, ["typeEn", "minimumLevel", "eligibleClasses"]) ||
          !simple(overview.typeEn, 48) || !natural(overview.minimumLevel, 9999) ||
          !Array.isArray(overview.eligibleClasses) ||
          overview.eligibleClasses.length > 128 ||
          !overview.eligibleClasses.every((x) => simple(x, 64))) {
        fail(label + " has invalid item overview");
      }
    }
    if (!Array.isArray(item.stats) || item.stats.length > 11) {
      fail(label + " has invalid enchantment stat rows");
    } else {
      const usedGrade = new Set();
      for (const stat of item.stats) {
        if (!allowed(stat, STAT_FIELDS) ||
            !natural(stat?.enchantLevel, 10) ||
            usedGrade.has(stat.enchantLevel) ||
            Object.keys(stat).length < 2 ||
            (("attackMin" in stat) !== ("attackMax" in stat))) {
          fail(label + " has invalid/duplicate enchantment row");
          continue;
        }
        usedGrade.add(stat.enchantLevel);
        for (const [key, value] of Object.entries(stat)) {
          if (key !== "enchantLevel" && !natural(value, 1000000000000)) {
            fail(label + " has an invalid numeric stat");
          }
        }
        if ("attackMin" in stat && stat.attackMin > stat.attackMax) {
          fail(label + " has an inverted attack range");
        }
      }
    }

    if (item.crafting !== null) {
      const c = item.crafting;
      if (!exact(c, ["productionPerBatch", "requiredWorkload", "requiredSkill", "materials"]) ||
          !positive(c.productionPerBatch, 1000000) ||
          !natural(c.requiredWorkload) ||
          !exact(c.requiredSkill, ["nameEn", "level"]) ||
          !simple(c.requiredSkill.nameEn, 64) || !positive(c.requiredSkill.level, 9999) ||
          !Array.isArray(c.materials) || c.materials.length > 100) {
        fail(label + " has invalid crafting information");
      } else {
        const seen = new Set();
        for (const material of c.materials) {
          if (!exact(material, ["nameEn", "quantity"]) ||
              !simple(material.nameEn, 160) ||
              !positive(material.quantity, 1000000000) ||
              seen.has(material.nameEn)) {
            fail(label + " has invalid/duplicated material");
          } else seen.add(material.nameEn);
        }
      }
    }

    const evidence = item.evidence;
    if (!exact(evidence, ["overview", "stats", "crafting", "materials", "references"]) ||
        !REQUIRED_SECTIONS.every((section) => EVIDENCE_TYPES.includes(evidence?.[section])) ||
        !Array.isArray(evidence?.references) ||
        evidence.references.length < 1 || evidence.references.length > 20) {
      fail(label + " requires per-section evidence and source references");
      continue;
    }
    const kinds = new Set();
    for (const ref of evidence.references) {
      if (!allowed(ref, ["kind", "label", "url"]) ||
          !["ingame-screenshot", "community-reference"].includes(ref?.kind) ||
          !simple(ref.label, 240)) {
        fail(label + " has an invalid source description");
        continue;
      }
      if (ref.kind === "ingame-screenshot") {
        if (Object.keys(ref).length !== 2) fail(label + " screenshot source should not embed an external URL or private path");
      } else {
        let validUrl = false;
        try {
          const uri = new URL(ref.url);
          validUrl = uri.protocol === "https:" && !uri.username && !uri.password &&
            ["atlantica.fandom.com", "atlantica-online.wikidot.com"].includes(uri.hostname);
        } catch { /* no externally usable URL */ }
        if (Object.keys(ref).length !== 3 || !validUrl) {
          fail(label + " has an unapproved community source URL");
        }
      }
      kinds.add(ref.kind);
    }
    for (const section of REQUIRED_SECTIONS) {
      if (evidence[section] !== "not-provided" && !kinds.has(evidence[section])) {
        fail(label + " has an undocumented evidence type");
      }
    }
    if (item.overview === null && evidence.overview !== "not-provided") {
      fail(label + " declares evidence for a missing overview");
    }
    if (item.overview !== null && evidence.overview === "not-provided") {
      fail(label + " has an overview without evidence");
    }
    if (item.stats.length > 0 && evidence.stats === "not-provided") {
      fail(label + " has enchantment stats without evidence");
    }
    if (item.stats.length === 0 && evidence.stats !== "not-provided") {
      fail(label + " declares evidence for absent enchantment stats");
    }
    if (item.crafting === null &&
        (evidence.crafting !== "not-provided" || evidence.materials !== "not-provided")) {
      fail(label + " has crafting evidence but no crafting block");
    }
    if (item.crafting !== null && evidence.crafting === "not-provided") {
      fail(label + " has crafting values without evidence");
    }
    if (item.crafting?.materials?.length > 0 && evidence.materials === "not-provided") {
      fail(label + " has materials without evidence");
    }
  }
  return {ok: errors.length === 0, errors, records: errors.length ? [] : payload.records};
}

export function assertReviewedProfiles(payload, names) {
  const check = validateReviewedProfiles(payload, names);
  if (!check.ok) throw new Error(
    "Reviewed item article gate blocked build: " + check.errors.join("; ")
  );
  return check.records;
}
