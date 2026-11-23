# Stage 20.45 — Player-first monster profiles

## Rationale

Community members want to know what an enemy might drop, what the
source suggests about its rate, and how to navigate to the item.
The Miner investigation's raw IDs, source rows, Band keys and
internal configuration names remain essential provenance, but they
should NOT dominate the main monster profile.

This stage applies the player-first item-page layout from 20.44
to the bilingual `/monsters/?id=<CharID>` and
`/pt-br/monsters/?id=<CharID>` bestiary profile.

## New display order

1. Character name, original client level, direct loot row and group
   reference counts.
2. **Possible monster drops** — a concise table with item name and
   clickable wiki link, estimated percentage, candidate quantity and
   a single *View source* disclosure per row.
3. **Other possible items — loot groups** — separate group cards,
   still showing independent group-reference and item-level rate
   estimates, never a fabricated combined probability.
4. **Original client records** — a collapsed, accessible technical
   table showing exact Characters.csv rows and optional separate
   Miner evidence. Group Band/RawSum evidence remains separately
   collapsible within each corresponding group.

The source disclosure on each drop row retains all original fields
that previously crowded the table: source row IDs, GroupID, Band,
RawRate (each stage), Slot and metadata. No original source JSON was
modified.

## Community UX

- Plain bilingual headings, compact bronze-framed tables and links
  to every ItemID in the universal item database;
- estimated rates are still explicitly marked unverified;
- meaningful states when no drops were found (not a claim that the
  game cannot drop the item);
- row-focused technical disclosures for detailed investigators;
- readable 2540x1440 at 125% and responsive layout on smaller screens;
- source evidence is rendered safely with textContent (no HTML from
  original game client rows).

## QA

`tests/community-readable-monster-profiles.test.mjs` checks
drop-first source order, exact link paths, source preservation and
clear separation of group stages. Existing hash-pinned 53 original
monster JSONs, 572 GroupBands records and all 23,586 item
index contracts remain unchanged. CI must pass before merging.
