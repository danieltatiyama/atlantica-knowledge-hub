# Stage 20.46 — Community wiki navigation and accurate item categories

## Why

The wiki now has long equipment, monster, material and source-evidence
pages. Readers need a way to jump between sections without losing
their place, collapse what is not relevant, and reliably understand
the scope of top-level navigation.

## Single floating navigation

`src/components/FloatingWikiNavigator.astro` is loaded from
`BaseLayout.astro`, but is shown only when a supported information
page has at least two section headings. It presents one table of
contents rather than competing navigation panels.

- Choose **Left** or **Right**; the chosen side is saved in the
  browser's `atlantica.wiki-navigation.v1` preference.
- **Hide** the panel to reveal a compact fixed side tab; select
  that tab to reopen it. The visibility preference is retained
  between navigation and refreshes, subject to browser storage.
- On narrow viewports the panel starts hidden by default unless
  the reader already chose a preference, keeping article text clear.
- English and Portuguese labels, keyboard-focus indicators, Escape
  to hide, accessible button titles and a separate reopen control.
- Page section entries update automatically as original item/monster
  data is fetched, or a new item/monster is selected.
- Navigation is grouped into **Explore** and **Open profile** when
  the page has a loaded profile, rather than adding a second menu.
- Section links preserve the existing `?id=...` or `?item=...`
  query, while updating the hash for a copyable anchor. Native
  disclosures are opened when navigating to their records.

## Collapsible content

- A `+`/`−` button is attached only to meaningful section
  headings of information pages.
- The body is collapsed via CSS; the original source tables, forms,
  interactive controls, DOM nodes and source IDs are **not deleted,
  re-fetched or reconstituted** on expansion.
- Native details such as **Original client records** participate in
  the same index and remain native disclosures.
- Markdown guides use the same floating index, replacing the older
  sticky article sidebar, and receive independently collapsible
  second-level and third-level headings while preserving their
  original Markdown links and tables.
- Long headings are safely truncated *in the index only*.
- Source and rate disclaimers remain available in their sections.

Supported routes include the universal 23,586-ID item explorer,
the 4,351-character bestiary and item lookup, all reviewed/source
equipment profiles, and article guides in en and pt-br.

## Header / home clarification

Previously the main header called `/items/` **Items**, while it
actually indexed only 2,462 equipment-like source IDs. It now has
two distinct entries:

| English | PT-BR | Destination | Scope |
| --- | --- | --- | --- |
| Equipment | Equipamentos | `/items/` | 2,462 equipment-like IDs |
| All Items | Todos os itens | `/items/database/` | All 23,586 client ItemIDs |

The Home page also has separate cards for **Equipment & Boxes** and
**All Items** with proper contextual descriptions. Header active
state correctly distinguishes the two even though their paths
share the `/items/` prefix. Header spacing reflows on narrower
viewports rather than clipping the new category.

## Quality and constraints

- No game data, original source JSON, crafting counts or historical
  item/drop interpretations changed.
- No copyrighted game assets are copied into this navigation.
- `tests/wiki-navigation.test.mjs` covers language labels,
  preference behavior, source-page activation, async section
  refresh, native disclosures, guide replacement and header
  taxonomy.
- All original source-integrity checks and Astro production build
  remain required for PR merge.

## Human visual verification

After deployment, validate one item detail, one monster detail,
one long equipment profile and a long guide at 2540 × 1440 with
125% browser zoom, plus a narrow/mobile viewport. Confirm that
collapse/expand preserves running filters and that left/right/hide
preferences survive a page refresh. Build/CI alone does not
establish these browser-level results.
