#!/usr/bin/env python3
"""Stage 20.9: attest approved output against the original Miner SQLite.

This is a read-only SOURCE consistency check, not a claim of gameplay
verification. Reuses the Stage 20.5 reconciliation/approval code instead
of maintaining a second independent identity policy.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import re
import sqlite3
import sys

SCRIPT = Path(__file__).with_name("reconcile-miner-equipment.py")
SPEC = importlib.util.spec_from_file_location("stage20_5_reconcile_equipment", SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Cannot load the local Stage 20.5 reconciliation module")
STAGE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(STAGE)

SOURCE_REF = re.compile(r"^catalog_items:snapshot=([1-9][0-9]*):record=([1-9][0-9]*)$")


def verify_against_source(database: Path, registry: Path,
                          snapshot_id: int, approved: dict) -> int:
    """Require byte-for-byte semantic identity with a fresh v20.5 output."""
    if not isinstance(approved, dict) or set(approved) != {
        "schemaVersion", "dataset", "snapshot", "records"
    }:
        raise ValueError("approval payload root mismatch")
    if approved["schemaVersion"] != "1.0" or approved["dataset"] != "items":
        raise ValueError("approval payload version/dataset mismatch")
    snap = approved["snapshot"]
    if not isinstance(snap, dict) or set(snap) != {
        "id", "game", "minerVersion", "exportedAt"
    }:
        raise ValueError("approval snapshot format mismatch")
    if snap["id"] != f"miner-snapshot-{snapshot_id}-equipment-approved" or (
        snap["game"] != "Atlantica Online Global"
    ):
        raise ValueError("approval targets a different Miner snapshot")
    if not isinstance(approved["records"], list) or not approved["records"]:
        raise ValueError("approval output must contain one or more records")

    _private, _aggregate, candidates = STAGE.reconcile(database, registry, snapshot_id)
    approvals = []
    for row in approved["records"]:
        if not isinstance(row, dict) or set(row) != {"id", "names", "fields", "evidence"}:
            raise ValueError("approved record shape is incorrect")
        evidence = row["evidence"]
        if not isinstance(evidence, dict) or set(evidence) != {"status", "sources"}:
            raise ValueError("approved record has unexpected evidence fields")
        refs = evidence["sources"]
        if not isinstance(refs, list) or len(refs) != 2 or (
            refs[0] != "reviewed:src/data/equipment-item-names-en.ts"
        ) or not isinstance(refs[1], str):
            raise ValueError("approved source references are not recognized")
        source = SOURCE_REF.fullmatch(refs[1])
        if not source or int(source.group(1)) != snapshot_id:
            raise ValueError("approved source row does not belong to the snapshot")
        fields = row["fields"]
        if not isinstance(fields, dict):
            raise ValueError("approved fields must be an object")
        approvals.append({
            "itemId": row["id"],
            "recordId": int(source.group(2)),
            "fields": list(fields),
            # This note is only an internal call argument for the v20.5
            # policy function: it is NOT a new human editorial approval.
            "reviewNote": "Source consistency verification only; manual approval was a prior step.",
        })

    expected = STAGE.approved_dataset(
        {"schemaVersion": "20.5-approvals", "snapshotId": snapshot_id,
         "approvals": approvals},
        candidates, snapshot_id, snap["minerVersion"], snap["exportedAt"],
    )
    if approved != expected:
        raise ValueError("approved data differs from source-selected Miner values")
    return len(approved["records"])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("approved_output", type=Path)
    parser.add_argument("--snapshot", type=int, required=True)
    parser.add_argument("--registry", type=Path,
                        default=Path("src/data/equipment-item-names-en.ts"))
    args = parser.parse_args(argv)
    try:
        if args.database.resolve() == args.approved_output.resolve():
            raise ValueError("source paths cannot be identical")
        payload = json.loads(args.approved_output.read_text(encoding="utf-8"))
        count = verify_against_source(args.database, args.registry, args.snapshot, payload)
        print(f"[IC] Source consistency passed for {count} explicitly approved item(s).")
        print("[IC] No data files written; SQLite opened read-only.")
        print("[IC] This does not independently verify in-game mechanics or availability.")
        return 0
    except (OSError, ValueError, TypeError, KeyError, sqlite3.Error, json.JSONDecodeError) as error:
        # Do not leak local source path, recipe expressions or raw payloads.
        print(f"[IC] ERROR: Source consistency check blocked: {type(error).__name__}.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
