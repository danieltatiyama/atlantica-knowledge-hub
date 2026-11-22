# Stage 20.20 — Wikidot category index fallback for item base stats

## Why

Some individual historical Wikidot links are not reliably accessible.
The site's **category list pages**, however, include multiple equipment
rows in a single structured table. Independently inspected examples:

- https://atlantica-online.wikidot.com/item:axe
  — Spirit Axe +0 attack **60–130**, Strength **7**, Vitality **6**,
  minimum level **1**
- https://atlantica-online.wikidot.com/item:armor
  — Spirit Armor +0 Defense **150**, Vitality **5**,
  Magic Defense **5**, minimum level **1**
- https://atlantica-online.wikidot.com/item:gun
  — Spirit Rifle +0 attack **50–60**, Dexterity **8**
- https://atlantica-online.wikidot.com/item:spear
  — Spirit Spear +0 attack **80–110**, Strength **11**,
  Vitality **3**

These are historical community data, not automatically current
Atlantica Global stats. Category rows normally **do not establish
classes, full crafting recipes, item IDs or enchantment grades**.

## Implementation

`scripts/audit-wikidot-category-index.py` uses the same small
offline-first `WikidotHtmlParser` as Stage 20.17, but accepts only
whitelisted equipment index categories (sword, spear, axe, bow, armor,
gun, staff, shield, etc.) and parses `Item | Min. Level | ...` tables.

The parser builds item name -> fact candidates, then matches them only
to the **already-reviewed 551-item ID/name registry**. It cannot
create new item IDs. Name collisions and duplicate source definitions
are **quarantined** rather than guessed.

The audit explicitly marks `sourceScope: category-index` and
`itemNameMatchedInIndex: true`. The approved public draft compiler
requires those fields for such sources, with the original source URL
and SHA-256 retained and checked. It does not copy over raw page HTML.

It creates **stats +0 only**, not full enchantment tables. It holds
the listed minimum-level metadata in the *private* audit as
`indexedMinimumLevel` but deliberately leaves the public
`overview: null` because restrictions/classes are missing from an
index table. Public profile schema changes are **not** needed.

The same Stage 20.18 offline review workbench now shows an explicit
**category index warning** and permits approval of available
numerical stats only. Manual approvals, historical acknowledgment,
reviewer notes, and lack of automatic publication all remain required.

## One-command Windows use

After merging the PR and running `git pull origin main`:

```powershell
# Explicit opt-in to a tiny online request set, with robots.txt and pacing.
.\scripts\Start-WikidotCategoryReview.ps1 -Online -Categories 'axe,armor,gun'

# Alternative: save category HTML locally as axe.html and armor.html
# inside the named folder, then use zero network requests:
.\scripts\Start-WikidotCategoryReview.ps1 -HtmlDir '.\Wikidot_Index_HTML' -Categories 'axe,armor'

# The standard offline review tool opens automatically.
# Select Miner_Wikidot_Audit_20_17.json and approve selected +0 stats.
# Export Miner_Wikidot_Approvals_20_18.json.

# Reuses EXACTLY the Stage 20.18/20.19 output process:
.\scripts\Finalize-WikidotBatchReview.ps1

# Only after reviewing the full historical source and local draft:
.\scripts\Finalize-WikidotBatchReview.ps1 -WriteReviewed
```

To look at a later section of a large index's matched items, use
`-Offset 20`, `-Offset 40`, etc. The output has a maximum of
20 item proposals per run; the collector can inspect at most
5 category pages per run and never bulk-fetches all 551 names.

The Stage 20.20 source audit uses the same private output filenames
as the individual-page audit, so **copy or rename previous audit/
approval files before running the next batch** if you want to retain
them; do not silently reuse an old approval against a newer audit.
The compiler checks exact source hashes and IDs to prevent mixing.

## Limitations and next milestone

- Numeric +0 stats from old pages are historical **community-reference**
  data; they are not current-game observations and cannot be used as
  evidence for Star Stone-modified values or special effects.
- This fallback doesn't infer +1..+10 or L automatically; the regular
  opt-in empirical model remains separately disclosed on the site.
- Existing public profiles are never overwritten. Adding missing
  fields to an already-published partial item requires a reviewed
  follow-up PR or a future append-only enrichment feature with
  per-grade source tracking.
- Do not copy article prose, category table layouts, images or original
  game assets from community pages. Cite the relevant community URL;
  Wikidot states content is CC BY-SA 3.0 unless otherwise noted.

## QA

- `tests/test_audit_wikidot_category_index.py` uses synthetic Axe
  and Armor tables only. It validates category titles, numeric
  extraction, 551-name ID matching, duplicate-name quarantine,
  duplicate category conflicts, offline mode and 20-row offsets.
- `tests/historical-item-profile-drafts.test.mjs` verifies the
  category source marker is required, approved +0 data are sourced,
  and the public profile remains deliberately incomplete rather than
  inventing crafting or class restrictions.
- The standard PR CI runs these tests and all existing Astro, Miner
  and standalone publication gates.
