# Stage 20.21 — Four additional complete historical equipment articles

## Source basis

Independently inspected structured tables on Wikidot, November 22, 2026:

| Existing reviewed item ID | Item | Source (historical) | +0 core | +10 core |
| --- | --- | --- | --- | --- |
| 100 | Spirit Spear | https://atlantica-online.wikidot.com/item:spirit-spear | Attack 80–110, STR 11, VIT 3 | Attack 320–440, STR 44, VIT 12 |
| 264 | Evil Staff | https://atlantica-online.wikidot.com/item:evil-staff | Attack 988–1,326, INT 392, VIT 148 | Attack 3,952–5,304, INT 1,568, VIT 592 |
| 11245 | Pegasus Shield | https://atlantica-online.wikidot.com/item:pegasus-shield | Defense 9,812, VIT 182 | Defense 39,248, VIT 728 |
| 1420 | Phoenix's Instrument | https://atlantica-online.wikidot.com/item:phoenix-s-instrument | Attack 634–850, INT 252, VIT 95 | Attack 2,536–3,400, INT 1,008, VIT 380 |

The item IDs and English names come from the existing 551-entry
client-derived *reviewed public name registry*. The historic numeric
stats, classes, workload, crafting skills, and material quantities
come from the linked community Wiki pages.

Each page includes:
- Type, minimum level, exact historical class restrictions
- **All eleven directly listed stat rows +0..+10** (not extrapolations)
- Historical batch production, workload and required crafting skill
- Individually named crafting materials and quantities
- Direct historical source attribution under each equipment article

The former three complete profiles (Spirit Sword, Spirit Bow, Spirit
Instrument) remain unchanged. Total complete editorial item profiles:
**7 of 551**; **544** still need information.

## Current limitations

These four pages describe community-published item facts from
**2017** and are explicitly labeled *historical*, NOT confirmed
current 2026 Atlantica Global stats. Screenshots and later game patches
may differ.

The historic **Pegasus Shield** also displays fixed Magic Defense
**170** and Evasion **+7.7%** outside its per-enchantment table. The
current editorial profile contract has no dedicated reliable fixed
bonus field, so **these two extra values are not silently projected
or included as per-grade stats**. A future extension should add
an evidence-bound fixed stats section before they appear on the
published equipment detail page.

The historical Wiki documents additional data, such as Atlas
cost, durability, trade/drop acquisition conditions, set bonuses or
special effect prose. These are not yet modeled in the reviewed item
profile schema and were **not** copied or invented.

Some individual Spirit item links may be missing or inaccessible even
though Wikidot category index tables list their +0 statistics. The
Stage 20.20 category-index importer is a **separate draft workflow**
for those missing pages. Neither it nor this PR auto-imports hundreds
of historical rows.

The historic Wikidot site states that its content is CC BY-SA 3.0
unless otherwise noted. This change stores structured factual
attributes and concise item/class/material names, **not page content,
visuals, full wiki articles, source HTML, client binaries or screenshots**.
Every item includes a direct source URL and explanatory source label.

## QA

The extended regression checks:
- the real client-reviewed IDs and exact existing names;
- all 11 historical grade rows +0..+10 for each of the four items;
- every numeric value agrees with the independent scaling formula
  across more than 150 numeric comparisons;
- provenance remains `community-reference`, never `ingame-screenshot`;
- crafting workload, required skills, material counts and example
  class restrictions;
- no Legendary grade or extrapolated missing stats are introduced;
- Pegasus Shield Magic Defense and evasion are intentionally
  not treated as grade-scaled fields;
- current 551-ID queue count and public profile coverage updated
  from 3/551 to 7/551.

Run:

```powershell
npm run validate:profiles
npm run test:profiles
npm run coverage:items
npm run build
```

This PR does not depend on running the private game Miner, does not
add guessed item IDs, and does not require more screenshots.
