#!/usr/bin/env python3
"""Stage 20.25: extract actual raw equipment attributes from Miner reference_rows.

Unlike catalog_items, the previously profiled Items.csv reference dataset
contains raw client MinDamage/MaxDamage/AC/MagicDef/Str/Dex/etc columns.
This script never invents values, derives +10/L stats or treats an equipment
field as proof of server mechanics. It opens the original SQLite read-only.

Outputs:
- PRIVATE selected rows retaining the complete raw Items.csv field object
  for exact reviewed English name/ID matches, plus rejected identities.
- AGGREGATE report without item IDs or values.
- OPTIONAL tightly restricted public numeric raw-field subset for already
  reviewed 551 equipment IDs. The source row number stays attached to values.

Run locally; private data must never be committed or shared publicly.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import importlib.util
import json
from pathlib import Path
import re
import sqlite3
import sys

NAME_PARSER=Path(__file__).with_name("reconcile-miner-equipment.py")
SPEC=importlib.util.spec_from_file_location("miner_stage20_5_names",NAME_PARSER)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Missing vetted client equipment names parser")
NAME_MODULE=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(NAME_MODULE)

DATASET="Items.csv"
# Only raw client field labels that the user-provided Miner_ReferenceFields
# profile identified, or members of the established Atlantica item schema.
# Unrecognized/missing fields are skipped, NEVER assigned a default value.
COMBAT_FIELDS=(
    "MinDamage","MaxDamage","Attack","AC","Defence","MagicDef",
    "Str","Dex","Vit","Intl","Int","Critical","CriticalPlus",
    "Critical_Damage","HitRate","Dodge","EV","Magic_Damage",
    "Magic","MagicSkillPlus","ActivePower","BuffUpPercentage",
    "AddElementalBuff","AddAWKPoint","ElementPoint",
    "ADDJobDmg_AXE","ADDJobDmg_BOW","ADDJobDmg_CAN",
    "ADDJobDmg_GUN","ADDJobDmg_SPR","ADDJobDmg_STF","ADDJobDmg_SWD",
    "EnmyJobDmg_AXE","EnmyJobDmg_BOW","EnmyJobDmg_CAN",
    "EnmyJobDmg_GTR","EnmyJobDmg_GUN","EnmyJobDmg_KNU",
    "EnmyJobDmg_SAW","EnmyJobDmg_SPR","EnmyJobDmg_STF",
    "EnmyJobDmg_SWD","EnmyJobDmg_WHIP",
)
NUMERIC=re.compile(r"^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,8})?$")
POS_ID=re.compile(r"^[1-9]\d{0,12}$")
MAX_REFERENCE_ROWS=1_000_000


def normalized(value: object) -> str:
    return value.strip().casefold() if isinstance(value,str) else ""


def parse_raw_fields(row: dict) -> dict[str,str]:
    """Preserve numeric source strings exactly; no float/int cast or defaults."""
    result={}
    for key in COMBAT_FIELDS:
        val=row.get(key)
        if type(val) is int or type(val) is float:
            if val != val or val in (float("inf"),float("-inf")):
                continue
            val=str(val)
        if isinstance(val,str) and len(val)<=50 and NUMERIC.fullmatch(val.strip()):
            result[key]=val.strip()
    return result


def export_reference_stats(database: Path, names: dict[str,str], snapshot: int,
                           generated_at: str|None=None) -> tuple[dict,dict,dict]:
    if type(snapshot) is not int or snapshot<1 or not names:
        raise ValueError("Invalid snapshot or reviewed equipment names")
    db_path=database.expanduser().resolve(strict=True)
    if not db_path.is_file():
        raise ValueError("Database not found")
    rows_by_id=defaultdict(list)
    counters=Counter()
    fields_counts=Counter()
    with sqlite3.connect(db_path.as_uri()+"?mode=ro",uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        table_columns={r[1] for r in db.execute("PRAGMA table_info('reference_rows')")}
        if not {"dataset","row_num","data"}.issubset(table_columns):
            raise ValueError("Missing reference_rows source schema")
        if not db.execute("SELECT 1 FROM snapshots WHERE id=? LIMIT 1",(snapshot,)).fetchone():
            raise ValueError("Specified Miner snapshot is not present")
        for row_num,raw in db.execute(
            "SELECT row_num,data FROM reference_rows WHERE dataset=? ORDER BY row_num",
            (DATASET,)
        ):
            counters["datasetRows"]+=1
            if counters["datasetRows"]>MAX_REFERENCE_ROWS:
                raise ValueError("Reference dataset exceeds permitted row cap")
            if type(row_num) is not int or row_num<1 or not isinstance(raw,str) or len(raw)>1000000:
                counters["invalidSourceRows"]+=1
                continue
            try:
                source=json.loads(raw)
            except (json.JSONDecodeError,ValueError):
                counters["invalidSourceRows"]+=1
                continue
            if not isinstance(source,dict):
                counters["invalidSourceRows"]+=1
                continue
            id_field=source.get("Unique")
            item_id=str(id_field).strip() if isinstance(id_field,(str,int)) and type(id_field) is not bool else ""
            if not POS_ID.fullmatch(item_id):
                counters["invalidItemIdentifiers"]+=1
                continue
            if item_id not in names:
                continue
            rows_by_id[item_id].append({"sourceRowNumber":row_num,"source":source})
            counters["reviewedSourceRows"]+=1

    public_records=[]
    private_items=[]
    for item_id,reviewed in sorted(names.items(),key=lambda kv:int(kv[0])):
        sources=rows_by_id.get(item_id,[])
        matching=[r for r in sources if normalized(r["source"].get("EnglishName"))==
                  normalized(reviewed)]
        differing=[r for r in sources if normalized(r["source"].get("EnglishName"))!=
                  normalized(reviewed)]
        if not sources:
            state="not-in-reference-dataset"
        elif differing:
            state="item-id-name-collision"
        elif matching:
            state="exact-reviewed-name"
        else:
            state="no-exact-reviewed-name"
        counters[state]+=1
        priv={
            "itemId":item_id,
            "reviewedNameEn":reviewed,
            "status":state,
            "sourceRows":[{"sourceRowNumber":r["sourceRowNumber"],
                           "rawFields":r["source"]} for r in sources],
        }
        private_items.append(priv)
        if state!="exact-reviewed-name":
            continue
        safe_rows=[]
        for r in matching:
            selected=parse_raw_fields(r["source"])
            fields_counts.update(selected.keys())
            if selected:
                safe_rows.append({
                    "sourceRowNumber":r["sourceRowNumber"],
                    "fieldsRaw":selected,
                })
        if safe_rows:
            public_records.append({
                "id":item_id,
                "nameEn":reviewed,
                "identity":"exact-official-english-source-name",
                "sourceRows":safe_rows,
            })
            counters["itemsWithNumericClientAttributes"]+=1
    if len(public_records)>len(names):
        raise ValueError("Invalid public output size")
    private={
        "reportVersion":"20.25-private",
        "sourceDataset":DATASET,
        "snapshotId":snapshot,
        "generatedAtUtc":generated_at or datetime.now(timezone.utc).isoformat(),
        "items":private_items,
        "publicationStatus":"PRIVATE full source field values; never automatically commit",
    }
    public={
        "schemaVersion":"1.0","dataset":"client-item-attributes",
        "sourceDataset":DATASET,"snapshotId":snapshot,"records":public_records,
    }
    report={
        "reportVersion":"20.25",
        "snapshotId":snapshot,
        "referenceDataset":DATASET,
        "rowsInspected":counters["datasetRows"],
        "invalidSourceRows":counters["invalidSourceRows"],
        "invalidItemIdentifiers":counters["invalidItemIdentifiers"],
        "reviewedRegistryNames":len(names),
        "rowsForReviewedIds":counters["reviewedSourceRows"],
        "exactMatchIds":counters["exact-reviewed-name"],
        "collisionIds":counters["item-id-name-collision"],
        "unmatchedIds":counters["not-in-reference-dataset"]+
            counters["no-exact-reviewed-name"],
        "itemsWithNumericClientAttributes":counters["itemsWithNumericClientAttributes"],
        "numericFieldCoverage":dict(sorted(fields_counts.items())),
        "privacy":"Aggregate counts only; no raw values, names, IDs, paths or raw client bytes",
        "interpretation":"Raw numeric source fields, not verified gameplay or +10/L calculations",
    }
    return private,public,report


def main(argv=None) -> int:
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("database",type=Path)
    p.add_argument("--snapshot",type=int,required=True)
    p.add_argument("--registry",type=Path,default=Path("src/data/equipment-item-names-en.ts"))
    p.add_argument("--private-output",type=Path,required=True)
    p.add_argument("--report",type=Path,required=True)
    p.add_argument("--public-output",type=Path,
                   help="Optional reviewed-name numeric fields; stage locally after validation")
    ns=p.parse_args(argv)
    try:
        paths=[ns.database.resolve(),ns.registry.resolve(),ns.private_output.resolve(),
               ns.report.resolve()]
        if ns.public_output:paths.append(ns.public_output.resolve())
        if len(set(paths))!=len(paths):
            raise ValueError("Input and output paths cannot coincide")
        names=NAME_MODULE.load_existing_equipment_names(ns.registry)
        private,public,summary=export_reference_stats(ns.database,names,ns.snapshot)
        ns.private_output.write_text(
            json.dumps(private,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        ns.report.write_text(
            json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        if ns.public_output:
            ns.public_output.write_text(
                json.dumps(public,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("[IC] Client Items.csv source rows:",summary["rowsInspected"])
        print("[IC] Exact reviewed item IDs:",summary["exactMatchIds"])
        print("[IC] Items with raw numeric fields:",summary["itemsWithNumericClientAttributes"])
        print("[IC] ID/name collisions blocked:",summary["collisionIds"])
        print("[IC] No inferred combat scaling, item acquisition or live server behavior.")
        return 0
    except (OSError,TypeError,ValueError,KeyError,sqlite3.Error):
        print("[IC] ERROR: Read-only item attribute export blocked by schema or identity conflict",
              file=sys.stderr)
        return 1


if __name__=="__main__":
    raise SystemExit(main())
