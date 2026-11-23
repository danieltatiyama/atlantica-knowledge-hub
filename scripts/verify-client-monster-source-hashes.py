#!/usr/bin/env python3
"""Stage 20.40: pin exact original uploaded ZIP JSON bytes with SHA-256.

The original Windows files have one terminal CRLF and no internal newlines.
Git may normalize ONLY that terminal CRLF to LF. Restore it before hashing.
No changes to numeric values, item IDs, groups, names or other whitespace
are permitted. This script never modifies candidate source files.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
DEFAULT=ROOT/"public"/"data"/"client-monsters"
APPROVED=ROOT/"docs"/"MonsterLoot_ApprovedSHA256_20_40.json"

def require(ok,why):
    if not ok:
        raise ValueError(why)

def check(path:Path,approved:Path=APPROVED):
    pin=json.loads(approved.read_text(encoding="utf-8"))
    require(pin.get("schemaVersion")=="20.40-sha256" and
            pin.get("dataset")=="all-client-monster-loot-original" and
            pin.get("snapshotId")==1 and
            pin.get("approvedFiles")==53,
            "Approved original ZIP pin is missing or incompatible")
    manifest=json.loads((path/"manifest.json").read_text(encoding="utf-8"))
    require(manifest.get("schemaVersion")=="1.0" and
            manifest.get("snapshotId")==1 and
            manifest.get("dataset")==pin["dataset"],
            "Monster snapshot identity mismatch")
    for key in ("catalogMonsterIds","directSourceRows","groupReferenceRows",
                "groupDropRows","groupBandRows","reverseItemIds","groupSourceJoins"):
        require(manifest.get(key)==pin[key],"Source coverage mismatch: "+key)
    files=manifest.get("files")
    require(isinstance(files,dict) and
            set(files)=={"index","characters","loot","groups","itemSources"},
            "Original source shard groups changed")
    patterns={
        "index":r"index-[0-9]{2}\.json",
        "characters":r"characters/[0-9]{2}\.json",
        "loot":r"loot/[0-9]{2}\.json",
        "groups":r"groups/[0-9]{2}\.json",
        "itemSources":r"item-sources/[0-9]{2}\.json",
    }
    expected=["manifest.json"]
    for group,entries in files.items():
        require(isinstance(entries,list) and len(entries)==len(set(entries)) and
                all(isinstance(e,str) and re.fullmatch(patterns[group],e)
                    for e in entries), "Unsafe or duplicate source filename")
        expected.extend(entries)
    require(len(expected)==len(set(expected))==pin["approvedFiles"],
            "Unexpected original source JSON file count")
    actual={e.relative_to(path).as_posix() for e in path.rglob("*") if e.is_file()}
    require(actual==set(expected), "Missing or additional monster source JSON")
    require(not any(e.is_symlink() for e in path.rglob("*")),
            "Symlink prohibited in source data")
    stream=hashlib.sha256()
    normalized=0
    for name in sorted(expected):
        data=(path/name).read_bytes()
        require(len(data)>2 and data.count(b"\n")==1 and
                data.endswith((b"\r\n",b"\n")),
                "Unexpected original JSON newline layout: "+name)
        if data.endswith(b"\r\n"):
            require(data.count(b"\r")==1,
                    "Unexpected internal CR: "+name)
        else:
            require(b"\r" not in data, "Unexpected internal CR: "+name)
            data=data[:-1]+b"\r\n"
            normalized+=1
        stream.update(name.encode("utf-8")+b"\0"+data)
    require(stream.hexdigest()==pin["originalFileStreamSha256"],
            "Original ZIP SHA-256 aggregate mismatch: source content changed")
    return {
        "status":"APPROVED_ORIGINAL_ZIP_BYTES_EXACT_OR_GIT_TERMINAL_LF",
        "sourceFiles":len(expected),
        "gitTerminalLFAdjusted":normalized,
        "digest":stream.hexdigest(),
    }

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--candidate",type=Path,default=DEFAULT)
    p.add_argument("--approved",type=Path,default=APPROVED)
    p.add_argument("--allow-absent",action="store_true")
    args=p.parse_args(argv)
    try:
        if args.allow_absent and not args.candidate.exists():
            print("[IC] Original monster source ZIP JSONs not yet published.")
            return 0
        print("[IC] Original source hash verification:",check(args.candidate,args.approved))
        return 0
    except (OSError,ValueError,TypeError,KeyError,json.JSONDecodeError) as err:
        print("[IC] ERROR: original monster source hashes rejected:",
              str(err)[:300],file=sys.stderr)
        return 1

if __name__=="__main__":
    raise SystemExit(main())
