# Stage 20.93 — Shared table sorting

Players can click a column heading to alternate ascending/descending order.
Native buttons support keyboard activation, visible direction indicators,
`aria-sort` and localized status announcements in all eight Wiki languages.
The shared component lives in BaseLayout, so ordinary tables in articles,
equipment, item/monster profiles, recipes, drops, maps, mercenary references,
market research and numerical summaries receive the same controls. A scoped
MutationObserver handles tables and rows created after asynchronous loads.

## Values and state

- Text uses locale-aware natural ordering, case/accent insensitive with stable
  ties. Names sort independently of aliases, profile badges and source disclosures.
- Numeric cells use the document locale, including decimal commas, grouping,
  spaces, signed values and percentages. Raw-source tables explicitly use English
  numeric punctuation. `data-sort-value` carries canonical numeric values where
  the displayed cell includes other content (e.g. an attack range sorts by the
  same maximum attack value as the equipment catalog's existing dropdown).
- Exact decimal coefficients and BigInt arithmetic avoid rounding large prices.
  Missing values remain last in both directions; zero remains a real value.
  Ranges, formulas and conflicting values are not silently reduced to a single
  number. Unsupported composite values use natural text order.
- Header choices survive row replacement/filtering. Existing sort dropdowns reset
  the header choice explicitly. Header metadata is recreated for new headings.
  Moving existing row nodes retains links, event handlers and disclosure state.
  Editable planner inputs stay steady while being edited; sorting resumes after
  focus leaves the input.

## Entire datasets, not just the visible page

The complete item database and bestiary sort their full filtered arrays before
slicing pages. The Market uses the same shared comparator before its pagination.
Changing a heading resets to page one; subsequent pages and filters retain the
chosen order. Source-drop tables with Show more sort their full in-memory records
before restarting the displayed batch; additional batches follow that order.

The loot codex item chooser uses a card/list layout and is not a table. Its source
evidence tables support the new sorting. Existing source formulas and filters are
unchanged.

## Structural exceptions

Crafting dependency trees, the nation dungeon calendar and grouped skill-mode
matrices explicitly opt out with `data-sort="none"`. Sorting those rows would
separate children from parents or break time/group relationships. Tables without
a column heading and bodies with spanning cells are also left unchanged. Fixed
evolution material totals stay at the bottom; table footers are never moved.
Action-only comparison/detail/source columns are excluded where applicable.

## Verification

- Unit coverage: localized numbers, negative percentages, very large integers,
  missing/zero distinctions, stable natural text ordering, complete-dataset Market
  sorting across page boundaries and eight locale announcements.
- Browser QA on the static Astro build: map names ascending and descending,
  keyboard activation, accessible direction state; complete 23,586-item ID order
  (29999 first descending) across pagination; dropdown/header reset; bestiary
  CharID order retained after filtering Tree; dynamically loaded pt-BR drop rates
  (`0,25%` first ascending, `4,5%` first descending).
- The normal Astro dev command detaches, so QA serves a temporary copy of built
  pages through the supported static preview, leaving project development settings
  unchanged. Representative interactions were checked, not every published table.
- Full Node regression suite, Astro build and generated locale checks run before
  opening the PR. CI includes the new sorting tests.
