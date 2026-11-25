# Wiki name translation policy (Stage 20.82)

## Provenance and display

The English Global client remains the only authoritative name source available to the project. Regional clients are unavailable. The Wiki's AI-assisted translations are optional search aliases, not official regional names, not native-reviewed, and not evidence of availability in game.

- Bind every alias to exact entity kind, numeric ID and English name in snapshot 1. A changed source name must fail closed until explicitly reconciled. Different IDs with the same English name are not merged.
- Retain original names as titles, links, source records, and CSV/XLSX exports. The alias is a secondary labeled display/search field; it must never change keys, prices, recipe graphs, drop inference or player observations.
- No alias for a collision or unresolved identity. Empty coverage means English fallback, not an invented name.
- `src/i18n/wiki-name-glossary.mjs` contains 36 editorial terminology entries in eight locales. It guides manual review, not automatic word-by-word replacement.
- Translate common nouns according to meaning; resolve ambiguous terms by game context (e.g. armor vs physical defense, gun vs cannon, cloth vs equipment). Preserve proper names, Roman numerals, grade markers, [VI], item codes, set names and franchise terms unless a contextual translation is explicitly reviewed. Do not mechanically translate names like Spirit or Guardian across unrelated identities.
- Keep source and translation separate. Localized search uses the selected locale, preserves ID and English searching, and does not imply an official localization.
- Add new entries in small verified batches; verify exact source identity, unique kind/ID, nonempty seven translations, and original data regression. Expand common crafting materials first; then equipment, other items and creatures. Mercenary and skill aliases require a separately verified stable identity index.
- Existing UI dictionaries are not rewritten by this glossary; any harmonization must be reviewed in context.

## Batch expansion and reporting

Material and consumable batches are separate modules imported by `wiki-name-aliases.mjs`. For explicitly selected grade families, reuse the reviewed family wording with the exact Roman grade marker; never derive source IDs by arithmetic or assume that a grade exists. Enchant Stone and Enhance Stone are separate concepts. Do not use automatic substring replacement across unrelated names.

Run `node scripts/report-wiki-name-alias-coverage.mjs` to inspect named-item and creature coverage by original category and market reference coverage. The report is diagnostic, not a gameplay availability claim or official translation inventory. Prioritize verified source identities and do not infer that market presence indicates crafting usage frequency.

### Equipment descriptive aliases

For the 551 reviewed equipment profiles and three additional source-bound NPC equipment references, the alias is a localized equipment type followed by the exact English family label (for example, "Espada — Twilight"). These are descriptive bilingual aliases, not full official name translations. The original item name remains the title. Selected equipment types and family labels were explicitly enumerated against snapshot 1; the final registry stores exact identity rows, not a runtime guess. Search can match both words in either order. Chain Helm/Chain Helmet wording may share a type label, but source IDs and English names are never merged. Future family-name translations require contextual review.
