/**
 * Shared strict publication gate used by Astro build and CLI.
 *
 * The only allowed material is an already-reviewed Stage 19 English name
 * plus explicitly selected source metadata with exact provenance.
 * This deliberately rejects recipes, material expressions, loot rates,
 * private/local paths, unreviewed names, and unknown keys.
 *
 * Pure JavaScript: runs in Node and during Astro static generation.
 */
const ID = /^[1-9][0-9]*$/;
const CATEGORY = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const GRADE = /^[A-Z_]{3,32}$/;
const LEVEL = /^[0-9]{1,4}$/;
const SOURCE = /^catalog_items:snapshot=([1-9][0-9]*):record=([1-9][0-9]*)$/;
const SNAPSHOT = /^miner-snapshot-([1-9][0-9]*)-equipment-approved$/;
const REVIEWED_SOURCE = "reviewed:src/data/equipment-item-names-en.ts";
const FIELD_CHECKS = {
  clientCategory: (value) => typeof value === "string" && CATEGORY.test(value),
  clientGradeRaw: (value) => typeof value === "string" && GRADE.test(value),
  clientLevelRaw: (value) => typeof value === "string" && LEVEL.test(value),
};

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const keysAre = (value, allowed) => object(value) && Object.keys(value).every((key) => allowed.includes(key));
const exactly = (value, allowed) => keysAre(value, allowed) && Object.keys(value).length === allowed.length;

export function validateCuratedEquipment(payload, reviewedNames) {
  const errors = [];
  const fail = (message) => errors.push(message); // Fixed messages: do not log private field values.
  if (!exactly(payload, ["schemaVersion", "dataset", "snapshot", "records"])) {
    return { ok: false, errors: ["Unexpected or missing dataset root keys"], records: [] };
  }
  if (payload.schemaVersion !== "1.0" || payload.dataset !== "items") {
    fail("Expected v1.0 items dataset");
  }
  if (!exactly(payload.snapshot, ["id", "game", "minerVersion", "exportedAt"])) {
    fail("Unexpected snapshot keys");
  } else {
    if (payload.snapshot.game !== "Atlantica Online Global") fail("Unexpected target game");
    if (typeof payload.snapshot.minerVersion !== "string" || !payload.snapshot.minerVersion.trim())
      fail("Missing miner producer version");
    if (typeof payload.snapshot.exportedAt !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(payload.snapshot.exportedAt) ||
        !Number.isFinite(Date.parse(payload.snapshot.exportedAt))) fail("Invalid ISO snapshot timestamp");
  }
  if (!Array.isArray(payload.records)) {
    return { ok: false, errors: [...errors, "Records must be an array"], records: [] };
  }
  if (!object(reviewedNames)) {
    return { ok: false, errors: [...errors, "Reviewed name dictionary missing"], records: [] };
  }

  const sourceSnapshot = payload.records.length && object(payload.snapshot)
    ? SNAPSHOT.exec(payload.snapshot.id) : null;
  if (payload.records.length && !sourceSnapshot) fail("Nonempty data must identify approved Miner snapshot");
  if (!payload.records.length && payload.snapshot?.id !== "curated-pilot-empty") {
    fail("Empty manifest must use curated-pilot-empty placeholder");
  }
  const seen = new Set();
  for (const [index, record] of payload.records.entries()) {
    const label = "record " + (index + 1);
    if (!exactly(record, ["id", "names", "fields", "evidence"])) {
      fail(label + " has unexpected record keys");
      continue;
    }
    if (typeof record.id !== "string" || !ID.test(record.id) ||
        !Object.prototype.hasOwnProperty.call(reviewedNames, record.id)) {
      fail(label + " does not reference an existing reviewed equipment ID");
      continue;
    }
    if (seen.has(record.id)) fail(label + " has a repeated equipment ID");
    seen.add(record.id);
    if (!exactly(record.names, ["en"]) ||
        record.names.en !== reviewedNames[record.id]) {
      fail(label + " must use the exact reviewed English name");
    }
    if (!object(record.fields) || Object.keys(record.fields).length === 0 ||
        !keysAre(record.fields, Object.keys(FIELD_CHECKS))) {
      fail(label + " has no approved client fields or includes prohibited fields");
    } else {
      for (const [field, value] of Object.entries(record.fields)) {
        if (!FIELD_CHECKS[field](value)) fail(label + " has invalid " + field);
      }
    }
    if (!exactly(record.evidence, ["status", "sources"]) ||
        record.evidence.status !== "Extracted" ||
        !Array.isArray(record.evidence.sources) ||
        record.evidence.sources.length !== 2 ||
        record.evidence.sources[0] !== REVIEWED_SOURCE ||
        typeof record.evidence.sources[1] !== "string") {
      fail(label + " lacks the required Extracted provenance");
    } else {
      const match = SOURCE.exec(record.evidence.sources[1]);
      if (!match || !sourceSnapshot || match[1] !== sourceSnapshot[1]) {
        fail(label + " has invalid or mismatching numeric source reference");
      }
    }
  }
  return { ok: errors.length === 0, errors, records: errors.length ? [] : payload.records };
}

export function assertCuratedEquipment(payload, reviewedNames) {
  const result = validateCuratedEquipment(payload, reviewedNames);
  if (!result.ok) {
    throw new Error("Curated equipment metadata gate blocked build: " + result.errors.join("; "));
  }
  return result.records;
}
