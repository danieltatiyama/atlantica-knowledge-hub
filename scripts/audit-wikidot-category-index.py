#!/usr/bin/env python3
"""Stage 20.20 — audit Wikidot category INDEX tables for +0 item facts.

Several individual URLs are absent, while category indexes such as
/item:axe and /item:armor contain many named equipment rows. Join those
rows against the existing reviewed 551-ID/name dictionary, but DO NOT
infer IDs or classes from an index. Output is compatible with the same
private 20.17 review UI and explicit-approval compiler.

Offline first, online only with --fetch and robots permission. At most
5 category pages, 3+ second pacing, 20 item proposals per invocation.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import build_opener

ROOT_SCRIPT = Path(__file__).with_name("audit-wikidot-item-pages.py")
SPEC = importlib.util.spec_from_file_location("historical_item_audit", ROOT_SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Stage 20.17 source parser is required")
CORE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CORE)

CATEGORIES = {
    "axe": "Axe", "spear": "Spear", "sword": "Sword",
    "bow": "Bow", "gun": "Gun", "staff": "Staff",
    "armor": "Armor", "helmet": "Helmet",
    "gauntlet": "Gauntlet", "orb": "Orb",
    "power-saw": "Power Saw", "instrument": "Instrument",
    "shield": "Shield",
}


def parse_index_html(html: str, category: str) -> list[dict]:
    """One row per matching NAME, never a fabricated item identity."""
    if category not in CATEGORIES:
        raise ValueError("Unrecognized fixed Wikidot category")
    p = CORE.WikidotHtmlParser()
    p.feed(html)
    title = CORE.clean(p.title_text)
    name = re.sub(r"\s*[-|]\s*Atlantica Online Wiki.*$", "", title, flags=re.I).strip()
    if CORE.normalize_name(name) != CORE.normalize_name(CATEGORIES[category]):
        raise ValueError("Wrong Wikidot category page title")
    items = []
    for table in p.tables:
        rows = table["rows"]
        if not rows:
            continue
        headings = [CORE.clean(v).casefold() for v in rows[0]]
        if not headings or headings[0] != "item":
            continue
        parsed_cols = []
        level_index = None
        for idx, heading in enumerate(headings):
            if heading in ("min. level", "minimum level", "level"):
                level_index = idx
            elif heading == "attack power":
                parsed_cols.append((idx, "attack"))
            elif heading in CORE.HEADERS:
                parsed_cols.append((idx, CORE.HEADERS[heading]))
        for row in rows[1:]:
            if len(row) <= 1 or not CORE.clean(row[0]):
                continue
            item_name = CORE.clean(row[0])
            minimum = (
                CORE.integer(row[level_index]) if
                level_index is not None and level_index < len(row)
                else None
            )
            stats = {"enchantLevel": 0}
            for index, field in parsed_cols:
                if index >= len(row):
                    continue
                if field == "attack":
                    value = CORE.ATTACK.fullmatch(CORE.clean(row[index]))
                    if value:
                        lo, hi = CORE.integer(value[1]), CORE.integer(value[2])
                        if lo is not None and hi is not None and lo <= hi:
                            stats["attackMin"], stats["attackMax"] = lo, hi
                else:
                    value = CORE.integer(row[index])
                    if value is not None:
                        stats[field] = value
            if len(stats) > 1:
                items.append({
                    "name": item_name,
                    "minimumLevel": minimum,
                    "stats": stats,
                })
    return items


def audit_indexes(queue: dict, inputs: dict[str, bytes],
                  max_entries: int = 20, offset: int = 0,
                  online: bool = False) -> dict:
    rows = CORE.validate_queue(queue)
    if max_entries < 1 or max_entries > 20 or offset < 0:
        raise ValueError("Private audit limits: max 20 records, offset >= 0")
    names_by_key = defaultdict(list)
    for row in rows:
        if all(row.get("completeness",{}).get(k) for k in (
            "overview","enchantStats","crafting","materials"
        )):
            continue
        names_by_key[CORE.normalize_name(row["nameEn"])].append(row)
    collisions = {key for key, values in names_by_key.items() if len(values)>1}
    potential: dict[str, dict] = {}
    conflicted: set[str] = set()
    matched = 0
    seen_unmatched = 0
    for category, data in inputs.items():
        if category not in CATEGORIES or len(data) > CORE.MAX_HTML_BYTES:
            raise ValueError("Invalid source category or HTML size")
        entries = parse_index_html(data.decode("utf-8","replace"), category)
        url = CORE.ORIGIN + "/item:" + category
        source_hash = hashlib.sha256(data).hexdigest()
        for fact in entries:
            lookup = CORE.normalize_name(fact["name"])
            choices = names_by_key.get(lookup,[])
            if not choices:
                seen_unmatched += 1
                continue
            if lookup in collisions:
                conflicted.add(lookup)
                continue
            row = choices[0]
            item_id = row["itemId"]
            matched += 1
            if item_id in potential:
                # Never silently pick between two category indexes or two
                # identically named but different item rows.
                conflicted.add(item_id)
                continue
            potential[item_id] = {
                "itemId": item_id,
                "reviewedNameEn": row["nameEn"],
                "sourceUrl": url,
                "sourceKind": "historical-community",
                "sourceScope": "category-index",
                "categoryLabel": CATEGORIES[category],
                "indexedMinimumLevel": fact["minimumLevel"],
                "editoriallyApproved": False,
                "wikidotUrlVerified": False,
                "titleMatches": True,  # TITLE OF CATEGORY, item ROW matched separately
                "itemNameMatchedInIndex": True,
                "status": "historical-draft",
                "sourceSha256": source_hash,
                "sourceRevision": None,
                "overview": None,  # Unknown class restrictions: never invent them
                "stats": [fact["stats"]],
                "crafting": None,
                "materials": [],
            }
    unique_entries = [
        value for item_id, value in sorted(potential.items(),key=lambda x:int(x[0]))
        if item_id not in conflicted
    ]
    picked = unique_entries[offset:offset+max_entries]
    return {
        "reviewVersion": "20.17-private",  # Reuses strict Stage 20.18 workbench
        "generatedAtUtc": datetime.now(timezone.utc).replace(microsecond=0)
            .isoformat().replace("+00:00","Z"),
        "sourceSite": CORE.ORIGIN,
        "sourceLicenseNotice": "Wikidot community: CC BY-SA 3.0; category index numeric rows only",
        "mode": "category-index-bounded-fetch" if online else "category-index-local",
        "allRowsAreHistoricalUnverified": True,
        "entries": picked,
        "summary": {
            "categoryPagesParsed": len(inputs),
            "categoryRowsMatchedToReviewedNames": matched,
            "itemNameCollisionsWithheld": len(conflicted),
            "uniqueHistoricalCandidates": len(unique_entries),
            "itemProposalsInThisBatch": len(picked),
            "remainingAfterThisBatch": max(0,len(unique_entries)-offset-len(picked)),
            "unmatchedCategoryRows": seen_unmatched,
            "pendingReview": len(picked),
        },
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("queue", type=Path)
    parser.add_argument("--categories", required=True,
                        help="Comma-separated fixed slugs, e.g. axe,armor,gun")
    input_mode = parser.add_mutually_exclusive_group(required=True)
    input_mode.add_argument("--html-dir", type=Path)
    input_mode.add_argument("--fetch", action="store_true")
    parser.add_argument("--max-entries",type=int,default=20)
    parser.add_argument("--offset",type=int,default=0)
    parser.add_argument("--delay",type=float,default=3.0)
    parser.add_argument("--output",type=Path,required=True)
    args = parser.parse_args(argv)
    try:
        categories=[s.strip() for s in args.categories.split(",")]
        if not categories or len(categories)>5 or len(set(categories))!=len(categories) or (
            any(category not in CATEGORIES for category in categories)
        ):
            raise ValueError("Choose 1-5 unique supported category slugs")
        if args.max_entries<1 or args.max_entries>20 or args.offset<0 or args.delay<3:
            raise ValueError("Unsafe category batch count, offset or pacing")
        if args.output.resolve()==args.queue.resolve():
            raise ValueError("Never overwrite the source item queue")
        if args.html_dir is not None and not args.html_dir.is_dir():
            raise ValueError("Offline category HTML directory unavailable")
        queue=json.loads(args.queue.read_text(encoding="utf-8"))
        CORE.validate_queue(queue)
        sources={}
        opener=build_opener(CORE.SameHostRedirects())
        robots=CORE.robots_permission(opener) if args.fetch else None
        last_request=None
        for category in categories:
            url=CORE.ORIGIN+"/item:"+category
            if args.fetch:
                if not robots.can_fetch(CORE.USER_AGENT,url):
                    raise ValueError("Category page robots permission denied")
                if last_request is not None:
                    time.sleep(max(0.0,args.delay-(time.monotonic()-last_request)))
                last_request=time.monotonic()
                raw=CORE.fetch_bytes(url,opener)
            else:
                file=args.html_dir/(category+".html")
                if not file.is_file() or file.stat().st_size>CORE.MAX_HTML_BYTES:
                    raise ValueError("Missing or oversized category HTML source")
                raw=file.read_bytes()
            sources[category]=raw
        result=audit_indexes(queue,sources,args.max_entries,args.offset,args.fetch)
        args.output.write_text(
            json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        s=result["summary"]
        print("[IC] Category index pages read:",s["categoryPagesParsed"])
        print("[IC] Unique reviewed item candidates:",s["uniqueHistoricalCandidates"])
        print("[IC] Conflicts withheld:",s["itemNameCollisionsWithheld"])
        print("[IC] THIS PRIVATE BATCH:",s["itemProposalsInThisBatch"])
        print("[IC] Historical source index only; NOTHING approved or published.")
        return 0
    except (OSError,ValueError,TypeError,HTTPError,URLError,json.JSONDecodeError):
        print("[IC] ERROR: Category index audit blocked. Check titles, robots or local source.",file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
