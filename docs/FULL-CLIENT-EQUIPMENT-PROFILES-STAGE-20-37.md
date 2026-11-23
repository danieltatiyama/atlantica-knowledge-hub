# Stage 20.37 — All 2,462 client equipment-like items, beyond the original 551

## Why

The 551 previously reviewed equipment IDs were the initial box-related
subset, not the maximum coverage of the game client. The already
published Miner snapshot has **2,462 named IDs** whose original
source-file categories are equipment-like:

- 551 reviewed equipment with individual source-backed articles;
- 1,911 additional equipment-like client-source IDs.

This stage gives every one of the 2,462 named IDs an individual
bilingual item URL without changing the already reviewed profiles.

## Routes

- /items/ — full expanded 2,462-ID equipment-like catalog
- /pt-br/items/ — same catalog in Brazilian Portuguese
- /items/ITEM_ID/ — individual English item page
- /pt-br/items/ITEM_ID/ — individual Brazilian Portuguese item page
- /items/database/?id=ITEM_ID — universal fallback for all original
  23,586 IDs, including materials and all 884 unresolved/collision IDs.

Original 551 URLs still resolve to the **unchanged reviewed** pages.
All new 1,911 URLs render source-backed pages, not fabricated game
articles. Original client item names remain in official English.

## Evidence in each new item profile

- Exact Unique item ID, reconciled original English name, source
  category, raw client level/grade, and original ItemType source rows;
- Client numeric stats from the existing 7,560-ID Items.csv export,
  with raw zero, missing, partial and source conflicts distinguished;
- Original decoded material IDs, quantities, source filename and row
  provenance, with links to the corresponding original item ID page;
- Multiple source recipe definitions remain separate if divergent;
- A **Used in crafting** inverse map from the 20.36 stage;
- A **How to obtain** section that explicitly marks sources unverified
  until original loot/monster records are imported and reconciled;
- Link to the universal item explorer for optional **historical**
  +0..+10 projections — not claimed live-server enhancement rules.

## Catalog and navigation

The main equipment catalog now searches/sorts/displays 2,462
equipment-like IDs and lets visitors restrict to the 551 reviewed or
1,911 source-only profiles. Original box references remain connected
only to the items whose source box previews were actually captured.

The all-item client database also links each one of these 2,462 IDs
to its dedicated profile instead of restricting links to the 551.

## Boundaries

The word equipment-like is a **source taxonomy**, not proof of current
server equipability, craftability, item drops, enhancement eligibility,
item acquisition or presence. Raw MakeSkillLevel/class codes for the
additional 1,911 items were not imported and are not invented.
Unreconciled item names remain withheld; no ID is inferred from an
English name alone. The live-server drop rates remain unknown.

## Tests

- New full-client-equipment-source.test.mjs verifies 2,462 unique
  named IDs, exactly 551 preserved reviewed IDs and 1,911 additional
  source profiles, source definition integrity and real original
  raw Items.csv stats.
- Existing legacy tests plus Astro build and Miner source verification
  must remain green before merging.
