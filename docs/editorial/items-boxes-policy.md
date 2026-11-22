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
