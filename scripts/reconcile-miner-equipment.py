#!/usr/bin/env python3
"""Stage 20.5: reconcile public equipment names against private Miner records.

Creates a PRIVATE review manifest and aggregate report. An optional *separate*
explicit approval file can create a small, source-referenced v1.0 dataset of
already-public reviewed names and deliberately selected client metadata.
No item, source record, translation, level, or category is approved by default.
The raw SQLite is opened strictly read-only. No recipe, raw path, loot rate,
private source name, or material expression enters the published dataset.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
import ntpath
from pathlib import Path
import re
import sqlite3
import sys

TS_TSV = re.compile(r'^const ITEM_NAMES_TSV = ("(?:\\.|[^"\\])*");\s*$', re.MULTILINE)
ITEM_FILE = re.compile(r'^ItemType[A-Za-z0-9_]*\.ndt$', re.IGNORECASE)
COLUMNS = (
    "record_id", "item_id", "region", "category", "name", "original_name",
    "source", "grade", "level", "work", "material", "recipe_state", "recipe",
)
COMPARE_FIELDS = ("category", "grade", "level", "work", "material", "recipe_state", "recipe")
PUBLISH_FIELDS = {"clientCategory": "category", "clientLevelRaw": "level",
                  "clientGradeRaw": "grade"}
MANUAL_REVIEW_STATES = {
    "base-name-conflict", "base-original-name-conflict",
    "base-item-field-conflict", "no-exact-base-name",
    "no-source-records",
}
ALL_STATES = (
    "no-source-records", "no-exact-base-name", "base-name-conflict",
    "base-original-name-conflict", "base-item-field-conflict",
    "cross-category-overlap-candidate", "localization-overlap-candidate",
    "same-source-repeat-candidate", "single-base-source",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalized(value: object) -> str:
    return value.strip().casefold() if isinstance(value, str) else ""


def load_existing_equipment_names(ts_file: Path) -> dict[str, str]:
    """Parse only the literal TSV used by the real Stage 19 name dictionary.

    The parser intentionally fails closed if the frontend's source format
    changes, rather than silently interpreting arbitrary TypeScript code.
    """
    source = ts_file.read_text(encoding="utf-8")
    matches = TS_TSV.findall(source)
    if len(matches) != 1:
        raise ValueError("equipment name source format changed; update parser explicitly")
    raw = json.loads(matches[0])
    if not isinstance(raw, str) or not raw:
        raise ValueError("equipment name TSV must be nonempty")
    names: dict[str, str] = {}
    for line in raw.split("\n"):
        if "|" not in line:
            raise ValueError("invalid equipment name TSV row")
        id_raw, name = line.split("|", 1)
        if not re.fullmatch(r"[1-9][0-9]*", id_raw) or not name.strip() or id_raw in names:
            raise ValueError("duplicate/invalid equipment ID or missing public name")
        names[id_raw] = name
    return names


def read_miner_rows(database: Path, snapshot_id: int,
                    approved_ids: set[str]) -> dict[str, list[dict]]:
    if type(snapshot_id) is not int or snapshot_id < 1:
        raise ValueError("snapshot ID must be positive")
    db_file = database.expanduser().resolve(strict=True)
    if not db_file.is_file():
        raise ValueError("database is not a regular file")
    by_id: dict[str, list[dict]] = defaultdict(list)
    with sqlite3.connect(db_file.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        schema = {row[1] for row in db.execute("PRAGMA table_info('catalog_items')")}
        if not set(COLUMNS).union({"snapshot_id"}).issubset(schema):
            raise ValueError("catalog_items lacks required source fields")
        if not db.execute("SELECT 1 FROM snapshots WHERE id=? LIMIT 1", (snapshot_id,)).fetchone():
            raise ValueError("snapshot not found")
        query = (
            "SELECT " + ",".join(COLUMNS) +
            " FROM catalog_items WHERE snapshot_id=? ORDER BY item_id, record_id"
        )
        for values in db.execute(query, (snapshot_id,)):
            row = dict(zip(COLUMNS, values))
            if type(row["item_id"]) is int and str(row["item_id"]) in approved_ids:
                by_id[str(row["item_id"])].append(row)
    return by_id


def summarize_one(item_id: str, reviewed_name: str,
                  rows: list[dict]) -> tuple[dict, list[dict]]:
    base = [row for row in rows if row["region"] == "base"]
    eng = [row for row in rows if row["region"] == "ENG"]
    base_names = {normalized(row["name"]) for row in base}
    original_names = {normalized(row["original_name"]) for row in base}
    matching = [
        row for row in base if normalized(row["name"]) == normalized(reviewed_name)
        and ITEM_FILE.fullmatch(ntpath.basename(str(row["source"] or "")))
    ]
    core_diff = [
        field for field in COMPARE_FIELDS
        if len({row[field] for row in base}) > 1
    ]

    if not rows:
        state = "no-source-records"
    elif not matching:
        state = "no-exact-base-name"
    elif len(base_names) > 1:
        state = "base-name-conflict"
    elif len(original_names) > 1:
        state = "base-original-name-conflict"
    elif any(field != "category" for field in core_diff):
        state = "base-item-field-conflict"
    elif "category" in core_diff:
        state = "cross-category-overlap-candidate"
    elif eng:
        state = "localization-overlap-candidate"
    elif len(base) > 1:
        state = "same-source-repeat-candidate"
    else:
        state = "single-base-source"

    # This is a PRIVATE manifest, not a public static frontend dataset.
    # Do not serialize the non-English original_name, material, recipe or
    # full source path. Public reviewed name is from Stage 19.
    candidates = [
        {
            "recordId": r["record_id"],
            "sourceFileOnly": ntpath.basename(str(r["source"] or "")),
            "category": r["category"],
            "clientGradeRaw": r["grade"],
            "clientLevelRaw": r["level"],
        }
        for r in matching if type(r["record_id"]) is int and r["record_id"] > 0
    ]
    entry = {
        "itemId": item_id,
        "reviewedPublicNameEn": reviewed_name,
        "reviewState": state,
        "sourceRowCount": len(rows),
        "baseRowCount": len(base),
        "engRowCount": len(eng),
        "differentBaseFields": core_diff,
        "candidateSourceRows": candidates,
        "hasNonmatchingBaseNames": bool(base and (base_names - {normalized(reviewed_name)})),
        "hasConflictingBaseOriginalNames": len(original_names) > 1,
    }
    return entry, matching


def reconcile(database: Path, ts_file: Path, snapshot_id: int,
              exported_at: str | None = None) -> tuple[dict, dict, dict[str, dict]]:
    names = load_existing_equipment_names(ts_file)
    rows = read_miner_rows(database, snapshot_id, set(names))
    report_count: Counter[str] = Counter()
    candidates: dict[str, dict] = {}
    entries: list[dict] = []
    for item_id in sorted(names, key=int):
        entry, matching = summarize_one(item_id, names[item_id], rows.get(item_id, []))
        entries.append(entry)
        report_count[entry["reviewState"]] += 1
        report_count["sourceRowsConsidered"] += entry["sourceRowCount"]
        report_count["baseRowsConsidered"] += entry["baseRowCount"]
        report_count["engRowsConsidered"] += entry["engRowCount"]
        report_count["matchingBaseRows"] += len(matching)
        candidates[item_id] = {
            "entry": entry,
            "matching": {r["record_id"]: r for r in matching if type(r["record_id"]) is int and r["record_id"] > 0},
        }

    private = {
        "reviewVersion": "20.5-private",
        "snapshotId": snapshot_id,
        "generatedAtUtc": exported_at or utc_now(),
        "nameRegistry": "src/data/equipment-item-names-en.ts",
        "publicationStatus": "PRIVATE: candidates only; no automatic source approval",
        "entries": entries,
    }
    report = {
        "reportVersion": "20.5",
        "snapshotId": snapshot_id,
        "publicNamesInRegistry": len(names),
        "sourceRowsConsidered": report_count["sourceRowsConsidered"],
        "baseRowsConsidered": report_count["baseRowsConsidered"],
        "engRowsConsidered": report_count["engRowsConsidered"],
        "matchingBaseRows": report_count["matchingBaseRows"],
        "reviewStates": {state: report_count[state] for state in ALL_STATES},
        "eligibleForManualSourceReview": sum(
            report_count[state] for state in ALL_STATES if state not in MANUAL_REVIEW_STATES
        ),
        "publicationStatus": "BLOCKED: aggregate statistics only; no automatic approvals",
        "privacy": "Counts and fixed state labels only; no source rows, IDs, names or private paths",
    }
    if sum(report["reviewStates"].values()) != len(names):
        raise ValueError("review state reconciliation failed")
    return private, report, candidates


def approved_dataset(approvals: dict, candidates: dict[str, dict],
                     snapshot_id: int, miner_version: str,
                     exported_at: str | None = None) -> dict:
    if not isinstance(approvals, dict) or approvals.get("schemaVersion") != "20.5-approvals":
        raise ValueError("approval manifest schemaVersion must be 20.5-approvals")
    if type(approvals.get("snapshotId")) is not int or approvals["snapshotId"] != snapshot_id:
        raise ValueError("approvals must target the same snapshot")
    requested = approvals.get("approvals")
    if not isinstance(requested, list) or not requested:
        raise ValueError("explicit nonempty approvals required")
    if not isinstance(miner_version, str) or not miner_version.strip():
        raise ValueError("miner version must be nonempty")
    approved: list[dict] = []
    seen: set[str] = set()
    for row in requested:
        if not isinstance(row, dict) or set(row) != {"itemId", "recordId", "fields", "reviewNote"}:
            raise ValueError("each approval requires exact itemId, recordId, fields, reviewNote")
        item_id, record_id = row["itemId"], row["recordId"]
        if not isinstance(item_id, str) or item_id not in candidates or item_id in seen:
            raise ValueError("unknown or repeated item approval")
        if type(record_id) is not int or record_id < 1:
            raise ValueError("recordId must be a positive integer")
        entry = candidates[item_id]["entry"]
        if entry["reviewState"] in MANUAL_REVIEW_STATES:
            raise ValueError("cannot approve unresolved identity or field conflicts")
        chosen = candidates[item_id]["matching"].get(record_id)
        if chosen is None:
            raise ValueError("source record does not have an exact reviewed English base-name match")
        if not isinstance(row["fields"], list) or not row["fields"] or (
            len(set(map(str, row["fields"]))) != len(row["fields"])
        ) or any(field not in PUBLISH_FIELDS for field in row["fields"]):
            raise ValueError("fields must be distinct allowed client metadata keys")
        if not isinstance(row["reviewNote"], str) or len(row["reviewNote"].strip()) < 20:
            raise ValueError("manual review note must explain the source selection (20+ chars)")
        fields = {}
        for target_field in row["fields"]:
            source_value = chosen[PUBLISH_FIELDS[target_field]]
            if target_field == "clientCategory":
                if not isinstance(source_value, str) or not source_value.strip():
                    raise ValueError("source category is missing")
                fields[target_field] = source_value
            elif target_field == "clientLevelRaw":
                if not isinstance(source_value, str) or not re.fullmatch(r"\d{1,4}", source_value):
                    raise ValueError("source level is not an unambiguous numeric string")
                fields[target_field] = source_value
            else:
                if not isinstance(source_value, str) or not re.fullmatch(r"[A-Z_]{3,32}", source_value):
                    raise ValueError("source grade is not a recognized uppercase token")
                fields[target_field] = source_value
        approved.append({
            "id": item_id,
            "names": {"en": entry["reviewedPublicNameEn"]},
            "fields": fields,
            "evidence": {
                "status": "Extracted",
                "sources": [
                    "reviewed:src/data/equipment-item-names-en.ts",
                    f"catalog_items:snapshot={snapshot_id}:record={record_id}",
                ],
            },
        })
        seen.add(item_id)

    return {
        "schemaVersion": "1.0",
        "dataset": "items",
        "snapshot": {
            "id": f"miner-snapshot-{snapshot_id}-equipment-approved",
            "game": "Atlantica Online Global",
            "minerVersion": miner_version,
            "exportedAt": exported_at or utc_now(),
        },
        "records": sorted(approved, key=lambda rec: int(rec["id"])),
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("database", type=Path)
    p.add_argument("--snapshot", type=int, required=True)
    p.add_argument("--registry", type=Path,
                   default=Path("src/data/equipment-item-names-en.ts"))
    p.add_argument("--private-review", type=Path, required=True)
    p.add_argument("--report", type=Path, required=True)
    p.add_argument("--approvals", type=Path, help="Optional explicit human-approved JSON")
    p.add_argument("--approved-output", type=Path, help="Optional curated JSON (requires --approvals)")
    p.add_argument("--miner-version", default="unknown")
    args = p.parse_args(argv)
    try:
        if bool(args.approvals) != bool(args.approved_output):
            raise ValueError("--approvals and --approved-output must be supplied together")
        paths = [args.database.resolve(), args.registry.resolve(),
                 args.private_review.resolve(), args.report.resolve()]
        for optional in [args.approvals, args.approved_output]:
            if optional:
                paths.append(optional.resolve())
        if len(set(paths)) != len(paths):
            raise ValueError("all source and output paths must be different")
        private, report, candidates = reconcile(args.database, args.registry, args.snapshot)
        public = None
        if args.approvals:
            approval_content = json.loads(args.approvals.read_text(encoding="utf-8"))
            public = approved_dataset(approval_content, candidates, args.snapshot, args.miner_version)
        args.private_review.write_text(json.dumps(private, ensure_ascii=False, indent=2) + "\n",
                                       encoding="utf-8")
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                               encoding="utf-8")
        if public:
            args.approved_output.write_text(json.dumps(public, ensure_ascii=False, indent=2) + "\n",
                                            encoding="utf-8")
        print(f"[IC] Audited {report['publicNamesInRegistry']} previously reviewed equipment names")
        print(f"[IC] Possible matches requiring explicit review: {report['eligibleForManualSourceReview']}")
        print(f"[IC] Approved public candidates: {len(public['records']) if public else 0}")
        print("[IC] SQLite unchanged. No repository/public site files modified.")
        return 0
    except (OSError, ValueError, TypeError, sqlite3.Error, json.JSONDecodeError) as error:
        # Avoid emitting local paths or game-client data in exception messages.
        print(f"[IC] ERROR: {type(error).__name__}. Verify snapshot, registry and review files.",
              file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
