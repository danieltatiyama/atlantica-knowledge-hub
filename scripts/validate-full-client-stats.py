#!/usr/bin/env python3
"""Stage 20.32: fail-closed audit of the all-ID client numeric stats candidate.

Reads candidate shards, the source-only item index and the aggregate report.
Never reads or changes the original game/Miner SQLite, never copies a candidate
into the deployed site, and never rewrites source values.

Local candidate:
  py scripts/validate-full-client-stats.py --candidate Miner_AllStats_PublicCandidate_20_31

CI gate, while publication is still optional:
  py scripts/validate-full-client-stats.py --candidate public/data/client-items/stats --allow-absent
"""
from __future__ import annotations

import argparse
from collections import Counter
import importlib.util
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
EXPORTER = Path(__file__).with_name("export-full-client-stats.py")
spec = importlib.util.spec_from_file_location("export_full_client_stats", EXPORTER)
assert spec and spec.loader
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)

NOTICE = (
    "Raw source fields, not server measurements. +1..+10 scaling requires "
    "separate historic model; fixed EV/MoveSpeed/MagicDef never multiply."
)
MANIFEST_KEYS = {
    "schemaVersion", "dataset", "snapshotId", "itemIds", "sourceRows",
    "dataSource", "notice", "files",
}
REPORT_KEYS = {
    "reportVersion", "snapshotId", "rowsInspected", "invalidJsonRows",
    "invalidItemIds", "unresolvedIdentitySourceRows",
    "namedIdsWithSourceRows", "sourceNameCollisionIdsHeld",
    "namedIdsWithNoNumericFields", "publishedCandidateIds",
    "publishedCandidateSourceRows", "numericFieldCoverage", "privacy",
}
ALLOWED = set(exporter.ALLOWED)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def no_duplicate_keys(pairs):
    obj = {}
    for key, value in pairs:
        require(key not in obj, "Duplicate JSON key")
        obj[key] = value
    return obj


def read_json(path: Path):
    require(path.is_file() and not path.is_symlink(),
            "Required regular JSON file missing: " + path.name)
    require(path.stat().st_size <= 20_000_000, "Oversized JSON input: " + path.name)
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream, object_pairs_hook=no_duplicate_keys)


def validate(candidate: Path, report_path: Path, index_dir: Path) -> dict:
    # Reuse the same exact-ID/EnglishName and source snapshot gate as the exporter.
    source_manifest, source_names = exporter.load_index(index_dir)
    require(source_manifest["snapshotId"] == 1, "Unexpected source snapshot")
    report = read_json(report_path)
    require(isinstance(report, dict) and set(report) == REPORT_KEYS,
            "Unexpected aggregate report schema")
    require(report["reportVersion"] == "20.31-aggregate" and
            report["snapshotId"] == 1 and
            report["privacy"] == "Aggregate only: no source names, original record values or paths",
            "Unrecognized/private aggregate report")
    for field in ("rowsInspected", "invalidJsonRows", "invalidItemIds",
                  "unresolvedIdentitySourceRows", "namedIdsWithSourceRows",
                  "sourceNameCollisionIdsHeld", "namedIdsWithNoNumericFields",
                  "publishedCandidateIds", "publishedCandidateSourceRows"):
        require(type(report[field]) is int and report[field] >= 0,
                "Invalid aggregate counter: " + field)
    require(report["rowsInspected"] == source_manifest["sourceDefinitionRows"] == 27281,
            "Source row count differs from the original published snapshot")
    require(report["invalidJsonRows"] == report["invalidItemIds"] == 0,
            "Source JSON or IDs were invalid in the exported snapshot")
    require(report["namedIdsWithSourceRows"] == len(source_names) == 22702,
            "Named item ID coverage mismatch")
    require(report["rowsInspected"] - report["unresolvedIdentitySourceRows"] == 25064,
            "Unresolved original source row coverage mismatch")
    require(report["namedIdsWithSourceRows"] ==
            report["sourceNameCollisionIdsHeld"] +
            report["namedIdsWithNoNumericFields"] +
            report["publishedCandidateIds"],
            "Aggregate item count cannot be reconciled")
    require(isinstance(report["numericFieldCoverage"], dict),
            "Missing numeric field coverage")

    manifest = read_json(candidate / "manifest.json")
    require(isinstance(manifest, dict) and set(manifest) == MANIFEST_KEYS,
            "Candidate manifest contains missing or unexpected fields")
    require(manifest["schemaVersion"] == "1.0" and
            manifest["dataset"] == "all-client-item-raw-stats" and
            manifest["snapshotId"] == 1 and
            manifest["dataSource"] == "game-client-extracted:Items.csv" and
            manifest["notice"] == NOTICE,
            "Candidate manifest provenance/semantics mismatch")
    files = manifest["files"]
    require(isinstance(files, list) and bool(files) and
            all(isinstance(f, str) and re.fullmatch(r"[0-9]{2}\.json", f) for f in files) and
            len(files) == len(set(files)) and files == sorted(files) and
            all(0 <= int(f[:2]) < 30 for f in files),
            "Invalid or unsafe candidate bucket list")
    require({p.name for p in candidate.iterdir()} == {"manifest.json", *files},
            "Candidate directory contains missing or additional files")
    item_count, source_row_count = 0, 0
    fields = Counter()
    seen_ids, seen_source_rows = set(), set()
    for file in files:
        payload = read_json(candidate / file)
        bucket = int(file[:2])
        require(isinstance(payload, dict) and
                set(payload) == {"schemaVersion", "snapshotId", "bucket", "items"} and
                payload["schemaVersion"] == "1.0" and
                payload["snapshotId"] == 1 and
                type(payload["bucket"]) is int and payload["bucket"] == bucket and
                isinstance(payload["items"], dict) and bool(payload["items"]),
                "Invalid source shard schema: " + file)
        for item_id, item_rows in payload["items"].items():
            require(isinstance(item_id, str) and exporter.ID.fullmatch(item_id) and
                    int(item_id) // 1000 == bucket and
                    item_id in source_names and item_id not in seen_ids,
                    "Unknown, duplicated or quarantined ID in bucket: " + file)
            seen_ids.add(item_id)
            item_count += 1
            require(isinstance(item_rows, list) and bool(item_rows),
                    "Candidate item without numeric rows")
            for entry in item_rows:
                require(isinstance(entry, list) and len(entry) == 2,
                        "Malformed source row pair")
                row_id, raw = entry
                require(type(row_id) is int and row_id > 0 and
                        row_id not in seen_source_rows,
                        "Duplicate or invalid original Items.csv row number")
                seen_source_rows.add(row_id)
                require(isinstance(raw, dict) and bool(raw),
                        "Empty or invalid numeric attribute object")
                for key, value in raw.items():
                    require(key in ALLOWED and
                            isinstance(value, str) and
                            exporter.NUMBER.fullmatch(value) is not None,
                            "Non-allowlisted or nonnumeric source value")
                    fields[key] += 1
                source_row_count += 1
    require(type(manifest["itemIds"]) is int and
            manifest["itemIds"] == report["publishedCandidateIds"] == item_count,
            "Candidate item IDs differ from aggregate report")
    require(type(manifest["sourceRows"]) is int and
            manifest["sourceRows"] == report["publishedCandidateSourceRows"] == source_row_count,
            "Candidate source rows differ from aggregate report")
    require(dict(sorted(fields.items())) == report["numericFieldCoverage"],
            "Actual numeric field coverage differs from aggregate report")
    return {"snapshotId": 1, "candidateIds": item_count,
            "sourceRows": source_row_count, "fieldCounts": dict(sorted(fields.items())),
            "status": "AUDITED_CANDIDATE_NOT_AUTOMATICALLY_PUBLISHED"}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path,
                        default=Path("Miner_AllStats_PublicCandidate_20_31"))
    parser.add_argument("--report", type=Path,
                        default=Path("docs/Miner_AllStats_Report_20_31.json"))
    parser.add_argument("--index-dir", type=Path,
                        default=Path("public/data/client-items"))
    parser.add_argument("--allow-absent", action="store_true",
                        help="CI only: the optional public stats directory may not exist yet")
    args = parser.parse_args(argv)
    try:
        if not args.candidate.exists() and args.allow_absent:
            print("[IC] Optional stats not published; protected all-ID database unchanged.")
            return 0
        require(args.candidate.is_dir() and not args.candidate.is_symlink(),
                "Candidate stats directory is unavailable")
        result = validate(args.candidate, args.report, args.index_dir)
        print("[IC] Candidate audit passed:", result["candidateIds"], "IDs,",
              result["sourceRows"], "numeric source rows.")
        print("[IC] Audit does NOT prove live server enhancement eligibility.")
        return 0
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        print("[IC] ERROR: numeric stats candidate REJECTED:", str(error)[:240],
              file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
