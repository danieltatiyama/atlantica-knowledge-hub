#!/usr/bin/env python3
"""Safety/identity validation for reviewed candidate monster source shards.

Deliberately validates original references and source-row counts, while
preserving unknown item IDs and avoiding any rate-percent calculations.
This validator does not independently prove live-server drops.
"""
from __future__ import annotations
from collections import Counter,defaultdict
import argparse
import importlib.util
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
DEFAULT=ROOT/"Miner_MonsterLoot_PublicCandidate_20_38"
MODULE=ROOT/"scripts"/"export-client-monster-loot.py"
spec=importlib.util.spec_from_file_location("monster_candidate_exporter",MODULE)
export=importlib.util.module_from_spec(spec)
spec.loader.exec_module(export)

def load(path):
    return json.loads(path.read_text(encoding="utf-8"))

def validate(path:Path):
    manifest=load(path/"manifest.json")
    export.require(manifest.get("schemaVersion")=="1.0"
        and manifest.get("snapshotId")==1
        and manifest.get("dataset")=="all-client-monster-loot-original"
        and manifest.get("rawSourceRows")==export.EXPECTED,
        "Unapproved original monster source manifest")
    files=manifest.get("files")
    export.require(isinstance(files,dict)
        and set(files)=={"index","characters","loot","groups","itemSources"},
        "Unexpected monster dataset shard groups")
    allowed={
        "index":re.compile(r"^index-[0-9]{2}\.json$"),
        "characters":re.compile(r"^characters/[0-9]+\.json$"),
        "loot":re.compile(r"^loot/[0-9]+\.json$"),
        "groups":re.compile(r"^groups/[0-9]+\.json$"),
        "itemSources":re.compile(r"^item-sources/[0-9]+\.json$"),
    }
    expected={"manifest.json"}
    for group,names in files.items():
        export.require(isinstance(names,list)
            and len(names)==len(set(names))
            and all(isinstance(name,str) and allowed[group].fullmatch(name)
                for name in names),"Unsafe source shard filenames: "+group)
        expected.update(names)
    actual={p.relative_to(path).as_posix()
            for p in path.rglob("*") if p.is_file()}
    export.require(actual==expected and not any(p.is_symlink()
        for p in path.rglob("*")), "Missing or extra public candidate file")

    source_names,statuses=export.item_catalog()
    item_sources={}
    character_ids=set()
    original_char_rows=set()
    original_miner_rows=set()
    row_catalog={}
    index_ids=set()
    for filename in files["index"]:
        src=load(path/filename)
        export.require(src.get("schemaVersion")=="1.0" and
            src.get("snapshotId")==1,"Invalid monster catalog index shard")
        for row in src["rows"]:
            export.require(len(row)==8 and
                (id:=export.normalized_id(row[0])) not in index_ids,
                "Invalid or duplicate monster catalog ID")
            index_ids.add(id);row_catalog[id]=row
            export.require(row[4] in {"named","conflict","unnamed"} and
                ((row[1] is None) == (row[4]!="named")),
                "Invented/unreconciled original monster name")
    for filename in files["characters"]:
        shard=load(path/filename)
        bucket=shard["bucket"]
        export.require(shard["schemaVersion"]=="1.0" and
            shard["snapshotId"]==1,"Invalid character evidence shard")
        for id,records in shard["items"].items():
            export.require(id in index_ids and int(id)//1000==bucket and
                id not in character_ids,"Duplicate character identity")
            character_ids.add(id)
            for entry in records["original"]:
                export.require(isinstance(entry,list) and len(entry)==4 and
                    entry[0] not in original_char_rows,"Duplicate original character record")
                original_char_rows.add(entry[0])
            for entry in records["miner"]:
                export.require(isinstance(entry,list) and len(entry)==6 and
                    entry[0] not in original_miner_rows,"Duplicate Miner source row")
                original_miner_rows.add(entry[0])
    export.require(character_ids==index_ids and
        len(original_char_rows)==export.EXPECTED["Characters.csv"] and
        len(original_miner_rows)==manifest["catalogMonsterBaseRows"] and
        len(index_ids)==manifest["catalogMonsterIds"],"Incomplete monster source coverage")

    directRows=set();refRows=set();dropRows=set();bandRows=set()
    group_by_id={};references=defaultdict(list);source_direct=defaultdict(list)
    for filename in files["loot"]:
        shard=load(path/filename)
        export.require(shard["schemaVersion"]=="1.0" and
            shard["snapshotId"]==1,"Invalid monster loot shard")
        for char_id,entry in shard["items"].items():
            export.require(char_id in index_ids and
                int(char_id)//1000==shard["bucket"],"Unknown monster CharID")
            for row in entry["direct"]:
                export.require(len(row)==7 and row[0] not in directRows,
                    "Bad/duplicate direct loot source record")
                rid,item_id,name,raw_rate,slot,minq,maxq=row
                export.normalized_id(item_id)
                export.require(name==source_names.get(item_id),
                    "Invented or conflicting source item name")
                export.raw_numeric(raw_rate)
                source_direct[item_id].append([
                    char_id,row_catalog[char_id][1],rid,
                    raw_rate,slot,minq,maxq,
                ])
                directRows.add(rid)
            for row in entry["groups"]:
                export.require(len(row)==4 and row[0] not in refRows,
                    "Bad/duplicate group ref record")
                rid,group_id,raw_rate,slot=row
                export.normalized_id(group_id,positive=False)
                export.raw_numeric(raw_rate)
                references[group_id].append((char_id,row))
                refRows.add(rid)
    for filename in files["groups"]:
        shard=load(path/filename)
        export.require(shard["schemaVersion"]=="1.0" and
            shard["snapshotId"]==1,"Invalid original group source shard")
        for group_id,entry in shard["items"].items():
            export.normalized_id(group_id,positive=False)
            export.require(int(group_id)//1000==shard["bucket"] and
                group_id not in group_by_id,"Duplicate raw GroupID")
            group_by_id[group_id]=entry
            for row in entry["drops"]:
                export.require(len(row)==8 and row[0] not in dropRows,
                    "Duplicate group drop source row")
                export.require(row[3]==source_names.get(row[2]),
                    "Invented group drop item name")
                dropRows.add(row[0])
            for row in entry["bands"]:
                export.require(len(row)==5 and row[0] not in bandRows,
                    "Duplicate source group band row")
                bandRows.add(row[0])
    export.require(len(directRows)==export.EXPECTED["DirectDrops.csv"] and
        len(refRows)==export.EXPECTED["CharacterGroupRefs.csv"] and
        len(dropRows)==export.EXPECTED["GroupDrops.csv"] and
        len(bandRows)==export.EXPECTED["GroupBands.csv"],
        "Missing original direct/group source rows")
    export.require(set(references).issubset(group_by_id) and
        len(group_by_id)==manifest["distinctGroupIds"],"Broken group reference join")

    source_group=defaultdict(list)
    for group_id,refs in references.items():
        for char_id,ref in refs:
            for drop in group_by_id[group_id]["drops"]:
                source_group[drop[2]].append([
                    char_id,row_catalog[char_id][1],group_id,
                    ref[0],drop[0],ref[2],drop[4],
                    ref[3],drop[1],drop[6],drop[7],
                ])
    for filename in files["itemSources"]:
        shard=load(path/filename)
        export.require(shard["schemaVersion"]=="1.0" and
            shard["snapshotId"]==1,"Bad reversed item source shard")
        for item_id,entry in shard["items"].items():
            export.normalized_id(item_id)
            export.require(item_id not in item_sources and
                int(item_id)//1000==shard["bucket"],"Duplicated item drop identity")
            item_sources[item_id]=entry
    export.require(set(item_sources)==set(source_direct)|set(source_group),
        "Missing/extra item reverse drop index")
    for item_id,reverse in item_sources.items():
        export.require(reverse["direct"]==source_direct.get(item_id,[]) and
            sorted(map(repr,reverse["group"]))==
            sorted(map(repr,source_group.get(item_id,[]))),
            "Reverse item/monster source links do not match original rows")
    export.require(len(item_sources)==manifest["reverseItemIds"] and
        sum(map(len,source_group.values()))==manifest["groupSourceJoins"],
        "Incomplete reverse item/group join counts")
    return {"monsters":len(index_ids),"originalCharacters":len(original_char_rows),
        "directDrops":len(directRows),"groupRefs":len(refRows),
        "groupDrops":len(dropRows),"groupBands":len(bandRows),
        "linkedItemIds":len(item_sources),
        "status":"ORIGINAL_SOURCE_RELATIONS_MATCH"}

def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate",type=Path,default=DEFAULT)
    parser.add_argument("--allow-absent",action="store_true")
    args=parser.parse_args(argv)
    try:
        if args.allow_absent and not args.candidate.exists():
            print("[IC] Optional original monster/drop candidate not published.")
            return 0
        result=validate(args.candidate)
        print("[IC] Original monster/drop source relations passed:",result)
        return 0
    except (OSError,ValueError,TypeError,KeyError,IndexError,
            json.JSONDecodeError) as error:
        print("[IC] ERROR: original monster/drop candidate rejected:",
              str(error)[:250],file=sys.stderr)
        return 1

if __name__=="__main__":
    raise SystemExit(main())
