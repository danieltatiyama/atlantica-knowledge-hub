# Guide publication from Pages CMS

## What "published" means

Pages CMS writes guide files in a Git branch. It does **not** deploy that branch to the public Cloudflare Workers site. The public Wiki builds from **main**. A guide appears only when:
- It is on `main` under `src/content/guides/{lang}/{translationKey}.md`.
- Its frontmatter has `draft: false` and `reviewStatus: approved`.
- The public site deployment has picked up the merged main commit.

## New safe workflow (Stage 20.70)

1. In Pages CMS, edit the guide on `dev/i18n`; set **Editorial Status = Approved** and **Draft = off**. Save.
2. From the same development branch, choose **Request publication PR for approved guide (DEV)**. Select its language and article identifier (for example, `vip-system`, not the full filename).
3. The `pages-cms-guide-publication.yml` workflow validates the exact selected article and creates a new `publish/guide-...` branch **based on main**, copying only that approved Markdown file and its referenced images.
4. Images are copied byte-for-byte into `public/images/guides/{translationKey}/`. The Markdown image URLs are scoped to that directory, avoiding collisions between unrelated CMS uploads.
5. A PR into `main` is opened for CI and review. **The action does not merge a PR or deploy automatically.** Review the diff and let the normal GitHub Actions checks run. Merge the PR when approved.
6. After Cloudflare's deployment completes, inspect the page in production, including images and English/PT-BR navigation as applicable.

Controls: rejects drafts, unapproved articles, mismatched language/key, unsafe image paths, missing images, file collisions on main, unexpected staged changes, and requests launched outside `dev/i18n`. The action does not copy unrelated changes from `dev/i18n` or overwrite an existing main article.

**GitHub configuration:** creating pull requests with `GITHUB_TOKEN` may require enabling repository Settings → Actions → General → Workflow permissions → **Allow GitHub Actions to create and approve pull requests**. If this is disabled, the workflow will fail clearly after pushing its isolated branch; a maintainer can open the PR manually.

## First guide: VIP System

The user-authored `VIP System` article was already integrated into `main` by [PR #93](https://github.com/danieltatiyama/atlantica-knowledge-hub/pull/93), with `draft: false`, `reviewStatus: approved` and 16 source-preserved images in `public/images/guides/vip-system/`. Do **not** request publication again for this same filename; the new workflow intentionally rejects a duplicate article on main.

The integration on GitHub does not by itself prove that the Cloudflare site has finished deploying. Check the live page independently.

## Validation

```sh
node --test tests/guide-publication-workflow.test.mjs
npm run build
```

No workflow test creates real branches or PRs: actual GitHub actions run only via explicit Pages CMS invocation.
