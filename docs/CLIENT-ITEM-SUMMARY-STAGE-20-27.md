# Stage 20.27 — Compact client source stats and optional historical +0..+10 model

## Why this follows the Stage 20.26 merge

The public equipment catalog now contains **551/551** source-matched
client items with **1,031** original `Items.csv` attribute rows, and
19 original raw numeric fields. Displaying the raw fields only in
long per-source technical tables makes it difficult to compare equipment.

This stage introduces a more readable, bilingual summary near the top of
every existing equipment article, keeping the full source rows and
provenance at the bottom.

## Source consensus without silently merging definitions

`src/data/client-item-stat-summary.mjs` compares fields between
the **general** and **specific** source record for the same item ID:

- **Consistent:** original string value is identical wherever listed.
- **Partial:** present in only part of the source records. Show its
  actual source value and a clear `1/2 sources` marker; do **not**
  treat missing as numeric zero.
- **Conflict:** two source records actually provide distinct
  nonempty raw values. Show a warning with both source-row IDs and
  values. No automatic canonical selection.

For the 551-item snapshot, the 480 items with two source definitions
have **zero disagreements in their shared numeric fields**. Not all
definitions have identical lists of columns. Commonly nonzero raw
values are organized by attack, defense, attributes and other bonuses.
Zero fields and all additional original numeric keys remain
accessible in the existing technical source table.

The compact section is part of `ItemDetailPage.astro` and does not
replace the former `ClientItemAttributesSection.astro` or the
historical/Wikidot article data.

## Optional historical progression

An explicitly collapsed-by-default `<details>` panel offers a
**HISTORICAL MODEL** preview for `+0..+10`. It uses the
`wikidot-classic-v1` empirical multiplier vector:

| Grade | Factor |
| --- | ---: |
| +0 | 1.0 |
| +1 | 1.2 |
| +2 | 1.4 |
| +3 | 1.6 |
| +4 | 1.8 |
| +5 | 2.1 |
| +6 | 2.4 |
| +7 | 2.8 |
| +8 | 3.2 |
| +9 | 3.6 |
| +10 | 4.0 |

Only positive, non-conflicting **integer** raw fields of
`MinDamage`, `MaxDamage`, `AC`, `Str`, `Dex`, `Vit`
and `Mag` may enter this preview. It uses integer-safe
`projectClassicStat`, already checked against historical community
weapon, armor, shield and instrument tables.

- **+0 row:** actually extracted client baseline, *not* a current
  gameplay tooltip observation.
- **+1..+10 rows:** predictions from historic Wikidot multiplier
  model, not client records or confirmed server mechanics.
- **L:** never automatically included; existence of a name, item ID
  or +10 is not proof of item-specific Legendary eligibility.
- **Never multiplied:** MagicDef, EV, HitRate, CriticalPlus,
  MagicSkillPlus, job damage fields, bonuses/skills, durabilities,
  crafting and availability.
- **Fractions:** `Mag=292.5` (Abyssal Orb #363) remains visible in
  the source data but is excluded from numeric grade predictions,
  because old integer rounding rules do not establish how decimals
  scale.

The optional preview is **not** added when a source-reviewed historical
stats table is already available for the item. This avoids duplicating
the seven standalone editorial item profiles.

The projection model is a navigation/research aid. It does
**not** imply a particular item can be enhanced, enchanted or
acquired, and does not override verified values when provided.

## Regression and CI

`tests/client-item-stat-summary.test.mjs` verifies:

- all 551 existing item records and 1,031 source rows;
- 0 source conflicts in current overlapping values;
- missing ≠ zero, partial ≠ conflict, actual conflict ≠ canonical;
- Spirit Sword original +0 MinDamage 60/MaxDamage 90 and
  modeled +10 240/360;
- Twilight Shield AC 15,570 → 62,280 at hypothetical +10,
  with fixed MagicDef 198 and EV 85 **not** projected;
- fractional Mag 292.5 excluded, while integer Mag 252 on
  Phoenix's Instrument #1420 hypothetically projects to 1,008;
- no automatic Legendary row in this model.

No raw Miner SQLite, binaries, private reports, imported game assets,
or new item IDs enter this change. No automatic publication before PR
merge.
