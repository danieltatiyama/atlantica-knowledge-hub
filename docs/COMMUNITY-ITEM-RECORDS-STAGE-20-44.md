# Stage 20.44 — Community-first item pages and readable original records

## Goal

A public wiki must answer practical player questions before showing
developer-oriented mining artifacts. All original source records remain
available, but they must NOT be the default reading experience.

The universal item database at `/items/database/?id=<ItemID>` and
`/pt-br/items/database/?id=<ItemID>` now presents:

1. **About this item** — clear client ItemID, category, recorded level
   and grade, plus the number of source definitions.
2. **Crafting batch** — when source data is available, the recorded
   output quantity, increments and 10,000-unit player-reported cap.
3. **Crafting materials** — tabular item links, quantities per
   recorded batch and direct links to possible monster sources.
4. **Used in crafting** — recipes requiring this material.
5. **Where to obtain** — direct and grouped monster-drop references,
   always marked as client-derived / not live-server confirmed.
6. **Original item stats** — readable attribute groups and optional
   row-by-row raw value evidence.
7. **Original client records** — a collapsed audit section with a
   consistent table: source record ID, original filename, general or
   specific role, category, raw level/grade, Work, Unit and material
   parsing status. Optional file groupings are a second disclosure.

An optional reader guide explains this hierarchy in both English and
Brazilian Portuguese. Source origin fields are never the first thing
a casual visitor must decode.

## Source-safe recipe deduplication

The 23,586-ID client data was NOT rewritten.

The pure `buildClientRecipeViews` function groups original ItemType
definitions by the **exact same material ItemID + quantity list**.
Missing `Unit` in a general source record does not produce a fake
second crafting option if a more specific original record has the same
ingredients and recorded Unit. All original source row IDs survive.

If known batch quantities conflict, no unit is selected. Different
material lists always remain separate. No client-only recipe is
claimed to be live-server craftable.

Verified examples:

- Spirit Sword, ID 1: two general/specific original definitions,
  **one ingredient list**; original materials Coral ID 5100 ×5 and
  Maple ID 6080 ×4. Batch 1 is partially recorded (specific only).
- Abyssal Oriharukon, ID 4819: one original ItemTypeStone source
  definition; original output Unit 500, materials ID 8494 ×1 and
  Oriharukon ID 20339 ×1000.

## Visual/UI principles

- Atlantica-inspired dark steel and restrained bronze/gold trim,
  matching the already published monster bestiary;
- high-contrast body text, player-oriented headings, readable tables,
  alternating rows, tabular quantities, horizontal overflow only for
  optional dense technical tables;
- meaningful ingredient links and "Find monster drops" next actions;
- native semantic HTML `dl`, `table`, `details` and keyboard focus;
- a scoped global stylesheet for **runtime-generated DOM**, avoiding
  Astro's static-only scoped CSS trap;
- no unauthorized or guessed art/icons/game mechanics.
- keep English and pt-br labels consistent.

## Quality gate

`tests/community-readable-item-records.test.mjs` audits both real
source examples, conflicting recipe variants, preservation of source
row IDs, table accessibility and correct content order. All previous
original client/loot SHA verification and the full Astro production
build remain mandatory before merge.
