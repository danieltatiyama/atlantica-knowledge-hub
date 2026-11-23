#!/usr/bin/env python3
"""Stage 20.33: confirm the exact 29 JSON files from the user's audited ZIP.

Check SHA-256 against the original user-supplied ZIP, allowing only the
single terminal CRLF to LF normalization performed by Git on Windows. This is distinct from the aggregate/identity and
551 reviewed-source comparison gates, which must also pass.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
APPROVAL = ROOT / "docs/Miner_AllStats_ApprovedSHA256_20_33.json"


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def require(condition: bool, reason: str):
    if not condition:
        raise ValueError(reason)


def verify(candidate: Path, approval: Path = APPROVAL) -> dict:
    expected = read_json(approval)
    require(
        isinstance(expected, dict)
        and set(expected) == {
            "schemaVersion", "dataset", "snapshotId", "source",
            "approvedFiles", "items", "sourceRows", "zipSha256", "fileSha256"
        }
        and expected["schemaVersion"] == "20.33-sha256"
        and expected["dataset"] == "all-client-item-raw-stats"
        and expected["snapshotId"] == 1
        and expected["approvedFiles"] == 29
        and expected["items"] == 7560
        and expected["sourceRows"] == 9351,
        "Unexpected approved-source checksum manifest",
    )
    sha = expected["fileSha256"]
    require(
        isinstance(sha, dict) and len(sha) == 29
        and "manifest.json" in sha
        and all(isinstance(name, str)
                and re.fullmatch(r"(?:manifest|[0-2][0-9])\.json", name)
                and isinstance(value, str)
                and re.fullmatch(r"[0-9a-f]{64}", value)
                for name, value in sha.items()),
        "Malformed audited original source file hash list",
    )
    require(candidate.is_dir() and not candidate.is_symlink(),
            "Audited candidate directory unavailable")
    require(
        {p.name for p in candidate.iterdir()} == set(sha),
        "Candidate contents differ from the original approved ZIP file list",
    )
    for name, expected_hash in sorted(sha.items()):
        path = candidate / name
        require(path.is_file() and not path.is_symlink(),
                "Unexpected candidate source file type: " + name)
        data = path.read_bytes()
        exact_match = hashlib.sha256(data).hexdigest() == expected_hash
        # The provided ZIP uses precisely ONE trailing CRLF per JSON.
        # Git's text normalization may replace only that terminal CRLF
        # with LF. Reconstitute that original byte sequence and verify
        # the SAME previously pinned original SHA-256; this does not
        # allow different JSON content, whitespace, or internal newlines.
        normalized_lf = (
            not exact_match
            and data.endswith(b"\n")
            and data.count(b"\n") == 1
            and b"\r" not in data
            and hashlib.sha256(data[:-1] + b"\r\n").hexdigest() == expected_hash
        )
        require(
            exact_match or normalized_lf,
            "Original ZIP SHA256 mismatch for source file: " + name,
        )
    return {"originalFiles": len(sha), "candidateIds": 7560,
            "originalSourceRows": 9351, "status": "MATCHES_USER_ZIP_EXACT_OR_GIT_TERMINAL_LF"}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path,
                        default=ROOT / "public/data/client-items/stats")
    parser.add_argument("--allow-absent", action="store_true")
    args = parser.parse_args(argv)
    try:
        if not args.candidate.exists() and args.allow_absent:
            print("[IC] Optional stats not published; original ZIP hashes waiting.")
            return 0
        result = verify(args.candidate)
        print("[IC] SHA-256 verified:", result["originalFiles"],
              "approved original JSON files (exact or Git terminal LF-normalized).")
        return 0
    except (OSError, ValueError, KeyError, TypeError,
            json.JSONDecodeError) as error:
        print("[IC] ERROR: published candidate differs from audited source ZIP:",
              str(error)[:240], file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
