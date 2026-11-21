
# Atlantica Knowledge Hub — Article Templates

This directory contains editorial templates used to maintain
consistent documentation across the Atlantica Knowledge Hub.

## Available Templates

| Template | Purpose |
| --- | --- |
| [Nation Dungeons](NATION-DUNGEON.md) | Dungeon requirements, mechanics, walkthroughs, rewards, and scheduling |
| [Mercenaries](MERCENARIES.md) | Mercenary statistics, skills, equipment, builds, and formations |
| [Game Systems](GAME-SYSTEMS.md) | Game mechanics, formulas, calculations, experiments, and reference data |

For a general-purpose structure, see
[Article Template](../ARTICLE-TEMPLATE.md).

## Creating an Article

1. Open Pages CMS and select the appropriate language collection.
2. Create a new article and enter its title and description.
3. Set a unique `translationKey` shared across translations.
4. Select the correct category and optional subcategory.
5. Keep `draft` enabled while preparing the article.
6. Open the relevant template in this directory.
7. Copy the applicable sections into the article's Markdown body using Source mode.
8. Remove unused sections and replace all placeholders.
9. Add sources, screenshots, and verified information.
10. Review the article before disabling the draft flag.

## Translation Guidelines

- Write articles using the appropriate language.
- Keep the same `translationKey` for translations of one article.
- Preserve technical identifiers, formulas, and source references.
- Do not assume that all articles require identical sections.

## Evidence and Verification

Classify important findings when applicable:

- **Official:** Published by an official source.
- **Game Client:** Extracted from game files.
- **Observed:** Verified through in-game testing.
- **Inferred:** Derived from measurements or other evidence.
- **Unverified:** Not yet independently confirmed.

Document relevant conditions, source files, game versions,
and test dates.

Do not present hypotheses as confirmed game mechanics.

## Editorial Checklist

- [ ] Metadata is complete and accurate.
- [ ] Category and subcategory are consistent.
- [ ] Unused template sections have been removed.
- [ ] Placeholders have been replaced.
- [ ] Images, videos, and links work correctly.
- [ ] Technical statements have appropriate evidence.
- [ ] The article has been reviewed before publication.
