# Stage 20.48 — Site-wide wiki appearance themes

## Theme choices

The header now exposes a visible **Theme / Tema** selector beside Language in
English and Brazilian Portuguese. Options:

| ID | English | Português | Intent |
|---|---|---|---|
| `atlantica` | Atlantica | Atlantica | Current classic game-inspired colors; **default** |
| `dark` | Dark | Escuro | Neutral slate reading mode |
| `light` | Light | Claro | Bright, high-legibility documentation |
| `parchment` | Parchment | Pergaminho | Warm ivory and sepia, fantasy-document style |
| `midnight` | Midnight Blue | Azul noturno | Deep-blue, subdued reading |
| `contrast` | High Contrast | Alto contraste | Black, white and yellow accessibility alternative |

Atlantica's existing values in `src/styles/global.css` are intentionally
unchanged. `src/styles/themes.css` supplies the five optional palettes and
explicit overrides for areas that previously contained hardcoded dark colors.

## Behavior and compatibility

- Saves the explicit reader choice as `localStorage["atlantica.theme"]`.
- Reads a validated six-ID allowlist in an inline script in `BaseLayout.astro`
  **before first paint**, avoiding a dark-to-light visual flash.
- Applies `data-theme` to the root `<html>` element.
- No stored preference, invalid value, blocked local storage or private mode
  fallback: **Atlantica**.
- Changes instantly without reloading, preserves route, query string,
  current profile, filters, collapsed sections and selected language.
- Supports both EN and PT-BR with the same IDs and stored preference.
- Responds to `storage` events to synchronize other tabs.
- Uses appropriate `color-scheme` for native form controls.
- No automatic OS-theme override: a visitor who did not choose a theme
  continues seeing the original Atlantica appearance.

## Surfaces covered

- Header, navigation and selector controls;
- Home cards and Guides category art;
- Guide articles/tables, equipment lists and item acquisition panels;
- Bestiary, creature detail, grouped drop results and Loot Codex;
- Universal item catalog, crafting/recipe details, original source rows;
- In-game styled item information panel and reversed monster-drop links;
- Floating index, panel controls and collapsible headings.

All non-classic overrides use `html[data-theme]:not([data-theme="atlantica"])`
to avoid accidental changes to the default visual design.

## Verification

```bash
node --test tests/wiki-themes.test.mjs
npm run build
```

The pull request workflow runs the theme regression test and Astro build.

Manual browser review after deployment: try all six themes on Home, Guides,
`/items/`, `/items/database/` (open a crafted item with recipes),
`/monsters/?id=289` (drop table), the Loot Codex, an equipment profile and
a mobile-width header. Switch language, refresh, open another tab and verify
persistence and all input/table contrasts.

No modifications were made to original client datasets, drop percentages,
GroupBands, reverse loot links, or recipe calculations.
