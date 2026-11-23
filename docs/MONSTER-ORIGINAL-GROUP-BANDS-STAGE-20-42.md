# Stage 20.42 — Full original group-band evidence and creature info panel

## Scope

The 4,351-character client bestiary and the 893-item loot index
published in Stages 20.40–20.41 are kept intact. This stage uses
only the original **GroupBands.csv**, **GroupDrops.csv** and
**CharacterGroupRefs.csv** relationships already present in the
53 SHA-approved source JSON files.

### Bestiary creature improvements

- Grouped item tables show the original `Band` recorded alongside each
  group item in GroupDrops.csv, without inferring which level/character
  uses the band.
- Every linked group has a collapsible view of the original
  GroupBands.csv: source row, `Band`, `BandKey`, `EntryCount`, and
  `RawSum`. This is source evidence, not a game mechanics model.
- The creature detail panel shows original numeric `CharID`, raw
  configured `level`, number of direct-drop rows, and number of group
  references as source-backed counters.
- Monster catalog search gets a new **loot reference** filter:
  all client characters, source characters with direct drops,
  source characters referencing groups, or no source-loot link.
- Bilingual English/pt-br texts and accessible inputs continue.
- The 20.41 bronze/gold Atlantica-inspired codex theme is kept and
  expanded to the creature information cards and band details.

### Item-side backlinks

The same original group `Band` is shown in the:
- ItemID → creature loot Codex via `/monsters/?item=<id>`;
- Individual equipment profile loot sections;
- Universal 23,586-ID client item database loot section.

Original grouped reference and grouped item `RawRate` values remain
separate. No conversion, multiplication, estimated rate, or character
level assignment is introduced. No changes to original 53 JSONs or
their SHA-256 approval pins.

### Tests

`tests/monster-source-bands.test.mjs` validates all 572 original
GroupBands rows, all 3,076 grouped item rows, GroupID bucket identity,
the full set of source band fields, duplicate-safe source labels and
crosslink UI rendering. Full Astro build and original-hash validators
remain required in GitHub Actions.

## Evidence cautions

A original group `Band` is not proven to mean a monster level
bracket. `RawSum` is not a probability. Group `EntryCount` is
shown as recorded, not extrapolated to current drop mechanics.
Current server monster and loot availability remain unverified.
