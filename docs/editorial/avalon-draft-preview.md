# Avalon draft integration — editorial review

This branch introduces a bilingual, **unpublished** Avalon overview through the existing Astro guides collection. It is not an import of mined client data.

## Local review

```powershell
git fetch origin
git switch feat/avalon-editorial-preview
npm install
npm run dev
```

Open:
- English: http://localhost:4321/editorial-preview/en/avalon-overview/
- Portuguese: http://localhost:4321/editorial-preview/pt-br/avalon-overview/

The preview routes return **no static paths in production builds** via `import.meta.env.DEV`. Draft guides remain excluded from normal public routes and guide lists by the existing `!data.draft` filters. Do not remove `draft: true` or change `reviewStatus` to approved without editorial review.

The article uses the native `GuideArticle.astro` layout. The layout now fills up to the established `--content-width: 1280px` instead of applying an additional 1100px restriction; the main content grid can grow while the right-hand TOC stays near 220px.

## Scope

- Two files under `src/content/guides/{en,pt-br}/avalon-overview.md`
- A local development-only draft route at `src/pages/editorial-preview/[lang]/[slug].astro`
- A desktop-width adjustment in the shared `GuideArticle.astro`

**No** client raw rows, mined numerical IDs, event indices, proprietary configuration tables, or local screenshots are committed.

## Verification checklist

1. Run `npm run build` and confirm zero `editorial-preview` static pages are generated.
2. Run `npm run dev` and open both preview URLs above.
3. Check default-language and PT-BR headings, tables, breadcrumbs, TOC and responsiveness.
4. Check existing public articles to ensure the increased content width looks right.
5. Do not approve or publish Avalon until content, mechanics, and image rights have been reviewed.

The conditional rescue spawn mechanic remains unverified on the current server.
