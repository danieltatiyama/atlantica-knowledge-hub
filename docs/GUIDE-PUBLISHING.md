# Guide publishing: Pages CMS → public website

## Current system

Guides are authored in the `dev/i18n` branch through Pages CMS. Saving a guide there **does not publish it on the live website**, even if the draft flag is disabled. The public Astro build reads guides from the `main` branch and includes only approved, non-draft entries.

A guide is eligible to be submitted only when:
- `draft: false`
- `reviewStatus: approved`
- Its `lang`, `translationKey`, and filename agree
- Its category/subcategory pass Astro content validation

The **VIP System** guide was published from `dev/i18n` through the separate PR #93. Its 16 referenced original PNGs were transferred byte-for-byte into `public/images/guides/vip-system/` on `main`. The source guide's author-written game information was preserved.

## Pages CMS workflow for the next guide

1. In Pages CMS, select the **dev/i18n** branch. Edit the guide, save images, and make sure the article is ready for review.
2. Choose **Editorial Status: Approved** and turn **Draft** off. Save the file.
3. From Pages CMS Actions, select **Submit approved guide for publication (PR)**. Choose the language and enter the exact `translationKey` (e.g. `vip-system`).
4. The workflow `.github/workflows/pages-cms-guide-submit.yml` checks out `dev/i18n`, validates the approved state, collects **only** the selected Markdown and its referenced media, copies the media to a guide-specific path, and builds the site from `main`.
5. It opens a dedicated PR targeting `main` and dispatches `validate-pr.yml` for that publication branch. **Review and merge the PR after CI passes**. The separate Cloudflare deployment must then succeed for the site to reflect the guide.

The submission action is intentionally not a direct push to protected `main` or an auto-approval bypass. Until the PR is merged and the site deployment completes, the guide remains unpublished. A direct save in `dev/i18n` cannot publish an article.

**GitHub repository setting:** GitHub Actions must be permitted to create pull requests for the repository, under Settings → Actions → General (workflow permissions). The workflow uses `GITHUB_TOKEN` and requires `contents: write`, `pull-requests: write`, and `actions: write`. If this setting is disabled, the workflow will stop when creating the PR; no direct publication is performed.

## Safety constraints

- The action runs only when dispatched against `dev/i18n`, requires a genuine Pages CMS payload and validates language/slug syntax and approval metadata.
- It never copies unrelated client datasets, other draft guides, or all changes from the long-lived `dev/i18n` branch.
- Linked local guide images are copied only to `public/images/guides/<translationKey>/`, so generic CMS filenames do not overwrite other published guide images. Image paths are restricted to safe supported formats. Keep each source image filename unique within a guide.
- The public content schema still enforces approval and the full PR CI validates the Astro build. Saving an article in CMS does not bypass these requirements.
- An editorial status of `approved` is not evidence of independent validation of every gameplay claim. Substantive claims still require suitable review and sources.

## Troubleshooting

If the guide is not visible, check: (a) correct Pages CMS branch, (b) both publication flags, (c) whether the publication PR is merged, (d) CI results, (e) Cloudflare's deployment for the new `main` commit, and (f) whether the user is browsing the correct language route.

For a new English article `vip-system`, the route is `/guides/vip-system/`; Portuguese is `/pt-br/guides/vip-system/` only when a separate PT-BR guide exists.
