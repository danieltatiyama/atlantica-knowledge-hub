#!/usr/bin/env python3
"""Read-only SQLite schema profiler for the private Atlantica Data Miner DB.

Only SQLite object names and column metadata are exported. No table rows,
SQL definition bodies, local directory paths, sample data or secrets are read.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from pathlib import Path


def profile_database(filename: Path) -> dict:
    db_path = filename.expanduser().resolve(strict=True)
    if not db_path.is_file():
        raise ValueError("Database argument must be a regular file")

    # URI mode=ro forbids writes to the source database. Work from a consistent
    # offline/snapshot copy if the miner might be writing to it concurrently.
    with sqlite3.connect(db_path.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        objects = db.execute(
            "SELECT name, type FROM sqlite_master "
            "WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' "
            "ORDER BY type, name COLLATE NOCASE"
        ).fetchall()

        schemas = []
        for object_name, object_type in objects:
            # Quotes safely delimit arbitrary table/view names, including
            # names with a literal apostrophe. This PRAGMA returns metadata.
            escaped_name = object_name.replace("'", "''")
            cols = db.execute(f"PRAGMA table_xinfo('{escaped_name}')").fetchall()
            schemas.append({
                "name": object_name,
                "type": object_type,
                "columns": [
                    {"name": col[1], "type": col[2], "notNull": bool(col[3]),
                     "primaryKeyOrdinal": col[5], "hidden": col[6]}
                    for col in cols
                ],
            })

        return {
            "reportVersion": "20.0",
            "reportType": "sqlite-schema-metadata-only",
            "databaseFilenameOnly": db_path.name,
            "sqliteVersion": sqlite3.sqlite_version,
            "tableCount": sum(1 for row in schemas if row["type"] == "table"),
            "viewCount": sum(1 for row in schemas if row["type"] == "view"),
            "objects": schemas,
            "privacy": "Schema metadata only: no row values, absolute paths, or CREATE SQL bodies.",
        }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path, help="Miner SQLite file (preferably a stopped/offline copy)")
    parser.add_argument("--output", type=Path, help="Output JSON file; otherwise prints to stdout")
    args = parser.parse_args(argv)
    try:
        report = profile_database(args.database)
        text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
        if args.output:
            args.output.write_text(text, encoding="utf-8")
            print(f"[IC] Schema profile created: {args.output}")
            print(f"[IC] Objects: {len(report['objects'])} (schema metadata only)")
        else:
            sys.stdout.write(text)
        return 0
    except (OSError, sqlite3.Error, ValueError) as error:
        print(f"[IC] ERROR: {type(error).__name__}: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
