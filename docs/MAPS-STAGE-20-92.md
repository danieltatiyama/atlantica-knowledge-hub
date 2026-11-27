# Stage 20.92 — Maps, sections and monster locations

The map catalog at `/maps/` and all seven localized paths connects locations,
sections and monster profiles. Search accepts official location/section names,
monster names, map IDs and CharIDs; dungeon type can be filtered independently.
Selecting a location opens its section selector, recorded entry levels, available
map image and monsters. Monster profiles link back to every recorded location.
Language switching preserves the selected map, area and search filters. Browser
back/forward restores selection. Names remain official English names; controls
and coverage/error/empty messages support eight locales and existing themes.

## Evidence and boundaries

The user supplied game tables and four Field Info screenshots, then explicitly
authorized proceeding without monster position overlays. Read-only extraction
found 142 HuntMapInfo location groups, 606 section references and 580 distinct
section IDs. All 970 MapNameNum text IDs used by the supplied MapInfo resolve
against TextMgr_Map_ENG; GateTxtIdx uses a separate text namespace.

NPCGroupInfo.dat has the literal header `6000` and 12,000 fixed 444-byte records,
5,620 nonempty. Map ID at record offset +4 and ten candidate CharID slots at
+84 + slot*36 produce 3,203 distinct map/character pairs. Exactly 2,255 pairs
join the existing bestiary by CharID, Kind and English name (1,883 monsters,
365 map IDs). These are client-recorded location candidates, not independently
verified current server spawns. The 779 nonmatching character IDs stay excluded
from monster lists; they are not automatically classified as NPCs.

The published union of section references and matched monster locations has
677 map IDs. IDs 497, 498, 499 and 3779 are absent from the supplied MapInfo;
they retain null names/limits/images and explicit unresolved labels. Four
duplicate MapInfo IDs are recorded in the audit; no ambiguous row is selected.
No relation is propagated to another floor, instance copy or map sharing a type.
Instanced dungeon coverage and IndunMonPool interpretation remain incomplete.
Absence of an extracted location never means a monster cannot occur there.

## Screenshot checks

| Map ID | Section | Matched monster set |
| --- | --- | --- |
| 102 | Forest of Spirits (Hanyang) | 10 / 10 |
| 3002 | Grave Overground | 5 / 5 |
| 129 | Great Plaza | 6 / 6 |
| 272 | Eagle Mountain | 4 / 4 |

Devil Tree #205 resolves to 102, 165, 166 and 167, matching all four locations in
the Monster Information screenshot. These checks validate the examples, not all
records. Recorded monster levels reuse the bestiary snapshot; confirmed adaptive
identities show no fixed level in map tables. No loot, scaling or combat formulas
change.

## Images and reproducibility

Four user-supplied DDS assets were recovered to PNG and visually compared with
the corresponding screenshots. The import converts only these reviewed images
to lossless WebP, verifying exact RGBA pixels and recording hashes and sizes.
No image is assigned from map-type similarity. Original backgrounds and aspect
ratios are retained. Other sections explicitly state that no image is available.

Run `python scripts/import-client-maps.py /path/to/extracted-review-package`
with Python + Pillow against the audited private extraction. The importer
validates exact published monster identities and screenshot sets, then writes
`public/data/client-maps/catalog.json`, `evidence.json` and the four assets.
Evidence includes source hashes, map source lines, binary record/slot offsets,
exclusions and limitations. No decoder or full game source files are published.
The runtime uses the same catalog in both directions, a shared retryable fetch
and DOM-local async profile containers to prevent stale selection replacement.

## Validation

`tests/client-maps.test.mjs` checks all joins and reverse links, exclusions,
unresolved maps, screenshot sets, image hashes, query/type behavior and locales.
CI runs it plus the existing build, locale and profile regressions. Generated
map pages are checked for localized controls and all eight hreflang alternates.
Local Astro build, all 409 Node regression tests, generated locale/hreflang checks
and translation publication checks passed. The managed preview did not start:
the existing Astro development command detaches into background mode, while the
preview supervisor expects a foreground process. Browser visual/interaction
review remains pending; application development settings were preserved.
