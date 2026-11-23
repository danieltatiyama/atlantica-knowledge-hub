# Stage 20.43 — Historic estimated drop % and widescreen bestiary density

## 10000-point historical raw-rate interpretation

The November 2026 client Miner investigation identified a **candidate**
fixed-point numeric scale: `RawRate = 10000` corresponds to
`100%`. A simple *display-only* conversion on this scale is:

    estimatedPct = RawRate / 100

Examples: `1 => 0.01%`, `50 => 0.5%`,
`2500 => 25%`, `10000 => 100%`.

**IMPORTANT:** This was an inference from the game-client records,
**not a confirmed observed drop probability**. The prior investigation
did not validate whether drops are independent, pooled, weighted,
or allow an empty roll.

The original audited source data has:

- **9,959** DirectDrops.csv raw `RawRate` fields in 0..10000;
- **5,784** CharacterGroupRefs.csv raw `RawRate` fields in 0..10000;
- **3,076** GroupDrops.csv raw `RawRate` fields in 1..10000.

GroupBands.csv has **572** original band rows, including `RawSum`
values greater than 10000. **Do not treat RawSum as a probability.**
A candidate 10000-scale value from a group reference and a value
from a group item CANNOT be multiplied to claim an overall actual
item drop chance without knowing the server's selection/roll logic
and applicable band.

The original numeric data, source IDs, group linkage and hash-pinned
53 source files remain unchanged. All rate estimates are derived
only at display-time, with strict numeric input validation and raw
value shown alongside percentage.

## Four UI placements

1. The bilingual bestiary creature detail table: both direct drops
   and each separate group reference/item rate.
2. The source-backed Loot Codex: direct and group-derived item
   links, including the raw Band.
3. Equipment item pages: original direct/derived grouped drop
   evidence for each item.
4. The universal 23,586-ID item explorer, including material items.

Each visible percent column is labelled **Est. %** (not absolute
Drop Chance), and a conspicuous PT-BR/English notice explicitly
describes the scale hypothesis and current limitations.

## 2540×1440 screen, 125% browser zoom

The bestiary page uses a 1600px max-width canvas **without changing**
the 1280px global layout of other pages. Vertical rhythm is
compressed in the bestiary header and cards: 68px emblem, reduced
stats-panel spacing, tighter table rows, and narrower section
gaps. The dark steel/bronze/gold Atlantica-inspired styling is
retained. Mobile media queries continue to use the viewport
width and stack filters.

The Loot Codex is also compacted without hiding source evidence,
removing rate columns, reducing font readability, or sacrificing
keyboard controls.

## Quality gate

`tests/client-drop-rate-hypothesis.test.mjs` verifies all
18,819 original RawRate fields, localized formatting, rejection of
invalid/out-of-bound fields, distinct GroupBands.RawSum, raw source
disclaimers in all four UI paths, and widescreen-only layout behavior.
The original source SHA audit, prior tests and production Astro
build are run in CI before merge.

## What would validate the displayed hypothesis

The 0..10000 scale is plausible numerically, but confirming a real
monster/item drop chance would require either official server drop
mechanics or controlled observed drops (including empty drops,
group/band selection conditions, and adequate sample sizes).
Different combat modes, events, quest modifiers, dungeon buffs,
and per-server loot policies could invalidate a client-only
percentage. Until that evidence exists, the interface must retain
the **estimated** label even when a raw field equals 10000.
