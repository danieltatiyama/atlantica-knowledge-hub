# Stage 20.59 — Crafting UI, parent consumption breakdown, Excel workbook

## User-facing changes

The Crafting Calculator's **Craft Schedule** and **Shopping List** were visually reorganized into consistent theme-aware panels with readable hierarchy, table headers, aligned numeric quantities, subtle row striping, operation-group badges, price inputs, a visible estimate summary, and responsive horizontal scrolling. These changes preserve the existing recipes, choices, prices, client provenance and six supported Wiki themes.

The **Crafting Tree** adds a new **Consumption breakdown** column next to **Operation breakdown**. **Stage 20.61 updates its display:** rather than showing the batch-level formula described below, it now groups ingredient consumption by each operation of the parent product (e.g. 1 × 5,000 Anarchy Stone for one operation of 20 Judgment Heavy Armors, or 7 × 5,000 + 1 × 500 for 142 armors). The original source batch-level values remain stored and inspectable. The Excel export uses the same operation-based presentation.

Previously: The **Crafting Tree** adds a new **Consumption breakdown** column next to **Operation breakdown**. It explicitly explains the material requirement imposed by the parent recipe, on each ingredient row:

`original ingredient units per parent batch × parent crafted batches = amount consumed from the parent branch`

Concrete source examples for 10,000 Albert's Special Bait:

- Dumpling: **350 per bait batch × 100 bait batches = 35,000 consumed**.
- Grilled Pork: **350 × 100 = 35,000 consumed**.
- Wheat: **6 per Dumpling batch × 3,500 Dumpling batches = 21,000 consumed**.
- Pork under Dumpling: **4 × 3,500 = 14,000 consumed**.
- Pork under Grilled Pork: **8 × 3,500 = 28,000 consumed**.

Each branch shows its own consumption calculation, while the shared `Total needed` value for Pork is **42,000**. This distinction matters: never treat the repeated *total* on both Pork rows as additional consumption. The root item has no parent and shows a dash.

For a lower-level item that requires **250 units with batch 20**, the parent consumes **250**, the child produces **260** in 13 complete batches, and its own children must be calculated for **13** batches. Parent consumption is not overwritten by child production.

## Export Crafting Tree to Excel

**Export spreadsheet (.xlsx)** beside the tree's Expand/Collapse controls downloads an actual Office Open XML workbook directly in the browser (not HTML/CSV renamed to xlsx). No server calls or new dependencies are necessary.

The workbook has four sheets:

1. **Crafting Tree** — all visible and collapsed hierarchy rows, depth, source ItemID, name, parent item, parent branch consumption, aggregated total, actual produced quantity, excess, batch size and count, operation count and breakdown, parent-batch consumption factors, item mode, shared references.
2. **Craft Schedule** — all crafted products, original requirement, rounded output, batch size/count, operations, cap per operation and operation breakdown.
3. **Shopping List** — consolidated material purchase list, manual unit prices copied from the calculator, with native Excel cost formulas to update costs when prices change inside Excel. Blank unit prices remain blank.
4. **Leftovers** — surplus amounts created by full-batch rounding.

Each sheet has a title, snapshot/limitation note, styled headers, appropriate column widths, numeric cell values, filterable headers and frozen headings. The Tree sheet carries eight depth color bands. Large integer quantities beyond Excel's 15-digit precision are exported as text, not silently rounded. Game item names are stored as **inline strings** to prevent formula injection.

The exporter is `src/data/client-crafting-xlsx.mjs`, with unit coverage in `tests/client-crafting-xlsx-and-ui.test.mjs`. It is dynamically imported only when clicking the export button.

## Integrity and limits

- Source ItemType material amounts are not changed.
- Equipment batch=1 and up to 20 output units per operation remain user-confirmed rules.
- Other products use original source batch size where valid, respecting 10,000 units per operation.
- Intermediates always craft whole batches and can be split across multiple operations; shared item demands aggregate before rounding.
- Exports are snapshots of the current Buy/Craft choices, recipe selections, batch amounts and prices. Changes inside an exported file do not synchronize back to the Wiki.
- A partial plan may still have unresolved recipe questions; the workbook flags this in the notes. It does not assert live-server craftability.
- The exported Shopping List price formulas are recalculated by Excel or compatible spreadsheet software when the file opens.
- The browser-generated ZIP uses the standard STORE method; exports are somewhat larger than compressed XLSX files, in exchange for being dependency-free and fully offline.

## Verification

```sh
node --test tests/client-crafting-xlsx-and-ui.test.mjs
node --test tests/client-crafting-tree-operations.test.mjs
npm run build
```

Review the published page in Atlantica, Dark, Light, Parchment, Midnight and High Contrast themes. For visual and Excel QA: select 10,000 Albert's Special Bait, expand tree, check per-parent consumption, type and clear unit prices, click **Export spreadsheet (.xlsx)**, open the resulting workbook, verify 4 worksheets, worksheet filters, indentation, numeric values, price formulas, grouped operation totals and source warnings.
