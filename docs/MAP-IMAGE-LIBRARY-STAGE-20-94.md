# Stage 20.94 — Map image library

The map catalog links to `/maps/images/` in all eight locales. The image library contains 567 distinct lossless WebP images and lazy thumbnail previews from 659 converted sources. Search matches source paths, map names and IDs; collection filters and size/pixel/name sorting run on the full matching set before pagination. The native modal offers full resolution, all identical origins and candidate section links. Images retain their original dimensions and alpha; duplicate RGBA pixels share assets.

Map selection preserves the four previously reviewed images. A separate manifest joins exact case-insensitive NMap folder names to each existing map's MapTypeCode. Of 677 sections, 626 have exactly one distinct pixel image (including the four reviewed examples). The remaining new associations are explicitly labeled as client-type matches, unverified in game. 44 sections have multiple distinct candidates: no automatic image is selected, and the library shows their variants. NBattleMap sources never become field-map images. No identity, spawn area, monster relation or current server availability is inferred from visual similarity.

The audited input has 660 origins. All source sizes and SHA256 were verified before conversion; every full-resolution WebP was reopened and compared to decoded RGBA pixels. There are 92 duplicate pixel copies. One 4096-byte source, NMap/TBSAfrica01/TBSAfrica01.DDS, lacks sufficient image data; its failure and hash remain recorded in the manifest, with no placeholder or replacement. Raw game files and the decoder are not published. The offline extraction ZIP retains this original as a pending source.

Reproduce the public assets and manifest with:

```sh
python3 scripts/import-map-image-library.py /path/to/atlas-atlantica
```

This importer consumes the already audited and converted library, verifies complete WebP hashes, and recomputes candidate map links against the current public map catalog. It does not decrypt or decode game files. The existing catalog/evidence snapshots remain unchanged; images are loaded from `/data/client-maps/images.json`. A failed image-manifest load does not prevent map/monster browsing.

Regression tests cover every full-image hash and length, every origin, exact joins, all ambiguous exclusions, battle-map separation, the reviewed-image priority, search/ordering and translated controls. Run `node --test tests/map-image-library.test.mjs tests/client-maps.test.mjs` and the usual build/locale publication checks.
