#!/usr/bin/env python3
"""Stage 20.33: protect all 551 previously reviewed items from stats drift.

Uses only the committed original 551-identity source data and the optional
new source-only raw-stats candidate, both from the same Miner snapshot.
Does not attempt to independently validate current game-server behavior.
"""
from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_full_client_stats_20_32",
    Path(__file__).with_name("validate-full-client-stats.py"),
)
assert SPEC is not None and SPEC.loader is not None
audit = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(audit)


def verify(candidate: Path, baseline: Path | None = None) -> dict:
    if baseline is None:
        baseline = ROOT / "src/data/client-item-attributes.json"
    previous = audit.read_json(baseline)
    audit.require(
        isinstance(previous, dict)
        and previous.get("schemaVersion") == "1.0"
        and previous.get("snapshotId") == 1
        and previous.get("dataset") == "client-item-attributes"
        and isinstance(previous.get("records"), list)
        and len(previous["records"]) == 551,
        "Reviewed equipment raw stat baseline is incomplete",
    )
    manifest = audit.read_json(candidate / "manifest.json")
    audit.require(
        manifest.get("snapshotId") == 1
        and manifest.get("dataset") == "all-client-item-raw-stats",
        "Candidate and reviewed baseline snapshots differ",
    )
    cache = {}
    seen = set()
    previous_rows = 0
    allowed = set(audit.exporter.ALLOWED) - {"MoveSpeed"}
    for item in previous["records"]:
        id_ = item.get("id")
        audit.require(
            isinstance(id_, str) and audit.exporter.ID.fullmatch(id_)
            and id_ not in seen, "Duplicate or invalid reviewed equipment identity",
        )
        seen.add(id_)
        bucket = int(id_) // 1000
        name = f"{bucket:02d}.json"
        audit.require(name in manifest["files"],
                      "Reviewed equipment lacks a source stats bucket: " + id_)
        if name not in cache:
            raw = audit.read_json(candidate / name)
            audit.require(
                raw.get("schemaVersion") == "1.0"
                and raw.get("snapshotId") == 1
                and raw.get("bucket") == bucket
                and isinstance(raw.get("items"), dict),
                "Invalid reviewed source stats bucket",
            )
            cache[name] = raw["items"]
        candidate_rows = cache[name].get(id_)
        audit.require(
            isinstance(candidate_rows, list)
            and isinstance(item.get("sourceRows"), list),
            "Reviewed equipment source rows are missing: " + id_,
        )
        raw_by_row = {}
        for row_id, fields in candidate_rows:
            audit.require(type(row_id) is int and row_id not in raw_by_row,
                          "Duplicate reviewed row ID: " + id_)
            raw_by_row[row_id] = fields
        audit.require(
            len(raw_by_row) == len(item["sourceRows"]),
            "Reviewed equipment source row count differs: " + id_,
        )
        for previous_row in item["sourceRows"]:
            row_id = previous_row["sourceRowNumber"]
            expected = {
                k: v for k, v in previous_row["fieldsRaw"].items()
                if k in allowed
            }
            actual = raw_by_row.get(row_id)
            audit.require(
                isinstance(actual, dict),
                "Reviewed equipment original source row missing: " + id_,
            )
            comparable = {
                k: v for k, v in actual.items() if k != "MoveSpeed"
            }
            audit.require(
                expected == comparable,
                "Reviewed equipment raw source fields differ for ID "
                + id_ + " original row #" + str(row_id),
            )
            previous_rows += 1
    audit.require(previous_rows == 1031,
                  "Original 1,031 reviewed equipment rows were not preserved")
    return {"reviewedEquipmentIds": len(seen),
            "originalSourceRows": previous_rows,
            "status": "EXACT_MATCH_EXCLUDING_SEPARATELY_ATTESTED_MOVESPEED"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path,
                        default=ROOT / "public/data/client-items/stats")
    parser.add_argument("--allow-absent", action="store_true")
    args = parser.parse_args(argv)
    try:
        if not args.candidate.exists() and args.allow_absent:
            print("[IC] No optional public stats; reviewed 551 remain unchanged.")
            return 0
        result = verify(args.candidate)
        print("[IC] All", result["reviewedEquipmentIds"], "reviewed IDs and",
              result["originalSourceRows"], "old source rows preserved exactly.")
        print("[IC] MoveSpeed is managed by the independently reviewed source-row patch.")
        return 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        print("[IC] ERROR: existing reviewed equipment comparison FAILED:",
              str(error)[:240], file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
