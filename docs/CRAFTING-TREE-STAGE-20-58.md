# Stage 20.58 — Crafting Tree Depth, Batch Accounting and Operation Splits

## User-confirmed crafting rules

- Crafting produces **whole batches only**, even for intermediate items used in another recipe.
- An intermediate needed at **250 units with batch size 20** must be made in **13 complete batches**, outputting **260**, leaving **10 units**. Its own inputs are multiplied by **13** complete batches, never by 12.5.
- Every crafted item, not only the target item, obeys its per-operation capacity: **20 output units per operation for equipment**, **10,000 for other crafting** (subject to the item's full-batch size). A large plan may span multiple operations.
- The maximum output *per operation* is separate from the main recipe planner's 10,000-unit selection limit. An intermediate may require much more than 10,000; the engine divides that stage into legitimate operations.
- All demands for the same ItemID across several parents are combined **before rounding** to the intermediate's batch size, so the same shared intermediate is not manufactured or priced twice.
- Client-derived recipes and Unit values are kept intact; equipment batch=1 and 20/op remain player-confirmed rules, not claims about the original client data.

## Operation grouping in the engine

`src/data/client-crafting-planner.mjs` exposes `splitCraftOperations`. It groups identical full and final operations without materializing one array element per craft operation.

For example:

| Item/stage | Required | Batch | Batches | Produced | Leftover | Operation output breakdown |
|---|---:|---:|---:|---:|---:|---|
| Example intermediate | 250 | 20 | 13 | 260 | 10 | 1 × 260 |
| Dumpling | 35,000 | 10 | 3,500 | 35,000 | 0 | 3 × 10,000 + 1 × 5,000 |
| Grilled Pork | 35,000 | 10 | 3,500 | 35,000 | 0 | 3 × 10,000 + 1 × 5,000 |
| Non-divisor batch example | 35,000 | 300 | 117 | 35,100 | 100 | 3 × 9,900 + 1 × 5,400 |
| Equipment intermediate | 41 | 1 | 41 | 41 | 0 | 2 × 20 + 1 × 1 |

**Concrete real-source example:** Producing 10,000 Albert's Special Bait (#2319) requires 35,000 Dumpling (#3305) and 35,000 Grilled Pork (#3310), each with source Unit=10. Each subproduct is divided into four operations. Dumpling consumes 21,000 Wheat and 14,000 Pork, Grilled Pork consumes 28,000 additional Pork plus 14,000 Salt, and the shared Pork total is 42,000. The original bait recipe also consumes 5,000 Sesame Oil.

## Player-facing UI

`src/components/CraftingPlannerPage.astro` contains a scrollable, aligned, accessible crafting tree table with columns:

1. Item/Recipe with expandable hierarchy
2. Branch need (contribution from its immediate parent)
3. Total needed (aggregated material consumption)
4. To produce (whole-batch-rounded output; excess is shown)
5. Per batch (units in each full batch)
6. Batches (number of complete batches)
7. Operations (count of valid crafting actions)
8. Operation breakdown, such as `3 × 10,000 + 1 × 5,000`
9. Buy/Craft toggle for intermediate items

The row title and left border use eight repeating depth colors. Dark/Atlantica/Midnight use bright readable colors; Light/Parchment use darker variants and High Contrast uses the platform's yellow. Expand/collapse state is based on stable tree paths so it survives recalculation. The separate production schedule now also includes batch size, operation breakdown and excess.

## Validation

```sh
node --test tests/client-crafting-tree-operations.test.mjs
node --test tests/client-crafting-gameplay-tree.test.mjs
node --test tests/client-crafting-planner.test.mjs
npm run build
```

Manual deployed-site review is still important: check the 10,000 bait example, expanded/collapsed rows, color contrast across themes, the horizontal table at desktop/mobile widths, Buy/Craft toggles and an intermediate that requires rounding from 250 to 260.

**Do not confuse `Branch need` with total demand:** when an ingredient appears in multiple branches the rows carry the distinct per-parent contributions, while `Total needed` displays the combined ItemID requirement. Branch references to shared items are labeled as such.
