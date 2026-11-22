# Stages 20.12 and 20.13 — Equipment articles and inferred enchantment progression

## Editorial layout

The user's two Spirit Sword in-game tooltip screenshots, supplied 2026-11-22,
establish the base item facts. The Wiki item pages follow an original,
Wikidot-inspired layout:

1. Overview — item type, minimum level, allowed classes, artwork placeholder.
2. Stats — enchantment progression with clear per-row provenance.
3. Source — captured equipment box references; no inferred drop probabilities.
4. Crafting — workload, production per batch, skill requirements, materials.
5. References — screenshot evidence and separately credited community sources.

The public dataset lives in `src/data/reviewed-equipment-profiles.json`.
Its source policy is separate from the read-only private Miner and its
approved metadata gates. Do not publish raw source files or uploaded
screenshots. The current 551 item-ID/name catalog remains unchanged;
only the Spirit Sword has a populated editorial profile so far.

### Spirit Sword

From supplied screenshots, the +0 item has:

- Item ID 1, type Sword, minimum level 1.
- Attack 60–90, Strength +5, Vitality +5 at +0.
- Production 1 per batch, required workload 450, Sword Craft Skill 1.
- Allowed classes stored from tooltip text.

Crafting materials Copper Flakes ×5 and Maple ×4 are documented via
a community reference instead of the screenshot; they are separately
labeled in the article.

## Historical enchantment scaling hypothesis

Nine distinct historic item tables were cross-checked on 2026-11-22:

| Gear | Source |
| --- | --- |
| Spirit Sword | https://atlantica.fandom.com/wiki/Spirit_Sword |
| Spirit Bow | https://atlantica-online.wikidot.com/item:spirit-bow |
| Spirit Instrument | https://atlantica-online.wikidot.com/item:spirit-instrument |
| Destroyer's Sword | https://atlantica-online.wikidot.com/item:destroyer-s-sword |
| Evil Sword | https://atlantica-online.wikidot.com/item:evil-sword |
| Pegasus Lance | https://atlantica-online.wikidot.com/item:pegasus-lance |
| Phoenix's Light Armor | https://atlantica-online.wikidot.com/item:phoenix-s-light-armor |
| Dark Knight's Shield | https://atlantica-online.wikidot.com/item:dark-knight-s-shield |
| Excalibur, grades +0..+10 only | https://atlantica-online.wikidot.com/item:excalibur |

In each reviewed table, core numeric attack / STR / VIT / DEX / INT /
physical defense entries follow the same progression, with any fractional
result truncated DOWN. The exact integer-tenths multipliers are:

| Enchant | tenths | multiplier |
| ---: | ---: | ---: |
| +0 | 10 | 1.0 |
| +1 | 12 | 1.2 |
| +2 | 14 | 1.4 |
| +3 | 16 | 1.6 |
| +4 | 18 | 1.8 |
| +5 | 21 | 2.1 |
| +6 | 24 | 2.4 |
| +7 | 28 | 2.8 |
| +8 | 32 | 3.2 |
| +9 | 36 | 3.6 |
| +10 | 40 | 4.0 |

The empirical hypothesis is:

```text
estimatedStat(+n) = floor(observedStat(+0) * tenths[n] / 10)
```

Use integer tenths rather than JavaScript floating multiplication, since
e.g. 1595 * 2.8 can represent as 4465.999999999999 and accidentally
truncate to 4465 instead of the historical table value 4466.

The function is in `src/data/equipment-enchant-projection.mjs`.
The test `tests/equipment-enchant-projection.test.mjs` confirms numerical
agreement across >100 historical values, spanning weapons, armor and
shields. The current screenshot-backed Spirit Sword is projected from:

- +0 (observed): attack 60–90, STR +5, VIT +5
- +5 (estimated): attack 126–189, STR +10, VIT +10
- +10 (estimated): attack 240–360, STR +20, VIT +20

All +1..+10 rows are clearly labeled CALCULATED / ESTIMATED and cite
the community-based calibration. They are NOT validated measurements
from the current Atlantica Global client.

### Deliberate safety boundaries

- No extrapolation of Magic Defense, evasion, durability, Atlas costs,
  fixed effects, skills, set bonuses, enchant chance, legendary tiers,
  or negative values.
- No automatic extrapolation for all equipment; a reviewed item profile
  must explicitly opt in with `enchantmentProjectionModel:
  "wikidot-classic-v1"` and cite a community source.
- Observed values for an enchant level take priority over estimates.
  A future game screenshot for +5 replaces the predicted +5 row; it
  does not modify +0 or create fabricated records.
- Missing sources remain missing. Unsupported equipment families will
  need independent calibration and possibly separate formulas.
- The source websites are community-maintained and largely historical.
  This is a well-supported inference from their tables, not an official
  formula confirmed for the 2026 client.
- Source pages are linked and credited. Original page layouts, text,
  item artwork and screenshots are NOT copied into this repository.

## Wiki URL convention

The historic Wikidot pages generally use
`https://atlantica-online.wikidot.com/item:<slug>`.
Examples: `item:evil-sword`, `item:spirit-bow`,
`item:phoenix-s-light-armor`, `item:dark-knight-s-shield`.

A candidate slug is lowercased, with punctuation and spaces reduced
to hyphens. Not all names or historical pages necessarily have a
matching URL; verify existence before linking from a public article.
The exact Spirit Sword Wikidot page may not be indexed by search engines,
so the separately verified Fandom Spirit Sword stats table was also
used for calibration.

## Operational checks

```powershell
npm run validate:profiles
npm run test:profiles
npm run validate:curated
npm run build
```

CI runs all article gate tests and the historical scaling regression
suite before Astro build. No client DB reads or external network
requests occur during CI. Future item articles must be specifically
reviewed and their source boundaries made explicit.
