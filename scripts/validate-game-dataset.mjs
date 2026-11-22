import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const EVIDENCE_STATUSES = new Set([
  "Verified", "Extracted", "Experimental", "Unverified", "Private",
]);
const PUBLIC_STATUSES = new Set(["Verified", "Extracted"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export function validateDataset(payload, { publicMode = false } = {}) {
  const errors = [];
  const errorsFor = (where, reason) => errors.push(`${where}: ${reason}`);

  if (!isObject(payload)) {
    return { ok: false, errors: ["root: expected a JSON object"], count: 0, statuses: {} };
  }

  if (payload.schemaVersion !== "1.0") {
    errorsFor("schemaVersion", 'expected "1.0"');
  }
  if (!isNonEmptyString(payload.dataset)) {
    errorsFor("dataset", "must be a nonempty string");
  } else if (!/^[a-z][a-z0-9-]*$/.test(payload.dataset)) {
    errorsFor("dataset", "use lowercase kebab-case");
  }

  if (!isObject(payload.snapshot)) {
    errorsFor("snapshot", "must be an object");
  } else {
    for (const field of ["id", "game", "minerVersion", "exportedAt"]) {
      if (!isNonEmptyString(payload.snapshot[field])) {
        errorsFor(`snapshot.${field}`, "must be a nonempty string");
      }
    }
    if (
      isNonEmptyString(payload.snapshot.exportedAt) &&
      (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(payload.snapshot.exportedAt) ||
      Number.isNaN(Date.parse(payload.snapshot.exportedAt)))
    ) {
      errorsFor("snapshot.exportedAt", "must be an ISO 8601 timestamp with timezone");
    }
  }

  if (!Array.isArray(payload.records)) {
    errorsFor("records", "must be an array");
    return { ok: false, errors, count: 0, statuses: {} };
  }

  const ids = new Set();
  const statuses = {};
  for (const [index, record] of payload.records.entries()) {
    const location = `records[${index}]`;
    if (!isObject(record)) {
      errorsFor(location, "must be an object");
      continue;
    }

    if (!isNonEmptyString(record.id) || !ID_PATTERN.test(record.id)) {
      errorsFor(`${location}.id`, "must be a safe, nonempty string (letters/numbers/._:-)");
    } else if (ids.has(record.id)) {
      errorsFor(`${location}.id`, `duplicate ID ${JSON.stringify(record.id)}`);
    } else {
      ids.add(record.id);
    }

    if (!isObject(record.names)) {
      errorsFor(`${location}.names`, "must be an object (may be empty when untranslated)");
    } else {
      for (const [locale, name] of Object.entries(record.names)) {
        if (!/^[a-z]{2}(?:-[a-z]{2})?$/.test(locale)) {
          errorsFor(`${location}.names`, `invalid locale ${JSON.stringify(locale)}`);
        }
        if (!isNonEmptyString(name)) {
          errorsFor(`${location}.names.${locale}`, "must be a nonempty string");
        }
      }
    }

    if (!isObject(record.fields)) {
      errorsFor(`${location}.fields`, "must be an object (not an array)");
    }
    if (!isObject(record.evidence)) {
      errorsFor(`${location}.evidence`, "must be an object");
      continue;
    }
    const status = record.evidence.status;
    if (!EVIDENCE_STATUSES.has(status)) {
      errorsFor(`${location}.evidence.status`, "must be Verified, Extracted, Experimental, Unverified or Private");
    } else {
      statuses[status] = (statuses[status] ?? 0) + 1;
      if (publicMode && !PUBLIC_STATUSES.has(status)) {
        errorsFor(`${location}.evidence.status`, `${status} is not eligible for public export`);
      }
    }
    if (!Array.isArray(record.evidence.sources) || record.evidence.sources.length === 0) {
      errorsFor(`${location}.evidence.sources`, "must contain at least one source reference");
    } else {
      for (const [sourceIndex, source] of record.evidence.sources.entries()) {
        if (!isNonEmptyString(source)) {
          errorsFor(`${location}.evidence.sources[${sourceIndex}]`, "must be a nonempty string");
        } else if (/^[A-Za-z]:\\|^\\\\|^\//.test(source)) {
          errorsFor(`${location}.evidence.sources[${sourceIndex}]`, "do not include absolute/private local paths");
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, count: payload.records.length, statuses };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const publicMode = args.includes("--public");
  const paths = args.filter((arg) => arg !== "--public");
  if (paths.length !== 1 || paths[0].startsWith("--")) {
    console.error("Usage: node scripts/validate-game-dataset.mjs <dataset.json> [--public]");
    process.exitCode = 2;
  } else {
    try {
      const payload = JSON.parse(readFileSync(resolve(paths[0]), "utf8"));
      const result = validateDataset(payload, { publicMode });
      console.log(`[IC] Dataset: ${payload.dataset ?? "(missing)"}`);
      console.log(`[IC] Records: ${result.count}`);
      console.log(`[IC] Evidence: ${JSON.stringify(result.statuses)}`);
      console.log(`[IC] Mode: ${publicMode ? "PUBLIC GATE" : "STAGING"}`);
      if (!result.ok) {
        for (const error of result.errors) console.error(`[IC] ERROR: ${error}`);
        process.exitCode = 1;
      } else {
        console.log("[IC] Dataset validation passed. No files written.");
      }
    } catch (error) {
      console.error(`[IC] ERROR: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
