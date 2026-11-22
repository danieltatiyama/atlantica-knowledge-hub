#!/usr/bin/env python3
"""Stage 20.11: distinguish overlapping definitions, variants and ID collisions.

A single numeric item_id can appear in generalized ItemTypeWeapon/Defence
files, specialized ItemTypeSword/Armor files, and ENG localization rows.
These are source records, not necessarily different in-game items.

Read SQLite in mode=ro. Export a PRIVATE per-ID provenance index plus an
AGGREGATE-ONLY report. No inferred merge, item stat, crafting recipe, or
source data is automatically published.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import importlib.util
import json
import ntpath
from pathlib import Path
import sqlite3
import sys

BASE_COLUMNS = (
    "record_id", "item_id", "region", "category", "source",
    "name", "original_name", "grade", "level", "unit", "work",
    "material", "recipe_state", "recipe",
)
FIELDS = ("grade", "level", "unit", "work", "material", "recipe")
CONFLICT_FIELDS = ("grade", "level", "unit", "work", "material", "recipe")
CLASSIFICATIONS = (
    "not-in-source",
    "no-reviewed-base-match",
    "id-collision-different-names",
    "identity-ambiguous-original-names",
    "divergent-source-variants",
    "ambiguous-source-assignment",
    "general-and-specific-overlap",
    "complementary-source-definitions",
    "identical-source-definitions",
    "localization-overlay-only",
    "single-source-definition",
)
GENERAL = {
    ("Weapon", "ItemTypeWeapon.ndt"),
    ("Defence", "ItemTypeDefence.ndt"),
}

STAGE20_5_PATH = Path(__file__).with_name("reconcile-miner-equipment.py")
SPEC = importlib.util.spec_from_file_location("miner_equipment_stage_20_5", STAGE20_5_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Missing local reviewed names parser")
STAGE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(STAGE)


def key(value: object) -> str:
    return value.strip().casefold() if isinstance(value, str) else ""


def populated(value: object) -> bool:
    return value is not None and (not isinstance(value, str) or value.strip() != "")


def file_only(row: dict) -> str:
    return ntpath.basename(str(row["source"] or ""))


def source_role(row: dict) -> str:
    if row["region"] == "ENG":
        return "localization"
    if (row["category"], file_only(row)) in GENERAL:
        return "general"
    return "specific"


def compare_rows(a: dict, b: dict) -> list[str]:
    """Compare only overlapping *known* semantic data, not parser artifacts.

    Two records with equal materialRaw but one unparsed recipe are compatible:
    the parsed result complements the general row. A pair with two parsed
    but different recipes, work values, or populated unit values conflicts.
    """
    different = []
    for field in FIELDS:
        va, vb = a[field], b[field]
        if field == "recipe":
            # Recipe is only authoritative as a parsed representation when
            # both rows actually report recipe_state == valid.
            if a["recipe_state"] == b["recipe_state"] == "valid" and va != vb:
                different.append(field)
        elif populated(va) and populated(vb) and va != vb:
            different.append(field)
    return different


def variant_groups(rows: list[dict]) -> tuple[list[list[dict]], list[dict]]:
    """Non-conflicting clusters; ambiguous shared rows remain unassigned.

    Prefer comparing specific source rows before generalized source rows.
    A generalized row compatible with two distinct variants is NOT
    arbitrarily assigned to either one.
    """
    sorted_rows = sorted(rows, key=lambda r: (
        source_role(r) == "general", file_only(r).casefold(), r["record_id"]
    ))
    clusters: list[list[dict]] = []
    ambiguous: list[dict] = []
    for row in sorted_rows:
        compatible = [
            idx for idx, cluster in enumerate(clusters)
            if all(not compare_rows(row, other) for other in cluster)
        ]
        if len(compatible) == 1:
            clusters[compatible[0]].append(row)
        elif len(compatible) == 0:
            clusters.append([row])
        else:
            ambiguous.append(row)
    return clusters, ambiguous


def analyze_equipment(item_id: str, name_en: str, rows: list[dict]) -> dict:
    base = [r for r in rows if r["region"] == "base"]
    localized = [r for r in rows if r["region"] == "ENG"]
    matched = [r for r in base if key(r["name"]) == key(name_en)]
    all_base_names = {key(r["name"]) for r in base}
    original_names = {key(r["original_name"]) for r in matched}
    if not rows:
        status = "not-in-source"
    elif not matched:
        status = "no-reviewed-base-match"
    elif len(all_base_names) > 1:
        status = "id-collision-different-names"
    elif len(original_names) != 1 or not next(iter(original_names)):
        status = "identity-ambiguous-original-names"
    else:
        status = None

    clusters, unassigned = (variant_groups(matched) if status is None else ([], []))
    if status is None:
        if len(clusters) > 1:
            status = "divergent-source-variants"
        elif unassigned:
            status = "ambiguous-source-assignment"
        elif len(matched) > 1:
            categories = {(r["category"], source_role(r)) for r in matched}
            roles = {source_role(r) for r in matched}
            any_field_enrichment = any(
                (a[f] is None) != (b[f] is None)
                for i, a in enumerate(matched) for b in matched[i + 1:]
                for f in ("unit", "recipe")
            ) or len({r["recipe_state"] for r in matched}) > 1
            if "general" in roles and "specific" in roles:
                status = "general-and-specific-overlap"
            elif any_field_enrichment:
                status = "complementary-source-definitions"
            else:
                status = "identical-source-definitions"
        elif localized:
            status = "localization-overlay-only"
        else:
            status = "single-source-definition"

    different_semantic_fields = sorted({
        field
        for index, left in enumerate(matched)
        for right in matched[index + 1:]
        for field in compare_rows(left, right)
    })
    other_identities = [r for r in base if key(r["name"]) != key(name_en)]
    variants = []
    for index, group in enumerate(clusters, 1):
        source_rows = []
        for r in group:
            source_rows.append({
                "recordId": r["record_id"],
                "fileOnly": file_only(r),
                "category": r["category"],
                "role": source_role(r),
            })
        variants.append({"variantIndex": index, "sourceRows": source_rows})

    return {
        "itemId": item_id,
        "reviewedPublicNameEn": name_en,
        "classification": status,
        "totalSourceRows": len(rows),
        "baseRows": len(base),
        "localizationRows": len(localized),
        "sourceVariantGroups": variants,
        "differentSemanticFields": different_semantic_fields,
        "ambiguousSharedSourceRows": [
            {"recordId": r["record_id"], "fileOnly": file_only(r),
             "category": r["category"], "role": source_role(r)}
            for r in unassigned
        ],
        "identityCollisionSourceRows": [
            {"recordId": r["record_id"], "fileOnly": file_only(r),
             "category": r["category"], "role": source_role(r)}
            for r in other_identities
        ],
        "localizationSourceRows": [
            {"recordId": r["record_id"], "fileOnly": file_only(r),
             "category": r["category"], "role": "localization"}
            for r in localized
        ],
        "notes": (
            "Source grouping is diagnostic only; differing variants are not "
            "verified gameplay item variants. Names and raw recipes are not "
            "exported except the already-reviewed public English name."
        ),
    }


def read_rows(database: Path, snapshot_id: int, ids: set[str]) -> dict[str, list[dict]]:
    if type(snapshot_id) is not int or snapshot_id < 1:
        raise ValueError("snapshot ID must be positive")
    path = database.expanduser().resolve(strict=True)
    if not path.is_file():
        raise ValueError("database is not a regular file")
    result: dict[str, list[dict]] = defaultdict(list)
    with sqlite3.connect(path.as_uri() + "?mode=ro", uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        columns = {row[1] for row in db.execute("PRAGMA table_info('catalog_items')")}
        if not set(BASE_COLUMNS).union({"snapshot_id"}).issubset(columns):
            raise ValueError("catalog_items missing required source fields")
        if db.execute("SELECT 1 FROM snapshots WHERE id=?", (snapshot_id,)).fetchone() is None:
            raise ValueError("snapshot not found")
        statement = "SELECT " + ",".join(BASE_COLUMNS) + (
            " FROM catalog_items WHERE snapshot_id=? ORDER BY item_id, record_id"
        )
        for values in db.execute(statement, (snapshot_id,)):
            row = dict(zip(BASE_COLUMNS, values))
            if type(row["item_id"]) is int and str(row["item_id"]) in ids:
                result[str(row["item_id"])].append(row)
    return result


def report_source_groups(database: Path, registry: Path, snapshot_id: int) -> tuple[dict, dict]:
    reviewed = STAGE.load_existing_equipment_names(registry)
    data = read_rows(database, snapshot_id, set(reviewed))
    entries = [
        analyze_equipment(item_id, reviewed[item_id], data.get(item_id, []))
        for item_id in sorted(reviewed, key=int)
    ]
    counts = Counter(entry["classification"] for entry in entries)
    grouped = Counter()
    for entry in entries:
        grouped["totalSourceRows"] += entry["totalSourceRows"]
        grouped["sourceVariantGroups"] += len(entry["sourceVariantGroups"])
        grouped["unassignedSourceRows"] += len(entry["ambiguousSharedSourceRows"])
        grouped["collisionSourceRows"] += len(entry["identityCollisionSourceRows"])

    aggregate = {
        "reportVersion": "20.11",
        "snapshotId": snapshot_id,
        "reviewedItemIds": len(reviewed),
        "classes": {status: counts[status] for status in CLASSIFICATIONS},
        "summary": {field: grouped[field] for field in (
            "totalSourceRows", "sourceVariantGroups",
            "unassignedSourceRows", "collisionSourceRows"
        )},
        "publicationStatus": "BLOCKED: no source groups or variants automatically approved",
        "privacy": "Aggregate-only. No names, item IDs, raw client payloads, recipes or paths",
    }
    private = {
        "reviewVersion": "20.11-private",
        "snapshotId": snapshot_id,
        "generatedAtUtc": datetime.now(timezone.utc)
            .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "publicationStatus": "PRIVATE: source-role/variant candidates only, no automatic approvals",
        "items": entries,
    }
    if sum(counts.values()) != len(reviewed):
        raise ValueError("classification count does not balance")
    return private, aggregate


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database", type=Path)
    parser.add_argument("--snapshot", type=int, required=True)
    parser.add_argument("--registry", type=Path,
                        default=Path("src/data/equipment-item-names-en.ts"))
    parser.add_argument("--private-output", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        files = [args.database.resolve(), args.registry.resolve(),
                 args.private_output.resolve(), args.report.resolve()]
        if len(set(files)) != len(files):
            raise ValueError("all paths must differ")
        private, aggregate = report_source_groups(args.database, args.registry, args.snapshot)
        args.private_output.write_text(
            json.dumps(private, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        args.report.write_text(
            json.dumps(aggregate, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"[IC] Reviewed equipment IDs: {aggregate['reviewedItemIds']}")
        print("[IC] Local source groups classified. No item data or variants published.")
        return 0
    except (OSError, ValueError, sqlite3.Error, TypeError) as exc:
        print(f"[IC] ERROR: {type(exc).__name__}. Check source and snapshot.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
