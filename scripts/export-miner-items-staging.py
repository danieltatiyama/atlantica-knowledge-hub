#!/usr/bin/env python3
"""Build a strictly non-public v1 staging contract from one Miner snapshot.

No raw client files, local paths, names, recipes, loot rates or row payloads
are read or exported. Duplicate item IDs are withheld rather than merged.
All emitted records are Unverified until reviewed, so the Wiki public gate
refuses the dataset.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sqlite3
import sys

LABEL_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_-]{0,63}$")
REQUIRED_ITEM_COLS = {"snapshot_id", "record_id", "item_id", "category", "region", "translation_state"}


def safe_label(value: object) -> str | None:
    return value if isinstance(value, str) and LABEL_RE.fullmatch(value) else None


def aggregate_value(value: object) -> str:
    if value is None or value == "":
        return "<missing>"
    return safe_label(value) or "<other>"


def summarize(counter: Counter[str], limit: int = 40) -> dict[str, int]:
    ranked = sorted(counter.items(), key=lambda entry: (-entry[1], entry[0]))
    trimmed = dict(ranked[:limit])
    if len(ranked) > limit:
        trimmed["<remaining categories>"] = sum(v for _, v in ranked[limit:])
    return trimmed


def export_snapshot(db_path: Path, snapshot: int, miner_version: str,
                    exported_at: str | None = None) -> tuple[dict, dict]:
    source = db_path.expanduser().resolve(strict=True)
    if snapshot < 1:
        raise ValueError("snapshot must be a positive integer")
    if not isinstance(miner_version, str) or not miner_version.strip():
        raise ValueError("miner version is required")

    # Use an offline copy if the producer is actively changing its SQLite DB.
    with sqlite3.connect(source.as_uri() + "?mode=ro", uri=True) as con:
        con.execute("PRAGMA query_only=ON")
        existing = {row[1] for row in con.execute("PRAGMA table_info('catalog_items')")}
        if not REQUIRED_ITEM_COLS.issubset(existing):
            raise ValueError("catalog_items is missing required Stage 20.1 columns")
        if not con.execute("SELECT 1 FROM snapshots WHERE id = ? LIMIT 1", (snapshot,)).fetchone():
            raise ValueError("requested snapshot ID is not present in snapshots")

        collisions = dict(con.execute(
            "SELECT item_id, COUNT(*) FROM catalog_items "
            "WHERE snapshot_id = ? AND item_id > 0 "
            "GROUP BY item_id HAVING COUNT(*) > 1", (snapshot,)
        ))
        collision_ids = set(collisions)
        records = []
        stats = Counter()
        categories: Counter[str] = Counter()
        regions: Counter[str] = Counter()
        translation_states: Counter[str] = Counter()

        # Crucially: no SELECT of name, original_name, source, material or recipe.
        for record_id, item_id, category, region, state in con.execute(
            "SELECT record_id, item_id, category, region, translation_state "
            "FROM catalog_items WHERE snapshot_id = ? ORDER BY item_id, record_id", (snapshot,)
        ):
            stats["sourceRows"] += 1
            categories[aggregate_value(category)] += 1
            regions[aggregate_value(region)] += 1
            translation_states[aggregate_value(state)] += 1

            if type(item_id) is not int or item_id <= 0:
                stats["missingOrInvalidItemIdRows"] += 1
                continue
            if item_id in collision_ids:
                stats["collisionRowsWithheld"] += 1
                continue
            if type(record_id) is not int or record_id <= 0:
                stats["invalidRecordIdRows"] += 1
                continue
            fields = {}
            if safe_label(category):
                fields["minerCategory"] = category
            if safe_label(region):
                fields["minerRegion"] = region
            records.append({
                "id": str(item_id),
                "names": {},  # Client labels are NOT proof of reviewed English translations.
                "fields": fields,
                "evidence": {
                    "status": "Unverified",  # Fails the public publishing gate by design.
                    "sources": [f"catalog_items:snapshot={snapshot}:record={record_id}"],
                },
            })

    records.sort(key=lambda rec: int(rec["id"]))
    timestamp = exported_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    # exportedAt is export timing, not a claim about the game data snapshot age.
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})", timestamp):
        raise ValueError("exported-at must be ISO 8601 with timezone")
    datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    payload = {
        "schemaVersion": "1.0",
        "dataset": "items",
        "snapshot": {
            "id": f"miner-snapshot-{snapshot}",
            "game": "Atlantica Online Global",
            "minerVersion": miner_version,
            "exportedAt": timestamp,
        },
        "records": records,
    }
    report = {
        "reportVersion": "20.1",
        "snapshotId": snapshot,
        "rowsSeen": stats["sourceRows"],
        "distinctDuplicateIdsWithheld": len(collision_ids),
        "collisionRowsWithheld": stats["collisionRowsWithheld"],
        "missingOrInvalidItemIdRows": stats["missingOrInvalidItemIdRows"],
        "invalidRecordIdRows": stats["invalidRecordIdRows"],
        "stagingRecordsCreated": len(records),
        "categoryLabels": summarize(categories),
        "regionLabels": summarize(regions),
        "translationStateLabels": summarize(translation_states),
        "publicationStatus": "BLOCKED: all records marked Unverified; names intentionally absent",
        "privacy": "Aggregate classifications only: no names, recipes, paths, client payloads or raw row data.",
    }
    return payload, report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("--snapshot", type=int, required=True)
    parser.add_argument("--miner-version", required=True)
    parser.add_argument("--output", type=Path, required=True, help="Private staging JSON; do not commit")
    parser.add_argument("--report", type=Path, required=True, help="Aggregate review JSON")
    args = parser.parse_args(argv)
    try:
        staging, report = export_snapshot(args.database, args.snapshot, args.miner_version)
        paths = [args.database.resolve(), args.output.resolve(), args.report.resolve()]
        if len(set(paths)) != len(paths):
            raise ValueError("database, output and report must be three different files")
        args.output.write_text(json.dumps(staging, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[IC] Snapshot {args.snapshot}: {report['stagingRecordsCreated']} unverified staging items")
        print(f"[IC] Duplicate item IDs withheld: {report['distinctDuplicateIdsWithheld']}")
        print("[IC] Publishing blocked until editorial and source review.")
        return 0
    except (OSError, sqlite3.Error, ValueError) as exc:
        print(f"[IC] ERROR: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
