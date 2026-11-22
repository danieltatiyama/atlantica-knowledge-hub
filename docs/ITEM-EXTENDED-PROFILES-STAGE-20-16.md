# Stage 20.16 — Complete equipment details and per-item coverage

## Objective

The Wiki already has numeric routes for **551 reviewed equipment IDs**,
but only a small subset has screenshot- or community-sourced complete
item data. A user-supplied **Dell'arte's Ambition L** screenshot on
2026-11-22 demonstrates why a mature detail page must distinguish
intrinsic/base values, socketed modifiers and the **equipped tooltip
total**, rather than simply copying every visible stat as a base item
attribute.

This stage adds a **source-aware extended item detail template**,
populates it with one real in-game example, and provides a **551-item
review queue** for scaling the workflow without invented data.

## Dell'arte's Ambition — what the screenshot actually shows

The user's screenshot (not committed in this repository) shows:

- Item: **LEGEND Dell'arte's Ambition**; Sword; minimum level **180**.
- Equipped attack: **26,300–32,985**.
- Strength **+1,715**, Intelligence **+1,715**, Vitality **+1,715**.
- Critical **9**, Multi-Hit Rate **6**, AP Mod. **3**.
- Magic Skill Level **+48**.
- Three times **Star Stone: Gold Eagle [VI]**; each displays
  Critical Rate +3, Multi-Hit Rate +2, Action +1,
  **Attack Enhance +10% (+2,023–+2,537)**.
- Legendary weapon attacks apply a debuff increasing damage taken
  by **10%**.
- Conditional effect: when equipped by **Harlequin**, **54%**
  extra critical damage.

The original item class restrictions are transcribed into the
screenshot-backed research profile. The supplied screenshot does NOT
provide a numeric item ID, crafting recipe, raw client record ID,
drop source, or drop probability. Never invent them.

### Crucial distinction: modified attack vs bare L attack

The historic +0 community table says **4,705–5,901 attack**.
The Stage 20.15 historical L multiplier (4.3×) predicts:

```text
Bare L minimum = floor(4,705 * 4.3) = 20,231
Bare L maximum = floor(5,901 * 4.3) = 25,374

Each stone minimum bonus = floor(20,231 * 10%) = 2,023
Each stone maximum bonus = floor(25,374 * 10%) = 2,537

Equipped minimum = 20,231 + 3 * 2,023 = 26,300
Equipped maximum = 25,374 + 3 * 2,537 = 32,985
```

**Both results match the supplied screenshot exactly.**

This confirms an internally consistent decomposition of that
particular equipped state. It does **not** independently measure the
bare L stats in the 2026 client. The screenshot also establishes
Intelligence +1,715, but the cited +0 community table does not
establish an independent +0 Intelligence value; do not backfill one
without another source.

Critical 9, Multi-Hit 6 and AP Mod 3 are likewise consistent with
the three stones' +3, +2 and +1 contributions, respectively. These
are marked as **equipped** values rather than blindly attributing
them to the bare weapon.

### Source independence

- **Observed in-game (current screenshot):** equipped attack, attribute
  bonuses, socketed stone effects, class restrictions, Legendary debuff,
  Harlequin critical bonus, skill level, grade and required level.
- **Historical community table:** +0 attack and stat values,
  previous statement of being non-craftable.
  https://atlantica.fandom.com/wiki/Dell%27arte%27s_Ambition
- **Calculated, not observed separately:** the bare L attack and
  mathematical decomposition of the three stones.

## What was implemented

- `src/data/extended-equipment-facts.json`: reviewed detail records
  with separate evidence and no embedded binary screenshot data.
- `src/data/extended-equipment-facts-gate.mjs`: strict fail-closed
  validation, including source URLs, item identity, screenshot
  fields, stone counts, numeric consistency and explicit provenance.
  Public numeric item IDs may only be attached when they match the
  separate curated English item-name registry.
- `src/components/ExtendedEquipmentPage.astro`: original,
  fully bilingual reusable detail layout with overview, attributes,
  equipment vs sockets breakdown, class restrictions, special
  effects, crafting status, citations and source confidence.
- `src/pages/items/legendary/dell-artes-ambition.astro` and
  `src/pages/pt-br/items/legendary/dell-artes-ambition.astro`:
  the same named identity in English and Portuguese.
- The Legendary research comparison now links to the screenshot-
  backed extended profile. Its legacy bare L attack remains
  clearly marked as an *estimate*, not as the equipped attack.
- Regression tests verify 26,300 and 32,985 exactly, the origin
  of additional Critical/Multi-Hit/AP stats, and rejection of
  source/field tampering.

## The all-551 item review queue

`scripts/build-item-article-review-queue.mjs` reads:

1. All 551 existing reviewed public equipment ID/name pairs.
2. Current editorial profiles and section-level evidence.
3. Any explicitly approved client metadata.
4. Extended details, when the item has an independently reconciled ID.
5. *Optionally* the Stage 20.11 PRIVATE SQLite source-family review.

The report counts each field's coverage: overview, stats, crafting,
materials, special effects, explicit L eligibility and approved
client metadata.

Every remaining ID receives **one private review record**.
The candidate Wikidot URL uses the known `item:<slug>` pattern
but always has `wikidotUrlVerified: false`. We never claim that
those historical pages exist just because their URLs are plausible.
The queue does not scrape or publish web pages, raw Miner data,
recipes or unverified stats.

Windows commands after merge, from Wiki repository root:

```powershell
git pull origin main

# Aggregate-only progress report, no file written
npm run coverage:items

# Create a local PRIVATE per-ID queue
node .\scripts\build-item-article-review-queue.mjs --output ".\Miner_Item_Article_Queue_20_16.json"

# If the Stage 20.11 private grouping has been generated:
node .\scripts\build-item-article-review-queue.mjs --groups ".\Miner_Source_Groups_Private_20_11.json" --output ".\Miner_Item_Article_Queue_20_16.json"

# Validate all source-aware examples and Astro pages
npm run test:item-facts
npm run build
```

Do not commit or publicly upload the private queue. It can be used
locally to prioritize source reconciliation and per-item editorial
review. The original database remains untouched.

### Current coverage, not invented completion

- Public numeric equipment catalog: **551** items.
- Already researched complete editorial profiles: **3**
  (Spirit Sword, Spirit Bow, Spirit Instrument).
- Remaining numeric item profiles requiring further sourcing:
  **548**.
- One separate fully documented screenshot-based Legendary item
  (**Dell'arte's Ambition**) does not yet have a numeric item ID
  matched to the curated 551 catalog, so it has a **named research
  route**, not a fabricated numeric item route.

The game contains many more items than the initial 551 IDs.
This is an expandable workflow, not a claim that every game item
already has complete stats or has been processed.

## Next safe automatic enrichment

For batches of item data: gather independently verifiable item IDs,
Wikidot sources (when pages genuinely exist) and game-client data,
then convert them into **private draft profiles** with source labels.
A reviewer approves the factual fields and correct source identity;
only then are they promoted into the public JSON/Atlas.
Do not automatically treat historical data as current, assume
numeric IDs from a community slug, or extrapolate special effects
using the +0–+10 / L core-stat multipliers.

Do not indiscriminately fetch hundreds of community Wiki pages
without checking site access rules, respectful request pacing
and user-side permission to ingest the material. The current
review queue performs no external network requests.
