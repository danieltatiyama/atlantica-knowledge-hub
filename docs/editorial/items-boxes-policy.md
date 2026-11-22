# Items & Boxes — data contract and editorial safety

The site uses /items/boxes/ (English) and /pt-br/items/boxes/ (Portuguese).

## IDs

- Unique: the item identifier.
- NameTextNum: localization/text-string index, NOT the item identifier.
- Reward Unique: possibly a different ID, joined only by explicit fields.

Prism Carnival Random Box, as found in ItemTypePackCash, has Unique 21783
and NameTextNum 49290. The earlier odds spreadsheet incorrectly referred
to 49290 as its Box ID; this is the name-text index.

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
