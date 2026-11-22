# Items & Boxes — data contract and editorial safety

The site uses /items/boxes/ (English) and /pt-br/items/boxes/ (Portuguese).

## IDs

- Unique: the item identifier.
- NameTextNum: localization/text-string index, NOT the item identifier.
- Reward Unique: possibly a different ID, joined only by explicit fields.

Prism Carnival Random Box, as found in ItemTypePackCash, has Unique 21783
and NameTextNum 49290. The earlier odds spreadsheet incorrectly referred
to 49290 as its Box ID; this is the name-text index.

## Confirmed contents without probabilities

A box can have a usable list of related items even when no odds are known.

- `contentsEvidence: server-preview-captured` means that the game transmitted a list of item Unique IDs while the player opened that exact box; it establishes a **transmitted list**, not equal odds or necessarily obtainable under every condition.
- `contentsEvidence: family-candidates` is only a client-name or equipment-set inference. It cannot publish nonempty reward lists as confirmed contents.
- `observedCount` reports how often a specific reward ID was seen in the small capture sample. It is not a drop-rate estimate.
- `quantityVerified: false` makes the item quantity appear as unknown (`—`) even when the schema contains a placeholder numeric value. Do not display inferred quantities as confirmed.
- Separate the Judgment random Equipment Box `13583` from the selection boxes `16207` and `16208` which grant +5 choices. Five observed Judgment random-box rewards were +0; the repeated packet value `5` is **not** proof of +5 item grade.
- In the November 22, 2026 capture, Judgment `13583` and Abyssal `16812` each transmitted a 27-item list; 9 observed reward identifiers belonged to those lists (5 Judgment, 4 Abyssal). No percentages or guaranteed pool completeness are established.
- The local 113-box family crosswalk is for private editorial review only and is not automatically committed or published.

## Scope: general Equipment Boxes (in-game screenshots, 2026-11-22)

The public equipment box registry currently has **26 standard boxes** plus **7 graded variants**.
Explicitly exclude Melee, Ranged and Magic class-specific boxes, JP event duplicates,
no-trade variants and +7 special boxes unless separately confirmed in future.

User-reported variant rules:
- Supreme Evil and Enchanted variants: same equipment item pool as their standard/base box; observed enhancement range +0 to +3.
- Infused variants: same base pool; reported enhancement range +4 to +6.
- Do not imply that all grades are equally likely or that these rules establish probability.
- The standard-box enhancement grade is **not assumed** across all boxes. Five observed Judgment outputs were +0.

ItemTypePack.ndt contains two separate records named `Infused Pegasus Equipment Box`:
`Unique=13404` (standard variant) and `Unique=13605` (identified as JP/event in its Korean name).
The screenshots do not by themselves identify the latter, so the registry uses 13404 only.

The curated public routes expose the documented **box existence and family grouping**,
and use the game-captured 27-item lists only for Judgment and Abyssal.
All other box pages explicitly state that their complete reward list is not yet confirmed.
The older 113-box source-name candidate crosswalk remains a separate private review tool.

## Stage 17.0: 30 captured game-client previews (2026-11-22)

A single passive capture (`equipment_boxes_filtered.pcapng`, kept private) yielded:
- **30 different box IDs**, one `0x2137` item-list preview and one `0x2138` observed result per box.
- **763 box-to-distinct-item associations** across the 30 previews.
- **1,390 preview positions**, including item+grade combinations; **1,386 distinct (item, grade code) pairs**.
- **30/30 observed result pairs** appear in the matching preceding preview's item+grade pairs.
- These three are selection, not random boxes. The capture contains 11 selectable item IDs for Asura's (ID 20907) and Osiris' (ID 20917) in 0x2139 messages; Dark Knight's selection choices remain unparsed.

`src/data/equipment-box-captured-pools.ts` is a curated, non-sensitive source file containing the 30 item-ID lists, preview grade-code sets and one observed outcome per box. It contains no raw network payloads.

For the known Judgment standard box, code `5` corresponded to +0 user-observed equipment. Other previews use codes `5–8` for Supreme / Enchanted and `9–11` for Infused. Display a **likely enhancement grade** as `code - 5` rather than declaring an official grade specification.

**Do not assume variants equal the base pool.** Specifically, capture comparisons show:
- Enchanted Pegasus excludes item `3771` relative to Pegasus.
- Infused Evil excludes item `28221` relative to Evil.
- Enchanted Judgment excludes item `3773` relative to Judgment.
- Enchanted Dark Pegasus excludes items `431` and `3772` relative to Dark Pegasus and repeats some exact item+grade pairs.

A preview does not demonstrate equipability, exact probability, or the complete server RNG policy. Preview repetition is not a drop weight. Names without validated localization should be displayed by Unique ID only.

## Item name localization and pending source files

Game item Unique IDs are not localization indexes. Join item definition tables first:

`ItemTypeWeapon.ndt` / `ItemTypeDefence.ndt` (and other `ItemType*.ndt`):
`Unique -> NameTextNum`.

Then resolve `NameTextNum` through `LANG/ENG/TextMgr/TextMgr_Item_ENG.ntx`.
`TextMgr_ItemHelper_ENG.ntx` is supplementary descriptive text, not the principal English name table.

The complete ENG NTX files were **not part of the private Stage 17 packet export**,
so names not already verified remain **Unique ID only** until extracted.
Use the separately delivered private `Export_Atlantica_Item_Names.ps1` helper to
gather the sources locally. Do not upload raw game asset files to the public repo.

## Regional chances

Rates can appear in an approved article only with:
- oddsStatus regional-published
- probabilitySourceUrl identifying a checkable publication
- explicit region: global, kr, jp or other
- probability figures attributed to that SAME region.

Client integers such as BigChanceNumber are not percentages until proven.
Flags SelectPack, AllGetPack, HeroGetPack and similar are not odds.

Selection boxes do not have random chances merely because items are listed.
Single-outcome full probability tables should total 100%; partial
probability tables must explicitly say incomplete in probabilityNotes.
Pity mechanics may alter actual rates: base chances and pity belong in
separate, sourced explanations.

## Example, deliberately unpublished

    ---
    title: Example Box
    description: Fictional example.
    translationKey: example-box
    lang: en
    updatedAt: 2026-11-22
    draft: true
    reviewStatus: draft
    evidenceStatus: client-config
    region: unknown
    boxType: unknown
    oddsStatus: unknown
    rollModel: unknown
    outcomes: []
    ---

To publish, draft must be false, reviewStatus approved and evidenceStatus
independently verified. An official-announced item requires verificationUrl.
A client-config-only box cannot publish.

**NEVER add private mining exports or unreviewed client data to the
public GitHub repository, even as a draft.**

## Separately delivered private research

The independent research package provides 14,139 pack definitions,
8,274 candidates flagged by name, and 29 previously documented KR outcome
percentages. None of this is automatically imported.

## Build

Run npm ci, npm run build and npm run dev, then check:
- /items/boxes/
- /pt-br/items/boxes/
- Search and filter controls
- Language navigation
- Existing guides, events and mercenaries
- Empty-state behavior when no boxes have been approved
