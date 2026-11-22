#!/usr/bin/env python3
"""Stage 20.3: diagnose item-ID collisions without publishing game records.

The aggregate JSON contains only bounded, predetermined classification labels
and counts. The optional PRIVATE CSV contains numeric item/record IDs and
diagnostic flags, never item names, source paths, recipes, material values,
SQL definitions, hashes or payloads. Neither output approves deduplication.
"""
from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
from itertools import groupby
import json
from pathlib import Path
import sqlite3
import sys

COLUMNS = (
    "record_id", "item_id", "category", "region", "source",
    "translation_state", "name", "original_name", "grade", "level",
    "unit", "work", "material", "recipe_state", "recipe",
)
CORE_FIELDS = (
    "category", "grade", "level", "unit", "work",
    "material", "recipe_state", "recipe",
)
EXTRA_FIELDS = ("name", "original_name", "source", "translation_state")
CLASSES = (
    "same-fields-base-and-ENG",
    "same-fields-other",
    "different-item-fields",
    "different-categories",
)
REGION_PATTERNS = ("base-only", "ENG-only", "base-and-ENG", "other-or-missing")
CLASS_PRIORITIES = {
    "same-fields-base-and-ENG": "A-localization-review",
    "same-fields-other": "B-source-review",
    "different-item-fields": "C-attribute-review",
    "different-categories": "D-identity-conflict",
}
PRIVATE_COLUMNS = (
    "snapshot_id", "item_id", "record_count", "record_ids",
    "classification", "region_pattern", "priority",
    "different_fields", "different_name", "different_original_name",
    "different_source", "different_translation_state",
)


def classify(regions: set[object], differences: set[str]) -> tuple[str, str]:
    if regions == {"base"}:
        region_type = "base-only"
    elif regions == {"ENG"}:
        region_type = "ENG-only"
    elif regions == {"base", "ENG"}:
        region_type = "base-and-ENG"
    else:
        region_type = "other-or-missing"

    if "category" in differences:
        conflict_type = "different-categories"
    elif any(field in differences for field in CORE_FIELDS):
        conflict_type = "different-item-fields"
    elif region_type == "base-and-ENG":
        conflict_type = "same-fields-base-and-ENG"
    else:
        conflict_type = "same-fields-other"
    return conflict_type, region_type


def is_changed(rows: list[dict], field: str) -> bool:
    return len({row[field] for row in rows}) > 1


def analyze(database: Path, snapshot_id: int) -> tuple[dict, list[dict]]:
    if snapshot_id < 1:
        raise ValueError("snapshot ID must be positive")
    db_path = database.expanduser().resolve(strict=True)
    if not db_path.is_file():
        raise ValueError("database argument is not a regular file")

    counts: Counter[str] = Counter()
    fields = {key: Counter() for key in CLASSES}
    extra = {key: Counter() for key in CLASSES}
    crosstab = {key: Counter() for key in CLASSES}
    priorities: Counter[str] = Counter()
    queue: list[dict] = []

    with sqlite3.connect(db_path.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        columns = {row[1] for row in db.execute("PRAGMA table_info('catalog_items')")}
        if not set(COLUMNS).union({"snapshot_id"}).issubset(columns):
            raise ValueError("catalog_items lacks required columns")
        if db.execute(
            "SELECT 1 FROM snapshots WHERE id = ? LIMIT 1", (snapshot_id,)
        ).fetchone() is None:
            raise ValueError("snapshot ID was not found")

        query = (
            "SELECT " + ", ".join(COLUMNS) +
            " FROM catalog_items WHERE snapshot_id = ? ORDER BY item_id, record_id"
        )
        all_rows = (
            dict(zip(COLUMNS, raw))
            for raw in db.execute(query, (snapshot_id,))
        )
        for item_id, grouped in groupby(all_rows, key=lambda row: row["item_id"]):
            rows = list(grouped)
            counts["sourceRows"] += len(rows)
            if type(item_id) is not int or item_id <= 0:
                counts["invalidItemIdRows"] += len(rows)
                continue
            counts["distinctValidIds"] += 1
            if len(rows) == 1:
                counts["singletonIds"] += 1
                continue

            counts["duplicateGroups"] += 1
            counts["duplicateRows"] += len(rows)
            differences = {field for field in CORE_FIELDS if is_changed(rows, field)}
            name_flags = {field: is_changed(rows, field) for field in EXTRA_FIELDS}
            conflict_type, region_type = classify(
                {row["region"] for row in rows}, differences
            )
            crosstab[conflict_type][region_type] += 1
            priority = CLASS_PRIORITIES[conflict_type]
            priorities[priority] += 1
            for field in differences:
                fields[conflict_type][field] += 1
            for field, different in name_flags.items():
                if different:
                    extra[conflict_type][field] += 1

            ids = [r["record_id"] for r in rows]
            # Only numeric source record IDs are eligible for the private queue.
            # The aggregate counts remain accurate even for malformed row IDs.
            safe_ids = (
                ";".join(str(value) for value in ids)
                if all(type(value) is int and value > 0 for value in ids)
                else ""
            )
            queue.append({
                "snapshot_id": snapshot_id,
                "item_id": item_id,
                "record_count": len(rows),
                "record_ids": safe_ids,
                "classification": conflict_type,
                "region_pattern": region_type,
                "priority": priority,
                "different_fields": ";".join(
                    field for field in CORE_FIELDS if field in differences
                ),
                "different_name": int(name_flags["name"]),
                "different_original_name": int(name_flags["original_name"]),
                "different_source": int(name_flags["source"]),
                "different_translation_state": int(name_flags["translation_state"]),
            })

    summary_keys = (
        "sourceRows", "invalidItemIdRows", "distinctValidIds",
        "singletonIds", "duplicateGroups", "duplicateRows",
    )
    report = {
        "reportVersion": "20.3",
        "snapshotId": snapshot_id,
        "generatedAtUtc": datetime.now(timezone.utc)
            .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "summary": {key: counts[key] for key in summary_keys},
        "collisionClassByRegionPattern": {
            key: {region: crosstab[key][region] for region in REGION_PATTERNS}
            for key in CLASSES
        },
        "fieldDifferencesByClass": {
            key: {field: fields[key][field] for field in CORE_FIELDS}
            for key in CLASSES
        },
        "labelAndSourceDifferencesByClass": {
            key: {field: extra[key][field] for field in EXTRA_FIELDS}
            for key in CLASSES
        },
        "privateQueueByPriority": {
            priority: priorities[priority]
            for priority in CLASS_PRIORITIES.values()
        },
        "limits": (
            "Equal selected fields do not establish identical game items; "
            "base/ENG are Miner partition labels, not proven server regions. "
            "No deduplication, name approval, or publication occurs."
        ),
        "privacy": (
            "Aggregate report contains fixed labels and counts only. "
            "Optional local CSV has numeric IDs and diagnostic flags, no "
            "item/source names, raw values, recipes, file paths or hashes."
        ),
    }
    # Sanity-check against Stage 20.2 invariants before writing any file.
    if sum(priorities.values()) != counts["duplicateGroups"]:
        raise ValueError("collision groups are not fully classified")
    if sum(sum(row.values()) for row in crosstab.values()) != counts["duplicateGroups"]:
        raise ValueError("class/region cross-tab does not balance")
    return report, queue


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("--snapshot", type=int, required=True)
    parser.add_argument("--output", type=Path, required=True,
                        help="Shareable aggregate JSON (review before sharing)")
    parser.add_argument("--private-queue", type=Path,
                        help="OPTIONAL local-only CSV with item and record IDs. Do not upload.")
    args = parser.parse_args(argv)
    try:
        paths = [args.database.resolve(), args.output.resolve()]
        if args.private_queue:
            paths.append(args.private_queue.resolve())
        if len(set(paths)) != len(paths):
            raise ValueError("input and output files must use distinct paths")

        report, queue = analyze(args.database, args.snapshot)
        args.output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        if args.private_queue:
            with args.private_queue.open("w", newline="", encoding="utf-8-sig") as out:
                writer = csv.DictWriter(out, fieldnames=PRIVATE_COLUMNS)
                writer.writeheader()
                writer.writerows(queue)
        print(f"[IC] Duplicate IDs classified: {report['summary']['duplicateGroups']}")
        print(f"[IC] Aggregate report: {args.output.name}")
        if args.private_queue:
            print(f"[IC] PRIVATE local queue: {args.private_queue.name} (do not share)")
        print("[IC] SQLite unchanged; no item records deduplicated or published.")
        return 0
    except (OSError, sqlite3.Error, ValueError, TypeError) as error:
        # Paths and query values may be sensitive; expose exception class only.
        print(f"[IC] ERROR: {type(error).__name__}. Check inputs and schema.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
