#!/usr/bin/env python3
"""Build a PRIVATE review index covering every valid Miner item ID.

One v1.0 staging record per numeric item ID, retaining each distinct source
record as a reference. Identity classifications are review hints only; no
item names or gameplay fields are exported, and public validation must fail.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
from itertools import groupby
import json
from pathlib import Path
import sqlite3
import sys

DB_COLUMNS = (
    "record_id", "item_id", "category", "region", "source", "translation_state",
    "name", "original_name", "grade", "level", "unit", "work", "material",
    "recipe_state", "recipe",
)
CORE_FIELDS = (
    "category", "grade", "level", "unit", "work", "material", "recipe_state", "recipe",
)
REQUIRED = set(DB_COLUMNS) | {"snapshot_id"}
STATES = (
    "singleton",
    "cross-category-name-conflict",
    "cross-category-overlap-candidate",
    "same-partition-name-conflict",
    "attribute-conflict",
    "localization-overlap-candidate",
    "exact-repeat-candidate",
    "ambiguous-duplicate",
)


def classify_records(rows: list[dict]) -> tuple[str, dict[str, bool]]:
    """Conservative, source-aware signals. Never approves a merge."""
    if not rows:
        raise ValueError("item group cannot be empty")
    if len(rows) == 1:
        return "singleton", {"hasMultipleCategories": False, "hasBaseAndEng": False,
                             "hasSamePartitionOriginalNameConflict": False,
                             "hasCoreFieldConflict": False}

    categories = {r["category"] for r in rows}
    regions = {r["region"] for r in rows}
    name_key = lambda x: x.strip().casefold() if isinstance(x, str) else x
    base_rows = [r for r in rows if r["region"] == "base"]
    localized_rows = [r for r in rows if r["region"] == "ENG"]
    # Broad source categories may repeat specialized items. Category overlap
    # remains a candidate ONLY if the base-layer original names agree.
    base_orig = {name_key(r["original_name"]) for r in base_rows}
    base_names = {name_key(r["name"]) for r in base_rows}
    has_stable_base_identity = (
        bool(base_rows) and len(base_orig) == 1 and len(base_names) == 1
        and all(isinstance(value, str) and bool(value.strip())
                for value in base_orig | base_names)
    )
    same_partition_original_name_conflict = False
    for region in regions:
        partition_rows = [r for r in rows if r["region"] == region]
        if len({name_key(r["original_name"]) for r in partition_rows}) > 1:
            same_partition_original_name_conflict = True
            break
    category_conflict = len(categories) > 1
    nonlocal_diff = any(len({r[f] for r in rows}) > 1 for f in CORE_FIELDS if f != "category")
    has_base_and_eng = bool(base_rows and localized_rows)
    semantic_keys = ("category", "name", "original_name", "grade", "level", "unit",
                     "work", "material", "recipe_state", "recipe")
    exact_same = len({tuple(r[f] for f in semantic_keys) for r in rows}) == 1
    if category_conflict and not has_stable_base_identity:
        state = "cross-category-name-conflict"
    elif category_conflict:
        state = "cross-category-overlap-candidate"
    elif same_partition_original_name_conflict:
        state = "same-partition-name-conflict"
    elif nonlocal_diff:
        state = "attribute-conflict"
    elif has_base_and_eng:
        state = "localization-overlap-candidate"
    elif exact_same:
        state = "exact-repeat-candidate"
    else:
        state = "ambiguous-duplicate"
    return state, {
        "hasMultipleCategories": category_conflict,
        "hasBaseAndEng": has_base_and_eng,
        "hasSamePartitionOriginalNameConflict": same_partition_original_name_conflict,
        "hasCoreFieldConflict": nonlocal_diff or category_conflict,
    }


def index_items(database: Path, snapshot_id: int, miner_version: str,
                exported_at: str | None = None) -> tuple[dict, dict]:
    if type(snapshot_id) is not int or snapshot_id < 1:
        raise ValueError("snapshot ID must be positive")
    if not isinstance(miner_version, str) or not miner_version.strip():
        raise ValueError("miner version must not be blank")
    path = database.expanduser().resolve(strict=True)
    if not path.is_file():
        raise ValueError("database must be a regular file")
    count: Counter[str] = Counter()
    signal_counts: Counter[str] = Counter()
    records: list[dict] = []
    with sqlite3.connect(path.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        columns = {x[1] for x in db.execute("PRAGMA table_info('catalog_items')")}
        if not REQUIRED.issubset(columns):
            raise ValueError("catalog_items has unrecognized schema")
        if not db.execute("SELECT 1 FROM snapshots WHERE id=? LIMIT 1", (snapshot_id,)).fetchone():
            raise ValueError("snapshot does not exist")
        query = (
            "SELECT " + ",".join(DB_COLUMNS) +
            " FROM catalog_items WHERE snapshot_id=? ORDER BY item_id, record_id"
        )
        iterator = (dict(zip(DB_COLUMNS, values)) for values in db.execute(query, (snapshot_id,)))
        for item_id, group in groupby(iterator, lambda r: r["item_id"]):
            group_rows = list(group)
            count["sourceRows"] += len(group_rows)
            if type(item_id) is not int or item_id < 1:
                count["invalidIdRows"] += len(group_rows)
                continue
            if any(type(r["record_id"]) is not int or r["record_id"] < 1 for r in group_rows):
                count["invalidRecordIdGroups"] += 1
                continue
            state, flags = classify_records(group_rows)
            count[state] += 1
            count["distinctValidIds"] += 1
            count["sourceRowsRepresented"] += len(group_rows)
            for flag, enabled in flags.items():
                if enabled:
                    signal_counts[flag] += 1
            # References ONLY: do not copy names, paths, categories, recipes,
            # source payloads, rates, or normalized gameplay fields.
            references = [
                {"recordId": r["record_id"],
                 "partition": r["region"] if r["region"] in ("base", "ENG") else "other"}
                for r in group_rows
            ]
            records.append({
                "id": str(item_id),
                "names": {},
                "fields": {
                    "identityReviewState": state,
                    "minerSourceRecordCount": len(group_rows),
                    "minerSourceRecords": references,
                    "identityReviewFlags": flags,
                },
                "evidence": {
                    "status": "Unverified",
                    "sources": [
                        f"catalog_items:snapshot={snapshot_id}:record={r['record_id']}"
                        for r in group_rows
                    ],
                },
            })

    if sum(count[state] for state in STATES) != count["distinctValidIds"]:
        raise ValueError("review classification did not balance")
    if count["sourceRowsRepresented"] + count["invalidIdRows"] > count["sourceRows"]:
        raise ValueError("reviewed row count exceeds source row count")
    timestamp = exported_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    try:
        parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            raise ValueError
    except ValueError:
        raise ValueError("exported-at must include an ISO-8601 timezone") from None
    staging = {
        "schemaVersion": "1.0", "dataset": "items",
        "snapshot": {"id": f"miner-snapshot-{snapshot_id}",
                     "game": "Atlantica Online Global", "minerVersion": miner_version,
                     "exportedAt": timestamp},
        "records": records,
    }
    report = {
        "reportVersion": "20.4",
        "snapshotId": snapshot_id,
        "sourceRows": count["sourceRows"],
        "sourceRowsRepresented": count["sourceRowsRepresented"],
        "invalidIdRows": count["invalidIdRows"],
        "invalidRecordIdGroups": count["invalidRecordIdGroups"],
        "distinctValidIdsIndexed": count["distinctValidIds"],
        "identityReviewStates": {key: count[key] for key in STATES},
        "crossCuttingSignals": {key: signal_counts[key] for key in (
            "hasMultipleCategories", "hasBaseAndEng",
            "hasSamePartitionOriginalNameConflict", "hasCoreFieldConflict")},
        "publicationStatus": "BLOCKED: no inferred identity approvals; all records Unverified",
        "privacy": "Aggregate counts only; source rows and names remain in private SQLite; index contains numeric record references and review flags only",
    }
    return staging, report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("--snapshot", type=int, required=True)
    parser.add_argument("--miner-version", default="unknown", help="Actual producer version, if known")
    parser.add_argument("--private-index", type=Path, required=True, help="Private staging dataset; do NOT commit/share")
    parser.add_argument("--report", type=Path, required=True, help="Aggregate-only JSON safe to review/share")
    args = parser.parse_args(argv)
    try:
        paths = [args.database.resolve(), args.private_index.resolve(), args.report.resolve()]
        if len(set(paths)) != 3:
            raise ValueError("source and outputs must have different paths")
        staging, report = index_items(args.database, args.snapshot, args.miner_version)
        args.private_index.write_text(json.dumps(staging, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[IC] Indexed {report['distinctValidIdsIndexed']} item IDs and {report['sourceRowsRepresented']} raw record references")
        print("[IC] All records Unverified; no names, attributes or recipes exported")
        return 0
    except (OSError, sqlite3.Error, TypeError, ValueError) as error:
        # Never expose user-local private paths from exception messages.
        print(f"[IC] ERROR: {type(error).__name__}. Check snapshot, schema and paths.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
