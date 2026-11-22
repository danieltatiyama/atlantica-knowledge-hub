# Stage 20.28 — Named crafting materials, raw MakeSkillLevel and ClassType

## Merge dependency and source

Stage 20.27 was merged into `main` on **2026-11-22**. This
stage builds on the existing public, source-matched equipment catalog.

The user previously provided:

- `Miner_ClientFacts_Private_20_23.json` (23,586 private full item identities)
- `Miner_ClientFacts_PublicCandidate_20_23.json` (551 reviewed equipment IDs,
  1,031 decoded ItemType source definitions)
- `Miner_ClientAttributes_Private_20_25.json` (original Items.csv source fields
  for those 551 IDs)
- `Miner_ClientAttributes_PublicCandidate_20_26_MagReviewed.json`

**Nothing private was committed.** The new public fields are
narrowly selected, source-attested, and are joined to the existing
551 item identities and source-row numbers.

## 84 original material names resolved

All material IDs referenced by the public 551-item dataset were
checked by exact numeric ID against the 23,586-item private client
identity inventory. Precisely **84 distinct material IDs** occur
across the equipment recipe fields. All 84 have a uniquely
established **official English base name**; zero require guessing.

Examples:

| Material ID | Client English name |
|---|---|
| 5100 | Coral |
| 6080 | Maple |
| 7050 | Thread |
| 5340 | Large Diamond |
| 28308 | Earth Essence |
| 8357 | Phoenix's Feather |

This whitelist is stored in
`src/data/client-material-names-en.mjs`, tagged to Miner snapshot
**1**. It is a small *material name lookup*, not a new public item
catalog or 84 new article routes.

The detailed original client definitions and new source crafting
summary now both show these names with the original item IDs and
quantities, rather than unidentified `Item #5100` labels.

## Source-normalized crafting lists for 551 reviewed equipment IDs

`src/data/client-equipment-crafting-summary.mjs` groups identical
ingredient lists by **ID + quantity**, ignoring only ingredient order.
It does not merge conflicting quantities or different item IDs.

| Actual client source findings | Count |
|---|---:|
| Reviewed equipment item IDs | 551 |
| Parsed item source recipe/material rows | 987 |
| Distinct equipment with a structured ingredient list | **529** |
| Equipment without a structured ingredient list | **22** |
| Original ingredient references across all source definitions | **7,506** |
| Distinct ingredient names unverified | **0** |
| Different recipe ingredient sets between general and specific definitions in this snapshot | **0** |

The other **44** original source rows have `ingredientsStatus:none`.
This is **not** proof the item is uncraftable, event-only or
unavailable. Likewise a source recipe does not certify that a
crafting action is enabled in the live game's UI.

The new `ClientCraftingSummary.astro` section appears alongside the
existing historical crafting text and the raw source-file audit.
It presents:

- source raw level, grade, work and unit;
- one named material list per matching ID/quantity recipe set;
- source file basenames and source record IDs proving the match;
- explicit separate alternatives when source ingredient lists differ;
- uncertainty when values exist in one source file but not another;
- clear distinction between **client extracted fields** and a
  verified current crafting recipe.

General source definitions commonly have `unitRaw:null` while a
specific file has `unitRaw:1`. This is displayed as **partial**
evidence, NEVER as a missing 0 or a conflict. The raw number
remains a file field; it is not automatically relabeled a
verified per-batch production amount.

## MakeSkillLevel and ClassType raw source codes

The user's original private Items.csv source rows also include
`MakeSkillLevel` and `ClassType`:

| Observed coverage | Count |
|---|---:|
| Exact reviewed item IDs with a source MakeSkillLevel | **551** |
| Original Items.csv row IDs covered | **1,031** |
| Item IDs with at least one nonempty ClassType | **222** |
| Original source rows with ClassType | **242** |
| Unique nonempty ClassType source patterns | **12** |
| Unique raw CLS*/CLS1* tokens | **104** |
| Items with two different nonempty class lists | **20** |

`src/data/client-source-requirements.mjs` is a compact
transcription of the original raw source facts:
- every MakeSkillLevel is a literal numeric source string;
- source row numbers are checked against the published
  `client-item-attributes.json` dataset;
- 242 nonempty ClassType rows are retained with exactly
  their original source row number and token list;
- the same item may have an older shorter/general ClassType
  list and an extended specific-file list (Spirit Sword has
  **9 vs 21 codes**). **Neither is declared authoritative**.

`ClientRawRequirementsSection.astro` displays raw MakeSkillLevel
and the original class codes behind an expandable details panel,
with bilingual warnings.

**Critical limitations:**
- `MakeSkillLevel` appears related to crafting skill level.
  It is **not** the required level to equip an item.
- `ClassType` is a raw set of internal client restriction
  identifiers, not a verified player-facing English class list.
- No arbitrary mapping (e.g. `CLS1_ARTHUR` → a character name)
  is made without separately checking the original class ID
  registry or other sources.
- An empty ClassType field means **unknown restrictions**,
  not that all mercenaries can equip it.
- General and specific source lists may differ across
  client versions and do not prove separately playable
  equipment variants.
- A raw Work or MakeSkillLevel on an event item does
  **not** prove current craftability.

## Tests

`tests/client-crafting-requirements.test.mjs` checks:
- exact 84 names and coverage of all 7,506 ingredient refs;
- 551 item source identities, 529 parsed/22 no recipe,
  987 structured source rows, 0 source recipe disagreements;
- Spirit Sword materials Coral×5, Maple×4,
  Work=450 and missing/partial unitRaw;
- Phoenix's Instrument historical client source materials;
- failure-safe future recipe conflicts, raw work conflicts
  and missing ≠ 0;
- 551 MakeSkillLevel values with exact source row IDs;
- 222 ClassType item IDs, 242 source records, original raw
  token grammar and Spirit Sword 9-vs-21 source list retention;
- no default "all classes", guessed translations or
  auto-class eligibility.

The existing 551-item complete source-backed stat system and
Astro build remain unchanged; no new external content is
imported or downloaded by this stage.
