#!/usr/bin/env python3
"""Stage 20.17: cautiously audit historical Wikidot item pages in small batches.

Read a 20.16 private review queue and collect only structured numerical facts
from site pages. Output is a PRIVATE proposal for human source review, NOT a
public Wiki dataset. No auto-approvals, commits, scraping loops or client data.

Default: offline HTML files named <item_id>.html under --html-dir.
Opt-in --fetch: robots.txt permission required; max 20 pages; >= 3 s pacing;
same-host HTTPS only; no cookie, session, tracking or site modifications.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import (
    HTTPRedirectHandler, Request, build_opener, urlopen
)
from urllib.robotparser import RobotFileParser

HOST = "atlantica-online.wikidot.com"
ORIGIN = "https://" + HOST
USER_AGENT = "AtlanticaKnowledgeHub-SourceAudit/0.1 (small human-reviewed batches)"
GRADE = re.compile(r"^(?:\+([0-9]|10)|L)$", re.I)
INT = re.compile(r"^[0-9]{1,3}(?:,[0-9]{3})*$|^[0-9]+$")
ATTACK = re.compile(r"^([0-9][0-9,]*)\s*[-–]\s*([0-9][0-9,]*)$")
REV = re.compile(r"page revision:\s*(\d+)", re.I)
HEADERS = {
    "strength": "strength", "vitality": "vitality",
    "dexterity": "dexterity", "intelligence": "intelligence",
    "defense": "defense", "magic defense": "magicDefense",
}
MAX_HTML_BYTES = 1_500_000
MAX_QUEUE = 60000


def clean(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    return clean("".join(ch for ch in value if not unicodedata.combining(ch))).casefold()


def candidate_slug(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def valid_url(url: str, expected_name: str) -> bool:
    if not isinstance(url, str):
        return False
    p = urlsplit(url)
    return (p.scheme == "https" and p.hostname == HOST and
            p.username is None and p.password is None and
            p.port is None and not p.query and not p.fragment and
            p.path == "/item:" + candidate_slug(expected_name))


def integer(value: str) -> int | None:
    value = clean(value)
    return int(value.replace(",", "")) if INT.fullmatch(value) else None


class WikidotHtmlParser(HTMLParser):
    """Only page-content block text and semantic table cells; no scripts."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool]] = []
        self.in_content = False
        self.title_text = ""
        self._title = False
        self._heading: list[str] | None = None
        self._block: list[str] | None = None
        self._cell: list[str] | None = None
        self._row: list[str] | None = None
        self._table: list[list[str]] | None = None
        self.section = ""
        self.blocks: list[str] = []
        self.tables: list[dict] = []
        self.all_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        opening = (tag == "div" and attrs_dict.get("id") == "page-content")
        self.stack.append((tag, opening))
        if opening:
            self.in_content = True
        if tag == "title":
            self._title = True
        if not self.in_content:
            return
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._heading = []
        elif tag in ("p", "li"):
            self._block = []
        elif tag == "br" and self._block is not None:
            # Wikidot often puts Type, Level and Restrictions into one
            # paragraph separated only by <br> tags.
            self._block.append("\n")
        elif tag == "table":
            self._table = []
        elif tag == "tr" and self._table is not None:
            self._row = []
        elif tag in ("th", "td") and self._row is not None:
            self._cell = []

    def handle_data(self, data: str) -> None:
        if self._title:
            self.title_text += data
        if clean(data):
            self.all_text.append(clean(data))
        if not self.in_content:
            return
        for buffer in (self._heading, self._block, self._cell):
            if buffer is not None:
                buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._title = False
        if self.in_content:
            if tag in ("th", "td") and self._cell is not None:
                if self._row is not None:
                    self._row.append(clean("".join(self._cell)))
                self._cell = None
            elif tag == "tr" and self._row is not None:
                if self._table is not None and self._row:
                    self._table.append(self._row)
                self._row = None
            elif tag == "table" and self._table is not None:
                self.tables.append({"section": self.section, "rows": self._table})
                self._table = None
            if tag in ("p", "li") and self._block is not None:
                for line in "".join(self._block).splitlines():
                    value = clean(line)
                    if value:
                        self.blocks.append(value)
                self._block = None
            if tag in ("h1", "h2", "h3", "h4", "h5", "h6") and self._heading is not None:
                self.section = clean("".join(self._heading)).casefold()
                self._heading = None
        # Content nesting uses the actual element stack, not a global div
        # counter (tables may contain unrelated nested div elements).
        if self.stack:
            match_at = next((i for i in range(len(self.stack)-1, -1, -1)
                             if self.stack[i][0] == tag), None)
            if match_at is not None:
                closed = self.stack[match_at:]
                self.stack = self.stack[:match_at]
                if any(flag for _, flag in closed):
                    self.in_content = False


def parse_stats(tables: list[dict]) -> list[dict]:
    result: dict[str, dict] = {}
    for table in tables:
        rows = table["rows"]
        if not rows:
            continue
        header = [clean(v).casefold() for v in rows[0]]
        if not header or "enchant" not in header[0]:
            continue
        columns: list[tuple[int, str]] = []
        for index, text in enumerate(header):
            label = clean(text)
            if label == "attack power":
                columns.append((index, "attack"))
            else:
                target = HEADERS.get(label)
                if target:
                    columns.append((index, target))
        for row in rows[1:]:
            if not row or not GRADE.fullmatch(clean(row[0])):
                continue
            raw = clean(row[0])
            grade = "L" if raw.upper() == "L" else int(raw[1:])
            out = {"enchantLevel": grade}
            for index, field in columns:
                if index >= len(row):
                    continue
                if field == "attack":
                    match = ATTACK.fullmatch(clean(row[index]))
                    if match:
                        minimum, maximum = integer(match[1]), integer(match[2])
                        if minimum is not None and maximum is not None and minimum <= maximum:
                            out["attackMin"], out["attackMax"] = minimum, maximum
                else:
                    number = integer(row[index])
                    if number is not None:
                        out[field] = number
            if len(out) > 1:
                key = str(grade)
                if key in result and result[key] != out:
                    raise ValueError("Conflicting stat rows for one enchantment grade")
                result[key] = out
    return [result[k] for k in sorted(result, key=lambda x: 11 if x == "L" else int(x))]


def parse_page(html: str, expected_name: str, source_url: str) -> dict:
    """Read structured facts only. Title match is NOT editorial acceptance."""
    parser = WikidotHtmlParser()
    parser.feed(html)
    title = clean(parser.title_text)
    name = re.sub(r"\s*[-|]\s*Atlantica Online Wiki.*$", "", title, flags=re.I).strip()
    if normalize_name(name) != normalize_name(expected_name):
        return {
            "status": "title-mismatch", "titleMatches": False,
            "overview": None, "stats": [], "crafting": None,
            "materials": [], "sourceUrl": source_url,
            "sourceRevision": None,
        }
    if not parser.tables and not parser.blocks:
        status = "needs-manual-parse"
    else:
        status = "historical-draft"
    overview = {}
    for block in parser.blocks:
        v = re.match(r"^(?:type)\s*:\s*(.+)$", block, re.I)
        if v:
            overview["typeEn"] = clean(v[1])
        v = re.match(r"^(?:min(?:imum)?\.?\s*level)\s*:\s*(\d+)$", block, re.I)
        if v:
            overview["minimumLevel"] = int(v[1])
        v = re.match(r"^(?:restrictions)\s*:\s*(.*?)\s*classes\s+only$", block, re.I)
        if v:
            overview["eligibleClasses"] = [
                clean(s) for s in v[1].split("/") if clean(s)
            ]
    crafting = {}
    for block in parser.blocks:
        v = re.search(r"production\s+rate\s*:\s*(\d+)\s*per batch", block, re.I)
        if v:
            crafting["productionPerBatch"] = int(v[1])
        v = re.search(r"required\s+workload\s*:\s*([\d,]+)", block, re.I)
        if v:
            number = integer(v[1])
            if number is not None:
                crafting["requiredWorkload"] = number
        v = re.search(r"required\s+(.+?)\s+skill\s*:\s*(\d+)", block, re.I)
        if v:
            crafting["requiredSkill"] = {"nameEn":clean(v[1]), "level":int(v[2])}
    materials=[]
    for table in parser.tables:
        if not table["rows"]:
            continue
        header = [clean(v).casefold() for v in table["rows"][0]]
        if len(header) < 2 or header[0] != "material" or header[1] != "need":
            continue
        for row in table["rows"][1:]:
            if len(row) >= 2 and clean(row[0]) and integer(row[1]) is not None:
                materials.append({"nameEn":clean(row[0]),"quantity":integer(row[1])})
    revision = REV.search(" ".join(parser.all_text[-100:]))
    return {
        "status": status, "titleMatches": True,
        "overview": overview or None,
        "stats":parse_stats(parser.tables),
        "crafting": crafting or None,
        "materials": materials,
        "sourceUrl": source_url,
        "sourceRevision": int(revision.group(1)) if revision else None,
    }


def validate_queue(queue: dict) -> list[dict]:
    if not isinstance(queue, dict) or queue.get("queueVersion") != "20.16-private" or (
        not isinstance(queue.get("items"), list) or
        len(queue["items"]) > MAX_QUEUE
    ):
        raise ValueError("Unsupported item review queue version")
    seen = set()
    valid = []
    for row in queue["items"]:
        if not isinstance(row, dict):
            raise ValueError("Invalid queue row")
        item_id, name, url = row.get("itemId"), row.get("nameEn"), row.get("wikidotCandidateUrl")
        if not isinstance(item_id, str) or not re.fullmatch(r"[1-9][0-9]*", item_id) or (
            item_id in seen or not isinstance(name, str) or
            not name or not valid_url(url, name)
        ):
            raise ValueError("Unsafe or conflicting item identity/URL in review queue")
        seen.add(item_id)
        valid.append(row)
    return valid


class SameHostRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        p = urlsplit(newurl)
        if p.scheme != "https" or p.hostname != HOST or p.port is not None or (
            p.username or p.password
        ):
            raise ValueError("Cross-origin or insecure Wikidot redirect blocked")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch_bytes(url: str, opener) -> bytes:
    with opener.open(Request(url, headers={
        "User-Agent": USER_AGENT, "Accept": "text/html",
    }), timeout=15) as response:
        payload = response.read(MAX_HTML_BYTES + 1)
        if len(payload) > MAX_HTML_BYTES:
            raise ValueError("Source page exceeds bounded HTML limit")
        return payload


def robots_permission(opener) -> RobotFileParser:
    url = ORIGIN + "/robots.txt"
    try:
        data = fetch_bytes(url, opener)
    except HTTPError as exc:
        if exc.code != 404:
            raise
        data = b""  # RFC robots: 404 means no rules; other errors fail closed.
    rules = RobotFileParser()
    rules.set_url(url)
    rules.parse(data.decode("utf-8", "replace").splitlines())
    return rules


def run(queue: dict, html_dir: Path | None, fetch: bool, max_pages: int,
        start: int, delay: float) -> dict:
    rows = validate_queue(queue)
    if start < 0 or max_pages < 1 or max_pages > 20 or delay < 3:
        raise ValueError("Batch limits: max 20 pages, >=3 seconds between HTTP requests")
    if not fetch and html_dir is None:
        raise ValueError("Offline audit requires a local HTML directory")
    candidates = [r for r in rows if not (
        r.get("completeness", {}).get("overview") and
        r.get("completeness", {}).get("enchantStats") and
        r.get("completeness", {}).get("crafting") and
        r.get("completeness", {}).get("materials")
    )][start:start+max_pages]
    opener = build_opener(SameHostRedirects())
    robots = robots_permission(opener) if fetch else None
    entries = []
    last_request = None
    for row in candidates:
        url = row["wikidotCandidateUrl"]
        entry = {
            "itemId": row["itemId"], "reviewedNameEn": row["nameEn"],
            "sourceUrl": url, "sourceKind": "historical-community",
            "editoriallyApproved": False, "wikidotUrlVerified": False
        }
        try:
            if fetch:
                if not robots.can_fetch(USER_AGENT, url):
                    entry["status"] = "robots-disallowed"
                    entries.append(entry)
                    continue
                if last_request is not None:
                    time.sleep(max(0.0, delay-(time.monotonic()-last_request)))
                last_request = time.monotonic()
                raw = fetch_bytes(url, opener)
            else:
                if html_dir is None:
                    raise ValueError("Offline mode needs --html-dir")
                path = html_dir / (row["itemId"] + ".html")
                if not path.is_file():
                    entry["status"] = "html-not-provided"
                    entries.append(entry)
                    continue
                if path.stat().st_size > MAX_HTML_BYTES:
                    raise ValueError("Oversized HTML file")
                raw = path.read_bytes()
            parsed = parse_page(raw.decode("utf-8", "replace"), row["nameEn"], url)
            entry.update(parsed)
            entry["sourceSha256"] = hashlib.sha256(raw).hexdigest()
            entry["wikidotUrlVerified"] = bool(fetch and parsed["titleMatches"])
        except (HTTPError, URLError, TimeoutError):
            entry["status"] = "fetch-unavailable"
        except (OSError, UnicodeError, ValueError):
            entry["status"] = "parse-or-source-blocked"
        entries.append(entry)

    return {
        "reviewVersion": "20.17-private",
        "generatedAtUtc": datetime.now(timezone.utc).replace(microsecond=0)
            .isoformat().replace("+00:00", "Z"),
        "sourceSite": ORIGIN,
        "sourceLicenseNotice": "Wikidot community content: CC BY-SA 3.0; attribute sources; do not copy articles/images",
        "mode": "bounded-fetch" if fetch else "local-html",
        "allRowsAreHistoricalUnverified": True,
        "entries": entries,
        "summary": {
            "itemsRequested": len(candidates),
            "fetchedAndTitleMatched": sum(1 for x in entries if x["wikidotUrlVerified"]),
            "parsedHistoricalDrafts": sum(1 for x in entries if x.get("status") == "historical-draft"),
            "pendingReview": len(entries),
        }
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("queue", type=Path, help="Private 20.16 item review queue JSON")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--html-dir", type=Path, help="Offline saved HTML, one <item_id>.html file per item")
    src.add_argument("--fetch", action="store_true", help="Opt-in bounded, robots-compliant HTTPS fetch")
    parser.add_argument("--max-pages", type=int, default=5)
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--delay", type=float, default=3.0)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        if args.output.resolve() == args.queue.resolve():
            raise ValueError("Never replace the original review queue")
        if args.html_dir is not None and not args.html_dir.is_dir():
            raise ValueError("Offline HTML directory unavailable")
        queue = json.loads(args.queue.read_text(encoding="utf-8"))
        report = run(queue, args.html_dir, args.fetch, args.max_pages, args.start, args.delay)
        args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print("[IC] Historical page candidates processed:", report["summary"]["itemsRequested"])
        print("[IC] Source title matches (NOT editorial approval):", report["summary"]["fetchedAndTitleMatched"])
        print("[IC] Historical draft records:", report["summary"]["parsedHistoricalDrafts"])
        print("[IC] Output is PRIVATE and unapproved. Nothing published.")
        return 0
    except (OSError, ValueError, TypeError, json.JSONDecodeError, HTTPError, URLError):
        print("[IC] ERROR: Batch audit blocked. Check inputs, robots or source access.",file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
