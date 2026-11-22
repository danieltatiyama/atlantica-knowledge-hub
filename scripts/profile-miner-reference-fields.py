#!/usr/bin/env python3
"""Stage 20.24: read-only schema discovery for ALL original Miner reference rows.

The Miner also contains reference_rows from Items.csv, CraftMaterials.csv,
CraftRecipes.csv, DirectDrops.csv, Characters.csv etc. Their decoded JSON
FIELD NAMES are unknown to this frontend and should be profiled rather than
invented. Export only aggregate key/types and row counts; never raw values,
user paths, material expressions, probabilities or source client content.
"""
from __future__ import annotations
import argparse
from collections import Counter,defaultdict
import json
from pathlib import Path
import re
import sqlite3
import sys

SAFE_NAME=re.compile(r"^[A-Za-z][A-Za-z0-9_ .:-]{0,70}$")
DATASET_NAME=re.compile(r"^[A-Za-z][A-Za-z0-9_ .-]{0,100}$")
CANDIDATE=re.compile(r"(?i)attack|damage|defen|armor|magic|strength|dexterity|vitality|intelligence|critical|multihit|evasion|work|recipe|item|quantity|skill|level|source|drop")
MAX_ROWS=1_000_000
MAX_FIELDS=10000

def value_type(value):
    if value is None:return "null"
    if type(value) is bool:return "boolean"
    if type(value) in (int,float):return "number"
    if isinstance(value,str):return "string"
    if isinstance(value,list):return "array"
    if isinstance(value,dict):return "object"
    return "other"

def read_profile(database:Path,max_rows=MAX_ROWS)->dict:
    if max_rows<1 or max_rows>MAX_ROWS:raise ValueError("Out of range row cap")
    file=database.expanduser().resolve(strict=True)
    if not file.is_file():raise ValueError("Missing Miner database file")
    stats=defaultdict(lambda:{
        "rows":0,"jsonObjectRows":0,"jsonArrayRows":0,"invalidJsonRows":0,
        "fields":defaultdict(lambda:{"occurrences":0,"types":Counter()})
    })
    total=0
    with sqlite3.connect(file.as_uri()+"?mode=ro",uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        columns={r[1] for r in db.execute("PRAGMA table_info('reference_rows')")}
        if not {"dataset","row_num","data"}.issubset(columns):
            raise ValueError("Miner has no compatible reference_rows table")
        for dataset,blob in db.execute(
            "SELECT dataset,data FROM reference_rows ORDER BY dataset,row_num"
        ):
            total+=1
            if total>max_rows:raise ValueError("Row cap reached; explicit review needed")
            if not isinstance(dataset,str) or not DATASET_NAME.fullmatch(dataset):
                continue
            group=stats[dataset]
            group["rows"]+=1
            if not isinstance(blob,str) or len(blob)>1000000:
                group["invalidJsonRows"]+=1
                continue
            try:
                decoded=json.loads(blob)
            except (json.JSONDecodeError,ValueError):
                group["invalidJsonRows"]+=1
                continue
            if isinstance(decoded,dict):
                group["jsonObjectRows"]+=1
                values=decoded
            elif isinstance(decoded,list):
                group["jsonArrayRows"]+=1
                # Unknown list columns: only record array type and length
                # indirectly, never guess what each position means.
                values={}
            else:
                values={}
            if len(values)>MAX_FIELDS:
                raise ValueError("Abnormally wide source row")
            for key,value in values.items():
                if not isinstance(key,str) or not SAFE_NAME.fullmatch(key):
                    continue
                field=group["fields"][key]
                field["occurrences"]+=1
                field["types"][value_type(value)]+=1
    output=[]
    for name in sorted(stats):
        group=stats[name]
        columns=[{
            "fieldName":k,
            "rowsPresent":v["occurrences"],
            "types":dict(sorted(v["types"].items()))
        } for k,v in sorted(group["fields"].items())]
        output.append({
            "datasetName":name,
            "sourceRowCount":group["rows"],
            "jsonObjectRows":group["jsonObjectRows"],
            "jsonArrayRows":group["jsonArrayRows"],
            "unparsedRows":group["invalidJsonRows"],
            "columnCount":len(columns),
            "columns":columns[:100],
            "columnsTruncated":len(columns)>100,
            "possibleGameplayColumns":sorted(k for k in group["fields"] if
                                             CANDIDATE.search(k))[:50],
        })
    return {
        "reportVersion":"20.24-fields",
        "source":"reference_rows aggregate field names only",
        "totalRowsVisited":total,
        "datasets":output,
        "privacy":"No records.data, raw item names, raw rates, recipes, material expressions or paths in report",
    }


def main(args=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("database",type=Path)
    p.add_argument("--output",type=Path,required=True)
    ns=p.parse_args(args)
    try:
        if ns.database.resolve()==ns.output.resolve():
            raise ValueError("Output cannot overwrite source DB")
        report=read_profile(ns.database)
        ns.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",
                             encoding="utf-8")
        print("[IC] Reference datasets:",len(report["datasets"]))
        print("[IC] Reference rows inspected:",report["totalRowsVisited"])
        print("[IC] Only key names/type counts exported; no private source values.")
        return 0
    except (OSError,ValueError,sqlite3.Error,TypeError):
        print("[IC] ERROR: Reference data field schema discovery blocked.",file=sys.stderr)
        return 1

if __name__=="__main__":
    raise SystemExit(main())
