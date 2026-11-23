# Stage 20.62 — Done/Undo workflow, centered tables and ingredient-aware crafting limits

## User decisions

The player requested:
1. Centered numeric values across the Crafting Tree, Craft Schedule and Shopping List (item names remain left-aligned).
2. A reversible **Done / Feito** control next to Buy/Craft: mark a material or product fulfilled, remove its pending tree branch and all descendants, and stop including it or its descendants in the pending shopping list and production schedule.
3. Correct the operation limit for **Strong Fishing Line** and **Strong Fishhook**: an operation may not require more than **10,000 units of any one ingredient**, even if its output remains at or below 10,000.

These gameplay constraints are user-confirmed and are kept separate from original ItemType material values.

## Operation feasibility (new rule)

The maximum *whole batches* per crafting operation is the smallest of:

- `floor(maximum output units per operation / batch size)`
- for **each original recipe ingredient**, `floor(10,000 / ingredient units per batch)`

The material constraint is evaluated on **each crafted item in the full recipe tree**, including intermediates and the final product. An ingredient recipe using over 10,000 units in one indivisible batch is shown as unresolved/unsupported rather than falsely marked craftable.

Example from the extracted source:

| Product | Batch output | Ingredient limiting the operation | Maximum whole batches/op | Output per operation |
|---|---:|---|---:|---:|
| Strong Fishing Line (#2320) | 20 | 200 Thread (#7081) per batch | 50 | **1,000** |
| Strong Fishhook (#2321) | 20 | 100 Large Animal Bone (#8003) per batch | 100 | **2,000** |
| Titanium Fishing Rod (#2318) | 10 | 20 Strong Fishhook (#2321), among other ingredients | 500 | **5,000** |

Thus, 10,000 Strong Fishing Line requires 10 operations of 1,000 each, and 10,000 Strong Fishhook requires five operations of 2,000. Ten thousand Titanium Fishing Rods use two operations of 5,000, and their crafted subitems follow their own constraints. The *total ingredients* for the complete plan are unchanged: only valid operation grouping is more restrictive.

The same rule changes the formerly displayed single-operation plan for 10,000 Albert's Special Bait (#2319). Its parent source recipe consumes 350 Dumpling and 350 Grilled Pork per batch of 100. The player cannot consume 35,000 of either ingredient in a single operation, so the bait itself is divided into **3 × 2,800 + 1 × 1,600** (4 operations). Its ingredient *consumption breakdown* therefore becomes **3 × 9,800 + 1 × 5,600** for each of Dumpling and Grilled Pork. Each of those intermediates still requires four production operations. Combined: 12 operations.

**Do not confuse:** the existing 10,000-unit upper limit of the *Desired output* control is a UI planning cap; intermediate stages may require more than 10,000 items and be broken into many valid operations.

## Done / Feito

The engine accepts `doneIds` as a list of fulfilled ItemIDs. The requested quantity for an ItemID is treated as supplied. The node and all its descendants disappear from the *pending* Crafting Tree. No descendant materials from this branch are charged, purchased or produced.

Demand for **shared ingredients** is aggregated across the remaining uncompleted branches; a shared item must never disappear merely because an unrelated parent was marked done. The engine keeps `completedRows` for restoration and progress display.

The UI adds:

- **Done / Feito** for every displayed tree item, alongside Buy/Craft when appropriate.
- A separate **Completed / Concluídos** section listing fulfilled items and quantities.
- **Undo / Desfazer** per item plus **Undo all / Desfazer todos**.
- Completion applies to the entire ItemID within the current plan, even if that ID appears in multiple branches; the panel explains this. Marking the root done clears the pending tree/schedule but leaves Undo available.
- Completion is **session-local**: it resets when selecting a different target or reloading. The original client recipes and manually entered prices are not affected.

The XLSX and CSV exports reflect the remaining plan: completed branches are omitted from pending tasks and purchases.

## Visual changes

Numeric quantities, operation breakdowns, consumption breakdowns and number-oriented headers are centered across all three crafting tables. Item names retain left alignment. Input prices and Buy/Craft/Done buttons are centered within their columns.

## Files and verification

- Engine: `src/data/client-crafting-planner.mjs`
- UI: `src/components/CraftingPlannerPage.astro`
- XLSX operation capacity: `src/data/client-crafting-xlsx.mjs`
- Tests: `tests/client-crafting-completion-ingredient-cap.test.mjs` and updated older suites for operations/Excel/consumption
- CI: `.github/workflows/validate-pr.yml`

Suggested checks:

```sh
node --test tests/client-crafting-completion-ingredient-cap.test.mjs
node --test tests/client-crafting-tree-operations.test.mjs
node --test tests/client-crafting-xlsx-and-ui.test.mjs
node --test tests/crafting-operation-consumption-calendar-readability.test.mjs
npm run build
```

Browser QA after deployment: verify Strong Fishing Line / Strong Fishhook operation splits; centered columns and horizontal snap in different themes; Done on a nested item with shared materials, Undo from the Completed section, and root Done/Undo. Confirm that changing the selected item resets Done state.
