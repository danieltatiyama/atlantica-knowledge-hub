#!/usr/bin/env python3
"""Stage 20.38 — read-only Miner snapshot-1 monster and loot PUBLIC CANDIDATE.

Usage (Windows, from the wiki repository root):
  py scripts/export-client-monster-loot.py "D:\path\to\miner.sqlite3" --dry-run
  py scripts/export-client-monster-loot.py "D:\path\to\miner.sqlite3"

The exporter connects to the ORIGINAL local Miner database in SQLite URI
mode=ro and PRAGMA query_only=ON. It only reads the five already examined
reference datasets and optional original monster catalog. It does not change
the database, decode game assets, infer probabilities, or auto-publish data.

Expected input rows (from reviewed 2026-11-20 Loot V2 investigation):
  Characters.csv          4,351
  DirectDrops.csv          9,959
  CharacterGroupRefs.csv   5,784
  GroupDrops.csv           3,076
  GroupBands.csv             572

Output stays in Miner_MonsterLoot_PublicCandidate_20_38/, not public/.
Manual inspection/review is required before committing/publishing.
"""
from __future__ import annotations
import argparse
from collections import defaultdict, Counter
import json
from pathlib import Path
import re
import sqlite3
import sys

ROOT=Path(__file__).resolve().parents[1]
ITEM_ROOT=ROOT/"public"/"data"/"client-items"
DEST=ROOT/"Miner_MonsterLoot_PublicCandidate_20_38"
ID=re.compile(r"^(?:0|[1-9][0-9]{0,12})$")
POSITIVE_ID=re.compile(r"^[1-9][0-9]{0,12}$")
RAW_NUMBER=re.compile(r"^-?(?:0|[1-9][0-9]{0,15})(?:\.[0-9]{1,8})?$")
EXPECTED={
    "Characters.csv":4351,
    "DirectDrops.csv":9959,
    "CharacterGroupRefs.csv":5784,
    "GroupDrops.csv":3076,
    "GroupBands.csv":572,
}
BASENAME=re.compile(r"^[A-Za-z0-9_.-]{1,100}$")

def require(ok, message):
    if not ok:
        raise ValueError(message)

def raw_text(value, length=160):
    if value is None or value=="":
        return None
    require(isinstance(value,str) and len(value)<=length
        and "\x00" not in value and "<" not in value and ">" not in value,
        "Untrusted original text outside public allowlist")
    return value

def normalized_id(value, positive=True):
    require(type(value) in (str,int), "Non-string original identifier")
    result=str(value).strip()
    require(bool((POSITIVE_ID if positive else ID).fullmatch(result)),
        "Invalid original numeric source ID")
    return result

def raw_numeric(value):
    if value is None or value=="":
        return None
    require(type(value) in (str,int,float), "Unexpected raw numeric type")
    result=str(value).strip()
    require(bool(RAW_NUMBER.fullmatch(result)),
        "Invalid original raw numeric source field")
    return result

def item_catalog(source=ITEM_ROOT):
    manifest=json.loads((source/"manifest.json").read_text(encoding="utf-8"))
    require(manifest.get("schemaVersion")=="1.0"
        and manifest.get("snapshotId")==1
        and manifest.get("totalIds")==23586
        and manifest.get("namedIds")==22702,"Item snapshot mismatch")
    names={}
    statuses={}
    for filename in manifest["indexShards"]:
        require(re.fullmatch(r"index-[0-9]{2}\.json",filename),
            "Unapproved item index filename")
        shard=json.loads((source/filename).read_text(encoding="utf-8"))
        require(shard.get("snapshotId")==1, "Item index shard mismatch")
        for row in shard["rows"]:
            key=normalized_id(row[0])
            require(key not in statuses,"Duplicate index item ID")
            statuses[key]=row[6]
            if row[6]=="named":names[key]=row[1]
    require(len(statuses)==23586 and len(names)==22702,
        "Incomplete original source item index")
    return names,statuses

def reference_rows(db,dataset):
    rows=db.execute(
        "SELECT row_num,data FROM reference_rows WHERE dataset=? ORDER BY row_num",
        (dataset,)).fetchall()
    require(len(rows)==EXPECTED[dataset],
        "Unexpected original Miner rows in "+dataset+
        " (expected "+str(EXPECTED[dataset])+", got "+str(len(rows))+")")
    seen=set()
    result=[]
    for row_num,raw in rows:
        require(isinstance(row_num,int) and row_num>0 and row_num not in seen,
            "Duplicate or missing original source record number")
        require(isinstance(raw,str) and len(raw)<=400000,
            "Unexpected original source JSON size")
        data=json.loads(raw)
        require(isinstance(data,dict),"Unexpected original source JSON type")
        seen.add(row_num);result.append((row_num,data))
    return result

def optional_monster_rows(db):
    tables={x[0] for x in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'")}
    if "monsters" not in tables:return []
    columns={x[1] for x in db.execute("PRAGMA table_info('monsters')")}
    if not {"char_id","code","name","source","level","grade"}.issubset(columns):
        raise ValueError("Unrecognized optional original monster catalog")
    result=[]
    for rid,char_id,code,name,source,level,grade in db.execute(
        "SELECT rowid,char_id,code,name,source,level,grade FROM monsters ORDER BY rowid"):
        if char_id in (None,""):
            continue
        key=normalized_id(char_id)
        code=raw_text(code,100)
        name=raw_text(name)
        src=raw_text(source,500)
        if src is not None:
            # NEVER publish full local Windows source path
            src=src.replace("\\","/").split("/")[-1]
            require(bool(BASENAME.fullmatch(src)),"Unknown local source basename")
        result.append((key,[rid,code,name,src,
                            raw_text(str(level)) if level not in (None,"") else None,
                            raw_text(str(grade)) if grade not in (None,"") else None]))
    return result

def build(db,source=ITEM_ROOT):
    names,statuses=item_catalog(source)
    require(db.execute("PRAGMA query_only").fetchone()[0]==1,
            "SQLite read-only query_only policy missing")
    require(db.execute("SELECT 1 FROM snapshots WHERE id=1").fetchone(),
            "Miner snapshot 1 was not found")
    columns={x[1] for x in db.execute("PRAGMA table_info('reference_rows')")}
    require({"dataset","row_num","data"}.issubset(columns),
            "Unexpected private Miner reference schema")
    input_rows={name:reference_rows(db,name) for name in EXPECTED}
    catalog=defaultdict(lambda:{"original":[],"miner":[]})
    direct=defaultdict(list)
    refs=defaultdict(list)
    group_drops=defaultdict(list)
    group_bands=defaultdict(list)
    reverse=defaultdict(lambda:{"direct":[],"group":[]})
    quantities=Counter()

    for row_num,data in input_rows["Characters.csv"]:
        char_id=normalized_id(data.get("CharID"))
        record=[row_num,raw_text(data.get("EnglishName")),
                raw_numeric(data.get("ConfiguredLevel")),
                raw_text(data.get("InternalKind"),100)]
        catalog[char_id]["original"].append(record)

    for char_id,record in optional_monster_rows(db):
        catalog[char_id]["miner"].append(record)

    for row_num,data in input_rows["DirectDrops.csv"]:
        char_id=normalized_id(data.get("CharID"))
        item_id=normalized_id(data.get("ItemID"))
        raw_rate=raw_numeric(data.get("RawRate"))
        slot=raw_text(data.get("Slot"),100)
        min_qty=raw_numeric(data.get("MinQtyCandidate"))
        max_qty=raw_numeric(data.get("MaxQtyCandidate"))
        direct[char_id].append([
            row_num,item_id,raw_rate,slot,min_qty,max_qty
        ])
        reverse[item_id]["direct"].append([
            char_id,row_num,raw_rate,slot,min_qty,max_qty,
        ])
        quantities["direct"]+=1

    for row_num,data in input_rows["CharacterGroupRefs.csv"]:
        char_id=normalized_id(data.get("CharID"))
        group_id=normalized_id(data.get("GroupID"),positive=False)
        refs[char_id].append([
            row_num,group_id,raw_numeric(data.get("RawRate")),
            raw_text(data.get("Slot"),100)
        ])

    for row_num,data in input_rows["GroupDrops.csv"]:
        group_id=normalized_id(data.get("GroupID"),positive=False)
        item_id=normalized_id(data.get("ItemID"))
        group_drops[group_id].append([
            row_num,raw_text(data.get("Band"),80),
            item_id,raw_numeric(data.get("RawRate")),
            raw_text(data.get("Slot"),100),
            raw_numeric(data.get("MinQtyCandidate")),
            raw_numeric(data.get("MaxQtyCandidate")),
        ])

    for row_num,data in input_rows["GroupBands.csv"]:
        group_id=normalized_id(data.get("GroupID"),positive=False)
        group_bands[group_id].append([
            row_num,raw_text(data.get("Band"),80),
            raw_text(data.get("BandKey"),80),
            raw_numeric(data.get("EntryCount")),
            raw_numeric(data.get("RawSum"))
        ])

    # Both group stages remain separate: we do NOT combine chance fields.
    by_group=defaultdict(list)
    for char_id,entries in refs.items():
        for entry in entries:
            by_group[entry[1]].append((char_id,entry))
    for group_id,entries in group_drops.items():
        for drop in entries:
            for char_id,ref in by_group.get(group_id,()):
                item_id=drop[2]
                reverse[item_id]["group"].append([
                    char_id,group_id,ref[0],drop[0],ref[2],drop[3],
                    ref[3],drop[1],drop[5],drop[6],
                ])
                quantities["group_joins"]+=1
                require(quantities["group_joins"]<=1_000_000,
                    "Unexpected group fanout, stop before publication")

    unreferenced_group_ids=set(group_drops)-set(by_group)
    require(not (set(direct)|set(refs))-set(catalog),
        "Source drops refer to unknown original CharID")
    groups=set(group_drops)|set(group_bands)|set(by_group)
    source_items=set(reverse)
    item_status=Counter(
        "named" if item_id in names else statuses.get(item_id,"not-in-index")
        for item_id in source_items
    )
    monster_index=[]
    for char_id,record in sorted(catalog.items(),key=lambda e:int(e[0])):
        en_names={r[1] for r in record["original"] if r[1]}
        levels={r[2] for r in record["original"] if r[2] is not None}
        kinds={r[3] for r in record["original"] if r[3]}
        monster_index.append([
            char_id,next(iter(en_names)) if len(en_names)==1 else None,
            next(iter(levels)) if len(levels)==1 else None,
            next(iter(kinds)) if len(kinds)==1 else None,
            "named" if len(en_names)==1 else
              "conflict" if len(en_names)>1 else "unnamed",
            len(direct.get(char_id,())),len(refs.get(char_id,())),
            len(record["miner"]),
        ])
    output={}
    def add_bucket(dataset,items):
        grouping=defaultdict(dict)
        for key,data in items.items():
            grouping[int(key)//1000][key]=data
        filenames=[]
        for bucket,records in sorted(grouping.items()):
            filename=dataset+"/"+str(bucket).zfill(2)+".json"
            filenames.append(filename)
            output[filename]={
                "schemaVersion":"1.0","snapshotId":1,"bucket":bucket,
                "items":dict(sorted(records.items(),key=lambda x:int(x[0])))
            }
        return filenames
    def compact_monster(r):
        return {"original":r["original"],"miner":r["miner"]}
    characters=add_bucket("characters",{
        key:compact_monster(record) for key,record in catalog.items()
    })
    loot=add_bucket("loot",{
        key:{"direct":direct.get(key,[]),"groups":refs.get(key,[])}
        for key in set(direct)|set(refs)
    })
    group_files=add_bucket("groups",{
        group_id:{"drops":group_drops.get(group_id,[]),
                  "bands":group_bands.get(group_id,[])}
        for group_id in groups
    })
    item_files=add_bucket("item-sources",dict(reverse))
    catalog_files=[]
    for i in range(0,len(monster_index),1500):
        filename="index-"+str(i//1500).zfill(2)+".json"
        catalog_files.append(filename)
        output[filename]={"schemaVersion":"1.0","snapshotId":1,
                          "rows":monster_index[i:i+1500]}
    manifest={
        "schemaVersion":"1.0","snapshotId":1,
        "dataset":"all-client-monster-loot-original",
        "rawSourceRows":EXPECTED,"catalogMonsterIds":len(monster_index),
        "catalogMonsterBaseRows":sum(len(v["miner"]) for v in catalog.values()),
        "reconciledEnglishNames":sum(row[4]=="named" for row in monster_index),
        "directSourceRows":sum(map(len,direct.values())),
        "groupReferenceRows":sum(map(len,refs.values())),
        "groupDropRows":sum(map(len,group_drops.values())),
        "groupBandRows":sum(map(len,group_bands.values())),
        "distinctGroupIds":len(groups),
        "unreferencedGroupIds":len(unreferenced_group_ids),
        "reverseItemIds":len(reverse),
        "reverseItemStatuses":dict(item_status),
        "groupSourceJoins":quantities["group_joins"],
        "files":{"index":catalog_files,"characters":characters,
                 "loot":loot,"groups":group_files,
                 "itemSources":item_files},
        "notice":"Client extracted source candidates only. RawRate and Group refs are NOT verified probabilities; direct/group mechanics, item eligibility, current server drops, and independent rolls are unknown. Raw source records and uncertain IDs remain distinguishable.",
    }
    output["manifest.json"]=manifest
    report={
        "reportVersion":"20.38-public-candidate-audit",
        "snapshotId":1,"sourceRowCounts":EXPECTED,
        "monsterIds":len(monster_index),
        "monsterOriginalSourceRows":sum(len(v["miner"]) for v in catalog.values()),
        "reconciledEnglishNames":manifest["reconciledEnglishNames"],
        "distinctGroups":len(groups),
        "orphanGroupIds":len(unreferenced_group_ids),
        "knownMonsterDrops":len(direct),
        "reverseItemIds":len(reverse),
        "itemIdentityStatuses":dict(item_status),
        "groupJoinCount":quantities["group_joins"],
        "privacy":"Aggregate metrics only. No raw monster names, drop IDs, file paths or private source JSON."
    }
    return output,report

def write_candidate(output,target,overwrite=False):
    require(target.name=="Miner_MonsterLoot_PublicCandidate_20_38",
        "Candidate directory must retain the explicit private review name")
    require(not target.is_symlink(),"Refusing to write through a symlink")
    require(not target.exists() or overwrite,
        "Candidate already exists; use --overwrite only after reviewing")
    if target.exists():
        require(all(p.is_file() and not p.is_symlink()
            for p in target.rglob("*") if p.is_file()),
            "Unsafe candidate path")
    # Produce the complete output away from public/; avoid partial files.
    import tempfile,shutil
    with tempfile.TemporaryDirectory(prefix="miner-loot-",dir=target.parent) as temp:
        staging=Path(temp)/target.name
        staging.mkdir()
        for name,obj in output.items():
            relative=Path(name)
            require(".." not in relative.parts and not relative.is_absolute(),
                "Unsafe public candidate filename")
            path=staging/relative
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(json.dumps(obj,ensure_ascii=False,
                separators=(",",":"),allow_nan=False)+"\n",encoding="utf-8")
        if target.exists():shutil.rmtree(target)
        shutil.copytree(staging,target)

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("database",type=Path)
    parser.add_argument("--output",type=Path,default=DEST)
    parser.add_argument("--dry-run",action="store_true")
    parser.add_argument("--overwrite",action="store_true")
    args=parser.parse_args(argv)
    try:
        require(args.database.is_file(),"Original Miner SQLite not found")
        require(args.output.parent.resolve()!=args.database.resolve(),
            "Candidate output collides with original SQLite file")
        with sqlite3.connect(args.database.resolve().as_uri()+"?mode=ro",uri=True) as db:
            db.execute("PRAGMA query_only=ON")
            output,report=build(db)
        if not args.dry_run:
            write_candidate(output,args.output,args.overwrite)
            print("[IC] PRIVATE review candidate:",args.output)
        print("[IC] Source validation passed; original monster IDs:",
            report["monsterIds"],"unique item IDs with source drops:",
            report["reverseItemIds"])
        print("[IC] Source-only audit:",json.dumps(report,ensure_ascii=False))
        print("[IC] NO server rate percentages or gameplay drop chances inferred.")
        print("[IC] NO private SQLite database files or raw Miner JSON published.")
        return 0
    except (OSError,ValueError,TypeError,KeyError,
            sqlite3.Error,json.JSONDecodeError) as error:
        print("[IC] ERROR: source-only monster export rejected:",
              str(error)[:240],file=sys.stderr)
        return 1

if __name__=="__main__":
    raise SystemExit(main())
