# Stages 20.17–20.19 — Historical Wikidot equipment research in small batches

## Purpose and boundary

The Wiki now has **551 reviewed numeric item ID/name pairs** but only
**3 complete editorial equipment profiles** (Spirit Sword, Spirit Bow,
Spirit Instrument). The Stage 20.16 private review queue identifies
missing sections and **candidate** Wikidot URLs; it does not prove
that any source page exists.

Several Wikidot pages contain structured historical item data:
- https://atlantica-online.wikidot.com/item:spirit-bow
  — basic equipment type, level, class restrictions, +0..+10 stats,
  source boxes, production batch, workload, crafting skill and materials
- https://atlantica-online.wikidot.com/item:excalibur
  — +0..+10 and Legendary L, special effects and set bonus details
  (the present importer **does not** copy narrative effects or set text)

The Wikidot notice says content is licensed **CC BY-SA 3.0** unless
otherwise stated. Attribute sources and honor the applicable terms.
This importer extracts minimal numeric facts and short identifiers,
**not full articles or media**. Its proposal stays private until
explicit editorial review. Historic information is NOT a confirmed
current Atlantica Global fact.

## Stage 20.17: safe source audit

`scripts/audit-wikidot-item-pages.py` reads the Stage 20.16 private
queue, validates each reviewed numeric ID and constructed source URL,
and parses structured HTML pages into a **private historical draft**.

Extracted *candidate* fields:
- equipment type, minimum level, class restrictions
- all encountered +0..+10 and L numeric attack/STR/VIT/DEX/INT/DEF/MDEF
  source rows; no invented missing enchantment grades
- production per batch, workload, crafting skill and level
- material names and quantities
- source URL, raw HTML SHA-256 for source comparison, reported revision
  if present, historical/community evidence label

Everything else (narrative effects, images, Atlas, probabilities,
durability, merchant price, set descriptions, item model) is excluded
from the automated draft until independently modeled and reviewed.
Input is **untrusted HTML**; its content never runs JavaScript or
becomes active content in the public Wiki.

The process is **offline by default**. For local HTML, name files
`<itemId>.html` in the supplied folder, e.g. `400.html`
for Spirit Bow. This does not send requests.

Optional `--fetch` is an **explicit opt-in** for tiny batches:
- maximum 20 pages per call (5 by default)
- minimum 3 seconds between page requests
- checks `robots.txt`; if inaccessible or disallowed, fails closed
  and uses the offline mode instead
- exact HTTPS host only; redirect to another host is rejected
- no login, cookies, bypass, cache of full HTML or broad crawling
- a matching title only proves **source identity at retrieval time**,
  NOT editorial approval
- script does not edit, commit, push, scrape all 551, or publish

The audit results are written only to your local private path.

## Stage 20.18: explicit manual review and draft creation

`tools/wikidot-batch-review.html` is a fully offline review UI.
Load the audit JSON and review each item:
- type, level, classes, numeric source rows and materials
- choose which sections should be imported; none are preselected
- choose individual +0..+10 or L source grades; none are preselected
- separately confirm Legendary eligibility before any L row
- attest source was checked and that historical ≠ current
- provide a meaningful review note (20+ characters)
- export `Miner_Wikidot_Approvals_20_18.json` privately

`scripts/prepare-historical-item-profile-drafts.mjs` + CLI verify
every selected row against the source audit's item ID, exact existing
reviewed English name, URL and SHA-256, and enforce the current
strict public profile gate. A missing section stays absent. Published
item IDs are **never automatically overwritten or replaced**.

**Critical:** this workflow does not claim full-page accuracy by
itself. Only a reviewer can make source/field approval decisions.
Approval notes remain private and are not copied into the public
profile dataset. Approved historical stats show an appropriate
community-reference source label; no assumption that historical
stats are identical to modern gameplay.

## Stage 20.19: complete Windows PowerShell workflow

Run from the wiki repo root after the PR is merged:

```powershell
git pull origin main

# Opt-in: check at most 5 pages, with robots and request pacing
.\scripts\Start-WikidotBatchReview.ps1 -Online -Count 5 -StartIndex 0

# Alternative: use offline HTML already saved as <itemId>.html
.\scripts\Start-WikidotBatchReview.ps1 -HtmlDir ".\Wikidot_HTML" -Count 5

# The local offline HTML workbench opens automatically.
# Select Miner_Wikidot_Audit_20_17.json, review, and export:
# Miner_Wikidot_Approvals_20_18.json

# Recheck explicit approval and generated historical profiles
.\scripts\Finalize-WikidotBatchReview.ps1

# Only after inspecting approved sources and the draft:
.\scripts\Finalize-WikidotBatchReview.ps1 -WriteReviewed
```

The final command modifies **only your local**
`src/data/reviewed-equipment-profiles.json`, revalidates the entire
dataset, builds Astro and prints `git diff`. It NEVER commits, pushes,
merges or deploys. Open a normal GitHub PR for the batch after checking
the diff, citations and copyright obligations.

No new public historical item has been approved or published by
this infrastructure PR.

### Direct CLI alternatives

```powershell
node .\scripts\build-item-article-review-queue.mjs --output ".\Miner_Item_Article_Queue_20_16.json"

py .\scripts\audit-wikidot-item-pages.py ".\Miner_Item_Article_Queue_20_16.json" --fetch --max-pages 5 --start 0 --delay 3 --output ".\Miner_Wikidot_Audit_20_17.json"

Start-Process ".\tools\wikidot-batch-review.html"

node .\scripts\build-historical-item-profile-draft.mjs ".\Miner_Wikidot_Audit_20_17.json" ".\Miner_Wikidot_Approvals_20_18.json" --output ".\Miner_Wikidot_Draft_20_18.json"
node .\scripts\check-reviewed-item-profiles.mjs ".\Miner_Wikidot_Draft_20_18.json"
node .\scripts\promote-reviewed-wikidot-batch.mjs ".\Miner_Wikidot_Audit_20_17.json" ".\Miner_Wikidot_Approvals_20_18.json"
```

## QA and provenance

- `tests/test_audit_wikidot_item_pages.py`: synthetic HTML with +0,
  +1, +10, L, thousands separators, classes, crafting, materials,
  spoofed titles, conflicting rows, untrusted URLs and offline mode.
- `tests/historical-item-profile-drafts.test.mjs`: explicit
  source/section/grade consent, identity and hash matching,
  append-only behavior, ordinary vs L, private reviewer notes,
  no unsupported data, and offline JS syntax/CSP.
- GitHub CI exercises both plus the existing Python Miner, Node public
  schema/Legendary regressions, and Astro static build.
- Public stats retain evidence `community-reference`, not
  `ingame-screenshot`, and no automatic extrapolation if source rows
  have gaps.
- Input files `Miner_Wikidot_*.json` and the HTML directory remain
  private and git-ignored.
- For collisions between client data, Wikidot, and current tooltip
  observations: retain each source separately and escalate for
  review rather than overwriting or silently merging.

## Next actual input boundary

After this code is merged, the user's first real action is to run
a short audit locally and **approve specific item sections** in the
offline workbench. The assistant cannot access the user's private
Miner SQLite or impersonate the reviewer; publication must not
be treated as completed without those decisions. Repeating hundreds
of automatic retrievals without checking access rules is not part
of this release.
