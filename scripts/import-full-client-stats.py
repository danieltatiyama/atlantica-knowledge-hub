#!/usr/bin/env python3
"""Safely stage the verified Stage 20.31 ZIP as optional static client stats.

Run in a checkout of the Stage 20.33 publication branch:
  py scripts/import-full-client-stats.py "C:\path\Miner_AllStats_PublicCandidate_20_31.zip"

The importer validates the local ZIP, all 23,586 source index identities,
the 20.31 report and every one of the original 551 reviewed equipment
entries before publishing to the WORKING TREE. It never commits or pushes.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import re
import shutil
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
IMPORT_TARGET = ROOT / "public/data/client-items/stats"
ZIP_FOLDER = "Miner_AllStats_PublicCandidate_20_31"
MAX_FILE_SIZE = 3_000_000
MAX_TOTAL_SIZE = 12_000_000
MAX_ENTRY_COUNT = 40


def sibling(module_name: str, name: str):
    spec = importlib.util.spec_from_file_location(
        module_name, Path(__file__).with_name(name)
    )
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


audit = sibling("validate_full_client_stats_20_32", "validate-full-client-stats.py")
reviewed = sibling("verify_full_client_reviewed_20_33",
                   "verify-full-client-reviewed-stats.py")


def safe_name(name: str) -> str:
    # Windows Compress-Archive writes backslash-separated names; both forms
    # must remain constrained to one predictable source directory.
    fixed = name.replace("\\", "/")
    parts = fixed.split("/")
    audit.require(
        len(parts) in (1, 2)
        and (len(parts) == 1 or parts[0] == ZIP_FOLDER)
        and all(p not in ("", ".", "..") for p in parts)
        and re.fullmatch(r"(?:manifest|[0-2][0-9])\.json", parts[-1]) is not None,
        "ZIP contains an unexpected or potentially unsafe path",
    )
    return parts[-1]


def extract_candidate(archive: Path, staging: Path) -> None:
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist()
        audit.require(0 < len(entries) <= MAX_ENTRY_COUNT,
                      "Unexpected ZIP entry count")
        names = set()
        total = 0
        for info in entries:
            audit.require(
                not info.is_dir() and not (info.flag_bits & 1)
                and not ((info.external_attr >> 16) & 0o170000 == 0o120000)
                and 0 < info.file_size <= MAX_FILE_SIZE,
                "ZIP contains a directory, encrypted file, symlink or oversized entry",
            )
            name = safe_name(info.filename)
            audit.require(name not in names, "ZIP contains duplicate output files")
            names.add(name)
            total += info.file_size
            audit.require(total <= MAX_TOTAL_SIZE,
                          "ZIP exceeds the approved extracted size limit")
            with z.open(info) as src, (staging / name).open("xb") as dst:
                shutil.copyfileobj(src, dst, 1024 * 256)
        audit.require("manifest.json" in names, "ZIP candidate manifest missing")
        manifest = audit.read_json(staging / "manifest.json")
        audit.require(
            isinstance(manifest, dict)
            and isinstance(manifest.get("files"), list)
            and names == {"manifest.json", *manifest["files"]},
            "ZIP contents do not match the candidate manifest",
        )


def import_stats(archive: Path, *, dry_run: bool = False) -> dict:
    audit.require(archive.is_file() and not archive.is_symlink(),
                  "Source candidate ZIP not found")
    audit.require(not IMPORT_TARGET.exists(),
                  "Public stats directory already exists; refusing to overwrite")
    IMPORT_TARGET.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        dir=IMPORT_TARGET.parent, prefix=".all-client-stats-stage-"
    ) as root:
        staging = Path(root) / "stats"
        staging.mkdir()
        extract_candidate(archive, staging)
        result = audit.validate(
            staging, ROOT / "docs/Miner_AllStats_Report_20_31.json",
            ROOT / "public/data/client-items",
        )
        protected = reviewed.verify(staging)
        audit.require(
            result["candidateIds"] == 7560
            and result["sourceRows"] == 9351
            and protected["reviewedEquipmentIds"] == 551
            and protected["originalSourceRows"] == 1031,
            "Candidate or reviewed coverage diverges from snapshot 1",
        )
        if not dry_run:
            # Same-filesystem rename after the entire candidate has passed.
            staging.rename(IMPORT_TARGET)
    return {"result": result, "protected": protected,
            "publishedInWorkingTree": not dry_run}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zipfile", type=Path)
    parser.add_argument("--dry-run", action="store_true",
                        help="Audit the ZIP without modifying the repository")
    args = parser.parse_args(argv)
    try:
        result = import_stats(args.zipfile, dry_run=args.dry_run)
        print("[IC] Stage 20.33: 7,560 IDs; 9,351 numeric source rows.")
        print("[IC] 551 reviewed IDs and 1,031 previous rows unchanged.")
        if args.dry_run:
            print("[IC] DRY RUN: no data written to public/ or Git.")
        else:
            print("[IC] Files staged:", IMPORT_TARGET)
            print("[IC] No commit or push performed; inspect git status first.")
        return 0
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile,
            json.JSONDecodeError) as error:
        print("[IC] ERROR: source ZIP import BLOCKED:",
              str(error)[:240], file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
