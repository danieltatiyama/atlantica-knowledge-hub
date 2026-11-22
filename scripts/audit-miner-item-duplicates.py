#!/usr/bin/env python3
"""Analyze Miner item-ID collisions without exporting row data or resolving IDs.

Runs against one SQLite snapshot in read-only mode. Classifications are
diagnostic only: even identical-looking rows are NOT merged or published.
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

FIELDS = (
    "record_id", "item_id", "category", "region", "source",
    "translation_state", "name", "original_name", "grade", "level",
    "unit", "work", "material", "recipe_state", "recipe",
)
CORE_FIELDS = (
    "category", "grade", "level", "unit", "work",
    "material", "recipe_state", "recipe",
)
EXPECTED = set(FIELDS) | {"snapshot_id"}


def region_pattern(regions: set[str]) -> str:
    """Expose bounded region buckets, never arbitrary source text."""
    if regions == {"base"}:
        return "base-only"
    if regions == {"ENG"}:
        return "ENG-only"
    if regions == {"base", "ENG"}:
        return "base-and-ENG"
    return "other-or-missing"


def collision_class(rows: list[dict]) -> str:
    categories = {row["category"] for row in rows}
    if len(categories) > 1:
        return "different-categories"
    signatures = {tuple(row[key] for key in CORE_FIELDS) for row in rows}
    if len(signatures) > 1:
        return "different-item-fields"
    regions = {row["region"] for row in rows}
    if regions == {"base", "ENG"}:
        return "same-fields-base-and-ENG"
    return "same-fields-other"


def group_size_band(size: int) -> str:
    if size == 2:
        return "2"
    if size == 3:
        return "3"
    if size == 4:
        return "4"
    if size <= 9:
        return "5-9"
    if size <= 19:
        return "10-19"
    return "20+"


def analyze_snapshot(database: Path, snapshot_id: int) -> dict:
    source = database.expanduser().resolve(strict=True)
    if not source.is_file():
        raise ValueError("database must be a regular file")
    if snapshot_id <= 0:
        raise ValueError("snapshot ID must be positive")

    counter: Counter[str] = Counter()
    classes: Counter[str] = Counter()
    regions: Counter[str] = Counter()
    sizes: Counter[str] = Counter()

    with sqlite3.connect(source.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        columns = {col[1] for col in db.execute("PRAGMA table_info('catalog_items')")}
        if not EXPECTED.issubset(columns):
            raise ValueError("missing expected catalog_items schema columns")
        if not db.execute("SELECT 1 FROM snapshots WHERE id = ? LIMIT 1", (snapshot_id,)).fetchone():
            raise ValueError("snapshot ID is absent")

        # Names, provenance and recipe values are compared only in memory.
        # The JSON report includes NONE of their values, hashes, IDs or samples.
        sql = ("SELECT " + ", ".join(FIELDS) +
               " FROM catalog_items WHERE snapshot_id = ? "
               "ORDER BY item_id, record_id")
        rows = db.execute(sql, (snapshot_id,))
        iterator = (
            dict(zip(FIELDS, raw))
            for raw in rows
        )

        for item_id, grouped in groupby(iterator, key=lambda row: row["item_id"]):
            records = list(grouped)
            counter["sourceRows"] += len(records)
            if type(item_id) is not int or item_id <= 0:
                counter["invalidIdRows"] += len(records)
                continue
            counter["distinctValidIds"] += 1
            if len(records) == 1:
                counter["singletonIds"] += 1
                continue

            counter["duplicateIdGroups"] += 1
            counter["duplicateRows"] += len(records)
            kind = collision_class(records)
            classes[kind] += 1
            sizes[group_size_band(len(records))] += 1
            region_set = {row["region"] for row in records}
            regions[region_pattern(region_set)] += 1

            if len({row["name"] for row in records}) > 1:
                counter["groupsWithDifferentNames"] += 1
            if len({row["original_name"] for row in records}) > 1:
                counter["groupsWithDifferentOriginalNames"] += 1
            if len({row["source"] for row in records}) > 1:
                counter["groupsWithMultipleSources"] += 1
            if len({row["translation_state"] for row in records}) > 1:
                counter["groupsWithMultipleTranslationStates"] += 1

    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    # Include all bucket keys for stable diffs and deterministic consumer code.
    class_keys = (
        "same-fields-base-and-ENG", "same-fields-other",
        "different-item-fields", "different-categories",
    )
    region_keys = ("base-only", "ENG-only", "base-and-ENG", "other-or-missing")
    size_keys = ("2", "3", "4", "5-9", "10-19", "20+")
    return {
        "reportVersion": "20.2",
        "snapshotId": snapshot_id,
        "generatedAtUtc": timestamp,
        "summary": {
            key: counter[key] for key in (
                "sourceRows", "invalidIdRows", "distinctValidIds",
                "singletonIds", "duplicateIdGroups", "duplicateRows",
                "groupsWithDifferentNames", "groupsWithDifferentOriginalNames",
                "groupsWithMultipleSources", "groupsWithMultipleTranslationStates",
            )
        },
        "collisionClasses": {key: classes[key] for key in class_keys},
        "duplicateRegionPatterns": {key: regions[key] for key in region_keys},
        "duplicateGroupSizes": {key: sizes[key] for key in size_keys},
        "interpretation": {
            "same-fields-base-and-ENG": (
                "Rows agree on selected non-localized fields but differ in region "
                "presence; this is a candidate for source review, not an approved merge."
            ),
            "same-fields-other": (
                "Rows agree on selected non-localized fields; differences may still "
                "exist in names, sources or other unmodeled data."
            ),
            "different-item-fields": (
                "At least one selected non-localized field differs within the ID."
            ),
            "different-categories": (
                "The same item ID occurs in multiple miner categories."
            ),
        },
        "publicationStatus": "BLOCKED: diagnostics only; no IDs automatically deduplicated",
        "privacy": (
            "Aggregate counts only; no item IDs, names, paths, source values, "
            "row data, recipes, or hashes exported."
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("--snapshot", type=int, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        if args.database.resolve() == args.output.resolve():
            raise ValueError("report path cannot overwrite the source database")
        report = analyze_snapshot(args.database, args.snapshot)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[IC] Rows: {report['summary']['sourceRows']}")
        print(f"[IC] Distinct duplicate IDs: {report['summary']['duplicateIdGroups']}")
        print(f"[IC] Aggregate review report: {args.output.name}")
        print("[IC] No source data modified. No item records exported.")
        return 0
    except (sqlite3.Error, OSError, ValueError, TypeError) as exc:
        # Do not echo exception messages; SQLite may embed a source path.
        print(f"[IC] ERROR: {type(exc).__name__}. Check database, snapshot and output arguments.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
