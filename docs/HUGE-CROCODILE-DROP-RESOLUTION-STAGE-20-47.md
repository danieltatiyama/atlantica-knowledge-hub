# Stage 20.47 — Level-resolved monster drops (Huge Crocodile evidence)

## Problem observed in-game on 2026-11-23

The public bestiary presented **four group references** for
**Huge Crocodile**, client **CharID 289**, original recorded
**level 71**, and could show **Gold Thread** even though the game's
in-game `[Item]` panel shows six different drops and **no Gold Thread**.

Original client records:

- `CharacterGroupRefs.csv`: GroupID 14 @ RawRate 3000;
  GroupID 13 @ RawRate 2000; GroupID 9 @ RawRate 2000;
  GroupID 3 @ RawRate 200.
- `GroupBands.csv`: BandKey is a candidate minimum-level threshold;
  select the **highest BandKey less than or equal to the character's
  recorded level**. Do not select every Band at once.
- `GroupDrops.csv`: only rows for the selected Band contribute to the
  player-facing item list. Preserve source rows for auditing.

For level 71: GroupID 14 → Band 3 (BandKey 60);
GroupID 13 → Band 3 (BandKey 50);
GroupID 9 → Band 4 (BandKey 60);
GroupID 3 → Band 3 (BandKey 70).

## Exact six-item match to two player-supplied screenshots

| Game panel item | ItemID | In-game qualitative label | Estimated source-based rate |
|---|---:|---|---:|
| Silver Thread | 7080 | High | 30% |
| Thick Animal Bone | 8002 | Low | 14% |
| Large Animal Bone | 8003 | Very Low | 6% |
| Slab of Lumber | 6002 | Low | 10% |
| Pine | 6050 | Low | 10% |
| Secret Material Chest | 20996 | Very Low | 0.1% |

**Gold Thread** (ItemID 7070) belongs to **GroupID 14, Band 4,
BandKey 80** and is **excluded for level 71**. Matching all six
item identities provides evidence for the level-band selection rule,
but does not by itself prove the in-game server's numeric probability
or the exact qualitative rarity thresholds.

### Estimated group drop rate

Under the candidate historical 0–10000 rate scale:

```text
estimated % = (CharacterGroupRefs.RawRate / 10000)
            * (GroupDrops.RawRate / 10000) * 100
            = referenceRaw * itemRaw / 1,000,000
```

For the Secret Material Chest: 200 * 500 / 1,000,000 = 0.1%.

This is a **client-source estimate**. Server implementation,
event modifiers, independent-roll mechanics, band eligibility under
other systems, and actual item availability remain unverified. The
in-game *High*, *Low*, *Very Low* thresholds cannot be generalized
reliably from these six observations alone, so no universal rarity
category function was invented.

## Source-wide audit

- Original 53 SHA-256-pinned monster data JSONs remain **unchanged**.
- 4,351 original client character IDs retained.
- 9,959 direct source drop rows retained.
- 5,784 original creature-to-group references considered.
- 172,120 all-Band reverse combinations had inflated acquisition links.
- **23,905** client-level-matched group-item references inferred.
- **197** source group references cannot be resolved because the
  recorded creature level is **below the group's first BandKey**.
  These remain *unresolved*, not assigned a guessed band.
- **822** item IDs have at least one direct or level-matched group
  reference, compared with 893 IDs in the raw all-Band audit.

The build now generates derived (gitignored) data in
`public/data/client-monster-discovery/`:

- `manifest.json`
- `creature-counts.json`
- `item-lookup.json`
- `item-sources/00.json` ... `29.json`

All public item-to-creature reverse links (Loot Codex, equipment profile
and all-item explorer) use **the same level-resolved derived index**.
A gold-thread lookup should not incorrectly list Huge Crocodile,
and a Silver Thread lookup should show Huge Crocodile.

## Player-first display

- Creature list shows **possible item rows**, not number of GroupIDs.
- The creature detail shows **one readable table** for all eligible
  direct + selected-band items, with name, estimated rate and quantity.
- Original GroupID, Band, RawRate, source IDs and Slots remain accessible
  via *View source* and *Original client records*. They are not presented
  as separate types of collectible drops.
- For records with no matched level bracket, display an
  **inconclusive source** warning rather than inventing a drop.

## Quality gates

`tests/monster-level-band-resolution.test.mjs` fixes the six
screenshotted item identities, excluded Gold Thread and resulting
numeric estimates as regression expectations. The full build and
all raw source SHA-256 validators remain mandatory.
