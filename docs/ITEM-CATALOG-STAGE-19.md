# Stage 19.0 - Equipment Item Catalog (pilot)

## Scope

The pilot provides a bilingual EN/PT-BR catalog at:
- /items/ and /pt-br/items/
- /items/{Unique}/ and /pt-br/items/{Unique}/

The catalog includes the 551 reviewed English item names from the NA client,
which were reconciled by Unique -> NameTextNum -> TextMgr_Item_ENG.ntx.
Portuguese labels are localized, but item names remain explicitly English.
These 551 IDs are only a known equipment-box subset, not all game items.

## Relationship semantics

Equipment item pages reverse-reference captured, curated in-game lists:
- 30 random Equipment Box previews (0x2137)
- 2 selectable equipment choice lists (0x2139)

Each association means **the item ID was present in that captured preview**.
It does not imply an equal chance, a current drop rate, an obtainable reward
under all conditions, a guaranteed drop quantity or a verified grade.
Selection-box references are never represented as random draws.
This pilot carries no network payloads, local paths, secrets or client files.

## Verification checklist

1. Run the existing validator suite and Astro build.
2. Check both index pages and a sample of ID pages (e.g. item 47).
3. Search by exact item ID and partial English item name.
4. Confirm the item-to-box list is consistent with the box preview pages.
5. Confirm language switching preserves item IDs, selection box links,
   existing box detail paths and the catalog landing page.
6. Verify missing recipes, attributes and drops are never invented.

## Next stage

A real v0.7 Data Miner export remains required to implement the item dataset
adapter described by docs/GAME-DATA-INTEGRATION.md (Stage 9.2).
The catalog's type and routes are intentionally compatible with future
expansion without making a client-only fact into a gameplay-verified claim.
