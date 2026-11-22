#!/usr/bin/env python3
"""Stage 20.23: read-only client-data export from ALL miner catalog_items rows.

Unlike the historic Wikidot workflow, every structured numeric value in this
report originates in the user's decoded Atlantica game files via the miner.

Export ALL valid item IDs privately, preserving duplicate source definitions,
category, source family, raw level/grade/work/unit, and structured ingredient
references. Never infer attack/armor/skills from columns that do not exist.

Optional --public-output emits a strictly bounded DATASET for the already
reviewed public equipment IDs only. It uses ONLY unambiguous official base
names matching the current name registry and emits source-specific variants,
never a guessed canonical merged recipe. The generated public data must be
reviewed in Git before committing.

No SQLite writes, raw paths, Korean names, raw decoded bytes, drop chance
claims or current-world availability inference.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import importlib.util
import json
import ntpath
from pathlib import Path
import re
import sqlite3
import sys

COLUMNS = (
    "record_id","item_id","region","category","name","original_name",
    "translation_state","source","grade","level","unit","work",
    "material","recipe_state","recipe"
)
FIELDS=("gradeRaw","levelRaw","unitRaw","workRaw","ingredients")
SOURCE_RE = re.compile(r"^ItemType[A-Za-z0-9_]+\.(?:ndt|vna)$",re.I)
MATERIAL = re.compile(r"^([1-9][0-9]*)\(([1-9][0-9]*)\)$")
POS_ID = re.compile(r"^[1-9][0-9]*$")
SAFE_CATEGORY=re.compile(r"^[A-Za-z0-9_ ]{1,60}$")
SAFE_RAW=re.compile(r"^[\w .+:/()'_-]{0,80}$")
STAGE_SCRIPT = Path(__file__).with_name("reconcile-miner-equipment.py")
spec=importlib.util.spec_from_file_location("miner_reconcile_stage20_5",STAGE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Missing source identity/name validator")
identity=importlib.util.module_from_spec(spec)
spec.loader.exec_module(identity)


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")


def safe_raw(value: object, limit: int=80) -> str | int | None:
    if value is None:
        return None
    if type(value) is int and 0 <= value <= 10**12:
        return value
    if isinstance(value,str) and len(value)<=limit and SAFE_RAW.fullmatch(value):
        return value
    return None


def parse_ingredients(material: object, recipe_state: object, recipe: object) -> tuple[str,list[dict]]:
    """Only exact ID(quantity)+... or JSON [[id,qty]] source formats."""
    if recipe_state == "valid" and isinstance(recipe,str):
        try:
            pairs=json.loads(recipe)
            if isinstance(pairs,list) and 0 < len(pairs) <= 200 and all(
                isinstance(p,list) and len(p)==2 and
                type(p[0]) is int and type(p[1]) is int and
                0<p[0]<=10**12 and 0<p[1]<=10**9
                for p in pairs
            ):
                return "parsed-client-recipe",[
                    {"itemId":str(i),"quantity":q} for i,q in pairs]
        except (TypeError,ValueError,json.JSONDecodeError):
            pass
    if material is None or material == "" or material=="NULL":
        return "none",[]
    if not isinstance(material,str) or len(material)>5000:
        return "unsupported",[]
    parts=material.split("+")
    if len(parts)>200:
        return "unsupported",[]
    found=[]
    for part in parts:
        m=MATERIAL.fullmatch(part.strip())
        if not m or int(m[1])>10**12 or int(m[2])>10**9:
            return "unsupported",[]
        found.append({"itemId":m[1],"quantity":int(m[2])})
    return "parsed-client-material",found


def source_role(record: dict) -> str:
    if record["region"]=="ENG":return "localization"
    filename=ntpath.basename(str(record["source"] or ""))
    if filename.casefold() in ("itemtypeweapon.ndt","itemtypedefence.ndt"):
        return "general"
    return "specific"


def public_source(record: dict) -> dict | None:
    file_only=ntpath.basename(str(record["source"] or ""))
    if not SOURCE_RE.fullmatch(file_only):
        return None
    if type(record["record_id"]) is not int or record["record_id"]<1:
        return None
    category=record["category"]
    if not isinstance(category,str) or not SAFE_CATEGORY.fullmatch(category):
        return None
    level=safe_raw(record["level"])
    grade=safe_raw(record["grade"])
    work=safe_raw(record["work"])
    unit=safe_raw(record["unit"])
    status,parts=parse_ingredients(
        record["material"],record["recipe_state"],record["recipe"])
    return {
        "recordId":record["record_id"],
        "file":file_only,
        "role":source_role(record),
        "category":category,
        "levelRaw":level,"gradeRaw":grade,"workRaw":work,"unitRaw":unit,
        "ingredientsStatus":status,"ingredients":parts,
    }


def same_value(a: dict,b: dict) -> bool:
    return all(a[f]==b[f] for f in FIELDS)


def build_catalog(groups: dict[str,list[dict]],
                  reviewed_names: dict[str,str],
                  snapshot_id: int,
                  published_at: str | None=None) -> tuple[dict,dict,dict]:
    if not isinstance(reviewed_names,dict) or type(snapshot_id) is not int or snapshot_id<1:
        raise ValueError("Invalid export registry/snapshot")
    private_items=[]
    public_records=[]
    counts=Counter()
    for item_id in sorted(groups,key=int):
        rows=groups[item_id]
        base=[r for r in rows if r["region"]=="base"]
        localization=[r for r in rows if r["region"]=="ENG"]
        english=[r["name"] for r in base if r["translation_state"]=="official" and
                 isinstance(r["name"],str) and r["name"].strip()]
        identities={name.strip().casefold() for name in english}
        base_identities={r["name"].strip().casefold() for r in base if
                         isinstance(r["name"],str) and r["name"].strip()}
        if len(base_identities)>1 or len(identities)>1:
            state="different-base-identities"
        elif not english:
            state="no-official-English-name"
        else:
            state="one-official-English-name"
        official_name=english[0] if state=="one-official-English-name" else None
        public_name=reviewed_names.get(item_id)
        if public_name is not None and (
            state!="one-official-English-name" or
            official_name.strip().casefold()!=public_name.strip().casefold()
        ):
            state="reviewed-name-conflict"
        definitions=[]
        for r in base:
            definition=public_source(r)
            if definition is not None:
                definitions.append(definition)
        definitions.sort(key=lambda x:x["recordId"])
        category_values=sorted({x["category"] for x in definitions})
        variants=[]
        for row in definitions:
            # Group equal structured source facts, but do not infer that
            # a general row compatible with multiple versions is "the"
            # weapon. All individual original source rows remain present.
            groups_matching=[idx for idx,g in enumerate(variants) if
                             same_value(row,g["sourceRows"][0])]
            if len(groups_matching)==1:
                variants[groups_matching[0]]["sourceRows"].append(row)
            else:
                variants.append({"variantIndex":len(variants)+1,
                                 "sourceRows":[row]})
        if len(variants)>1:
            counts["multiSourceDefinitionSets"]+=1
        if len(category_values)>1:
            counts["crossCategoryDefinitions"]+=1
        counts[state]+=1
        counts["sourceRows"]+=len(rows)
        counts["structuredBaseDefinitions"]+=len(definitions)
        counts["unparsedMaterialDefinitions"]+=sum(
            x["ingredientsStatus"]=="unsupported" for x in definitions)
        linked_legendary_name=official_name
        private_items.append({
            "itemId":item_id,"officialEnglishName":official_name,
            "identityState":state,
            "sources":definitions,
            "variantSets":variants,
            "regionRowCounts":{"base":len(base),"ENG":len(localization)},
            "reviewedEquipmentName":public_name,
        })
        if public_name is None:
            continue
        if state=="one-official-English-name" and definitions:
            public_records.append({
                "id":item_id,"nameEn":public_name,
                "origin":"game-client-extracted",
                "identity":"official-base-name-match",
                "sourceDefinitions":definitions,
                "variantSourceSets":[{
                    "variantIndex":v["variantIndex"],
                    "recordIds":[s["recordId"] for s in v["sourceRows"]]
                } for v in variants],
            })
            counts["reviewedPublicIdsWithSourceFacts"]+=1
    exported_at=published_at or now()
    private={
        "reportVersion":"20.23-private",
        "snapshotId":snapshot_id,"exportedAtUtc":exported_at,
        "dataset":"all-client-catalog-items",
        "items":private_items,
        "publicationStatus":"PRIVATE source inventory, not game-stat verification",
    }
    public={
        "schemaVersion":"1.0","dataset":"client-equipment-facts",
        "snapshotId":snapshot_id,"records":public_records,
    }
    report={
        "reportVersion":"20.23",
        "snapshotId":snapshot_id,
        "sourceRows":counts["sourceRows"],
        "distinctValidItemIds":len(groups),
        "publicReviewedEquipmentIds":len(reviewed_names),
        "publicItemsWithSourceFacts":counts["reviewedPublicIdsWithSourceFacts"],
        "privateItems":len(private_items),
        "sourceValueSetsWithDifferences":counts["multiSourceDefinitionSets"],
        "crossCategoryDefinitions":counts["crossCategoryDefinitions"],
        "unparsedMaterialDefinitions":counts["unparsedMaterialDefinitions"],
        "identityStates":{k:counts[k] for k in (
            "one-official-English-name","different-base-identities",
            "no-official-English-name","reviewed-name-conflict")},
        "interpretation":"Source values are client observations, not current in-game behavior; source variants remain separate",
        "privacy":"Aggregate counts only; no item names, IDs, source paths, raw material strings or client bytes",
    }
    return private,public,report


def export_catalog(database: Path, snapshot_id: int,
                   names: dict[str,str], limit_ids: int=100000) -> tuple[dict,dict,dict]:
    if type(snapshot_id) is not int or snapshot_id<1 or limit_ids<1:
        raise ValueError("Invalid snapshot or source limit")
    source=database.expanduser().resolve(strict=True)
    if not source.is_file():
        raise ValueError("Database source is not a regular file")
    items=defaultdict(list)
    with sqlite3.connect(source.as_uri()+"?mode=ro",uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        columns={r[1] for r in db.execute("PRAGMA table_info('catalog_items')")}
        if not set(COLUMNS).union({"snapshot_id"}).issubset(columns):
            raise ValueError("Miner catalog_items schema differs from expected client snapshot")
        if not db.execute("SELECT 1 FROM snapshots WHERE id=? LIMIT 1",
                          (snapshot_id,)).fetchone():
            raise ValueError("Miner snapshot not found")
        query="SELECT "+",".join(COLUMNS)+" FROM catalog_items WHERE snapshot_id=? ORDER BY item_id,record_id"
        for raw in db.execute(query,(snapshot_id,)):
            row=dict(zip(COLUMNS,raw))
            if type(row["item_id"]) is int and row["item_id"]>0:
                item_id=str(row["item_id"])
                if item_id not in items and len(items)>=limit_ids:
                    raise ValueError("Too many unique source IDs; explicit review required")
                items[item_id].append(row)
    return build_catalog(items,names,snapshot_id)


def main(args=None) -> int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("database",type=Path)
    p.add_argument("--snapshot",type=int,required=True)
    p.add_argument("--registry",type=Path,default=Path("src/data/equipment-item-names-en.ts"))
    p.add_argument("--private-output",type=Path,required=True)
    p.add_argument("--report",type=Path,required=True)
    p.add_argument("--public-output",type=Path,
                   help="Optional: prepared CLIENT-SOURCED JSON for existing reviewed 551 IDs only")
    p.add_argument("--max-item-ids",type=int,default=100000)
    ns=p.parse_args(args)
    try:
        sources=[ns.database.resolve(),ns.registry.resolve()]
        output=[ns.private_output.resolve(),ns.report.resolve()]
        if ns.public_output:output.append(ns.public_output.resolve())
        if len(set(sources+output))!=len(sources+output):
            raise ValueError("Input/output paths must be distinct")
        names=identity.load_existing_equipment_names(ns.registry)
        private,public,summary=export_catalog(ns.database,ns.snapshot,names,ns.max_item_ids)
        ns.private_output.write_text(json.dumps(private,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        ns.report.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        if ns.public_output:
            ns.public_output.write_text(json.dumps(public,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("[IC] All client item IDs analyzed:",summary["distinctValidItemIds"])
        print("[IC] Reviewed box equipment IDs enriched:",summary["publicItemsWithSourceFacts"],"of",len(names))
        print("[IC] Multiple source fact sets:",summary["sourceValueSetsWithDifferences"])
        print("[IC] Public file created only when explicitly requested.")
        print("[IC] SQLite opened read-only, raw names/paths/ingredients expressions NOT published.")
        return 0
    except (OSError,ValueError,KeyError,TypeError,sqlite3.Error):
        print("[IC] ERROR: Client facts export blocked by source contract/permissions",file=sys.stderr)
        return 1


if __name__=="__main__":
    raise SystemExit(main())
