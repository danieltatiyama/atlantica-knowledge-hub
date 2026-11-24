# Stage 20.75–20.76 — Guide translation pipeline

## Editorial workflow

English remains the source of truth. Only approved, published English guides are eligible. A source update on main triggers the **Prepare guide translation requests** workflow. It exports a read-only artifact containing requests and status.json; no external service is called by this workflow.

- Missing: generate a new draft in src/content/guides/{locale}/.
- Awaiting review: existing draft is not regenerated.
- Current: source hash matches published translation.
- Manual/untracked: existing Portuguese or other manual translation is not overwritten. A maintainer must explicitly decide how to track it.
- Stale published/draft: create a separate candidate under translation-review/{locale}/, bound to the original source and target hashes. The old public guide stays online until an approved replacement is merged.

Stage 20.77 published the six ChatGPT-assisted VIP translations and the six nation-dungeon-planning translations. They have not been reviewed by native speakers. VIP shares all 16 existing image URLs; text inside screenshots remains unchanged. Drafts are excluded from public pages, navigation and search.

### Stage 20.79 — Editorial status from Pages CMS

1. Create the English guide first on `dev/i18n`. Save with Draft enabled while writing.
2. When actually approved, set Editorial Status to Approved, turn Draft off, save, and submit the publication PR. Only merge and deploy make it public.
3. In Pages CMS select **Check guide translations (8 languages)**. It dispatches the read-only workflow on `main`. The Actions run summary shows every approved English source and its seven translation slots. Download the artifact for `status.json`, `summary.md` and available requests.
4. Published and synchronized are separate: a manually maintained translation can be public without a source hash. An old published translation can be stale and remain online. Neither is overwritten automatically.

The report reads main only; unpublished CMS changes are excluded. Manual Portuguese authoring remains available. No provider calls, repository commits or approval actions occur from this status button. The CMS action uses the documented `ref: main` and optional workflow `payload` input; see https://pagescms.org/docs/configuration/actions/.

## Free/offline workflow

Run npm ci once. No credentials required:

    node scripts/guide-translations.mjs status
    node scripts/guide-translations.mjs export translation-requests
    node scripts/guide-translations.mjs request vip-system fr

Each request contains schemaVersion, slug, targetLanguage, sourceHash, targetHash, glossaryVersion, instructions and segments. Use any translator capable of returning the segment-ID JSON object. Return an envelope with the same identity/hash fields and the translated segments, plus provider and model labels. Then:

    node scripts/guide-translations.mjs apply response.json

For a stale managed translation only:

    node scripts/guide-translations.mjs apply response.json --replace-managed

The second command creates a separate review candidate; it never replaces the published page. New drafts and review candidates must be submitted by PR.

## Optional automatic generation

The **Generate guide translation review drafts** workflow is intentionally disabled until a repository administrator configures these variables/secrets in Settings → Secrets and variables → Actions.

| Setting | Kind | Meaning |
|---|---|---|
| GUIDE_TRANSLATION_ENABLED | Variable | true to opt in; absent/false disables provider calls |
| GUIDE_TRANSLATION_API_URL | Variable | Explicit HTTPS Chat Completions-compatible endpoint |
| GUIDE_TRANSLATION_MODEL | Variable | Explicit model name |
| GUIDE_TRANSLATION_API_KEY | Secret | Provider credential, never commit or paste into chat |
| GUIDE_TRANSLATION_MAX_REQUESTS | Variable | 1–14 calls per workflow run; default 7 |

No provider, model, billing account or credential is provisioned by this code. A compatible service must accept JSON-object response format, max_tokens and chat messages; some APIs need another adapter. Hosted GitHub runners cannot reach a private home network's loopback service. For a local provider run the CLI on the machine with the model and explicitly configure a loopback HTTP URL (or secure HTTPS endpoint); no need to expose a home service to the internet.

After enabling, changes to guide content trigger bounded generation; the workflow also supports a manual dispatch for one slug. It refuses to start if another generation PR is pending, and opens a scoped review PR with a successful local Astro build. It never merges or approves automatically. It uses the repository's Actions PR creation permission; if unavailable, enable it or open the generated branch as a PR manually. GitHub Actions artifacts and provider usage may incur costs under the user's own plans. The request limit is per run, not a monetary budget or monthly cap.

## Review and publish

Inspect the full rendered/proposed translation, protected game terminology, numerical claims, and image placement. Automated checks do not verify translation quality. The status artifact includes candidate and target SHA-256 digests. Run **Prepare approved guide translation PR** in Actions with the slug, locale, exact candidate path/hash, target hash (or null for absence), and confirm actual review. The workflow refuses stale source or changed target/candidate, changes draft to false and reviewStatus to approved, builds the site and opens a PR. Merge after CI. Cloudflare deployment remains a separate verification.

The local equivalent:

    node scripts/guide-translations.mjs approve SLUG LOCALE CANDIDATE_FILE CANDIDATE_SHA TARGET_SHA_OR_null

## Limits

The v1 segment parser supports ordinary prose, simple headings, lists, tables, inline emphasis, links and images. Link/image labels and CMS media options are protected as a unit, so these labels may remain English. Fenced code, HTML, unsupported inline syntax, excessively large articles and ambiguous formatting require manual translation. Only an initial English-term glossary exists; official language-specific game names have not been verified. Exact protected token order is intentionally conservative and may limit natural word order. It does not guarantee semantic accuracy.

Existing manually authored PT-BR remains untouched, and the draft Avalon research article is ineligible. The sample nation dungeon planning guide is eligible because it is already public, but is explicitly an example article. A provider has not been selected or tested live. Do not enable external calls until endpoint, model, credentials and budget are decided.
