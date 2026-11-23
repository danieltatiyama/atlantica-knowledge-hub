# Stage 20.55 — Equipment crafting rules and Jana4U-inspired recipe planning

## Verified player rule versus game-client evidence

The Game Client `ItemType*.ndt` tables contain material lists and sometimes a `Unit` quantity. A missing `Unit` does not mean that a recipe has no batch size in the game.

The user confirmed in-game:

| Product | Batch size | Maximum output per operation | Basis |
|---|---:|---:|---|
| Equipment | 1 item | 20 items | Player-confirmed gameplay |
| Other crafting products | Original source `Unit` where valid; otherwise ask the player | 10,000 items | Original client and separate player-reported rule |

The equipment rule is now displayed in three places: the crafting calculator, the equipment detail view, and the full client item database. Original Unit values remain untouched.

Equipment recognition uses the catalog's original client source category, matching the equipment-like categories already used by the Wiki's full item database. This is a client category heuristic, not proof that the item remains craftable on the live server.

Concrete examples from source snapshot 1:

- Judgment Heavy Armor (`ItemID 645`) has specific Armor row with `Unit=1`, and an additional generic Defence row with `Unit=null`. Requests for 41 items require 41 batches and **3 operations** (20 + 20 + 1).
- Apocalyptic Heavy Armor (`ItemID 18801`) has only a generic Defence row with `Unit=null`. The equipment rule supplies **batch size 1**, so the player is no longer asked to invent a batch size for this equipment.
- Abyssal Oriharukon (`ItemID 4819`, Stone category) has `Unit=500` in the client; its non-equipment batches and 10,000 output limit stay unchanged.

**Never mutate original `Unit` data.** The source-audit and item technical views must continue displaying the raw values and their uncertainty. The player-rule calculation is a separate derived presentation.

## User-facing features

The calculator (`/tools/crafting/` and `/pt-br/tools/crafting/`) now provides:

- Hierarchical, expandable crafting tree with collapsible source ingredients
- Shared material references counted only once in totals, despite links from multiple parents
- Buying versus crafting intermediate materials (explicit per-item choice)
- Consolidated shopping list with user-entered prices, known/partial total and CSV export
- Copyable shopping list
- Craft schedule with batches, operation counts and per-item production limits
- Leftover/excess quantities produced by batch rounding
- Small overall summary metrics (total output, batches, operations, shopping items)
- Local-only storage of manually entered item prices, without external market claims
- Existing recipe variant selectors and manual batch inputs preserved where evidence is missing
- Source links to original item IDs and bilingual labels
- All six theme variants via Wiki color tokens

These views are independent read-only visualizations of the existing client data. The user can buy intermediate items instead of crafting them; no price-based automatic choice is performed without all required prices.

## Reference and attribution

The presentation and feature ideas were reviewed against the MIT-licensed open-source work by Jana Dvořáková (Jana4U):

- [Online calculator](https://craftcalculator.jana4u.net/)
- [Web frontend](https://github.com/jana4u/atlantica_online_craft_calculator_web)
- [Rails engine](https://github.com/jana4u/atlantica_online_craft_calculator_engine)
- [Ruby calculation library](https://github.com/jana4u/atlantica_online_craft_calculator)

The Wiki implements its own TypeScript/JavaScript arithmetic and Astro UI, using its own client-extracted data. No third-party game database or server calculation has been copied into the Wiki.

The Jana4U calculator also presents workload, craft experience, estimated time, and required skills. These **were not ported** because the current Wiki source contract does not establish all required calculations reliably. The original client `workRaw` is available in technical records, but it must not be treated as validated craft XP or time without new evidence.

## Verification

```sh
node --test tests/client-crafting-gameplay-tree.test.mjs
node --test tests/client-crafting-planner.test.mjs
node --test tests/client-craft-batch.test.mjs
npm run build
```

Manual visual checks across Atlantica, Light and Parchment themes:

1. `/tools/crafting/?id=18801`, quantity 1: no manual batch prompt; equipment limit 20; original list of ingredients is shown.
2. `/tools/crafting/?id=645`, quantity 41: three operations, 41 batches; no false 10,000 equipment cap.
3. `/tools/crafting/?id=4819`, quantity 1: original Stone batch 500 remains and displays 499 excess units.
4. Change an intermediate item from Craft to Buy and verify tree, shopping list and costs reflect it.
5. Enter a price, refresh and verify its persistence only in the same browser.
6. Verify the item links, copy/CSV buttons, expanded/collapsed tree, large nested recipes and mobile layout.
7. Confirm the equipment profile itself displays the user-confirmed 1×20 rule while technical Unit remains intact.

Do not mark interactive browser QA as complete solely because GitHub Actions is green.


## Stage 20.56 — Recipe-only selection and exact crafting quantities

The player confirmed that crafting takes place **only in full batches**. A source batch of 50 permits output 50, 100, 150, ... but never 51. The output selection range is limited to **10,000 units per planning request**. This planning limit differs from the per-operation equipment cap of **20 items** (a 1,000-item equipment plan is possible, divided into 50 operations).

The calculator now:
1. Lists only named client items whose indexed source records declare materials (row[7] = 1); before accepting a selection it verifies the actual parsed recipe in the original detail shard.
2. Sets numeric input min=batch, max=floor(10000/batch)*batch, step=batch; the slider uses the same values and the two inputs stay synchronized.
3. Rejects a non-multiple quantity rather than rounding the top-level requested output silently. The underlying planning engine supports strictTargetBatch for UI calls. Intermediate crafting still rounds material demand UP to a whole batch as required by gameplay.
4. For a source with multiple recipe variants, asks which variant should determine the batch before activating quantity controls.
5. For a missing/unreliable source Unit on non-equipment, explicitly requests the minimum batch size instead of guessing it. Equipment always uses the separate confirmed batch 1 rule.
6. Accepts ?id=... links only after validating that the ItemID is a recipe-bearing, named client entry.

**Provenance caveat:** having a recipe in client files is not proof that an item remains craftable in the live 2026 server. The autocomplete is labeled as client recipe items, not server-verified craftable items.

Regression suite: tests/client-crafting-quantity.test.mjs checks real client items #645/#18801/#4819, exact quantity steps, absent and alternate recipes, source-only autocomplete exclusion and the strict engine. The deployed UI must still be visually checked.
