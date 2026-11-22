# Events & Mercenaries — editorial workflow

This branch adds two first-class multilingual sections:

- /events/ and /pt-br/events/
- /mercenaries/ and /pt-br/mercenaries/

Both have search, filtering where relevant, responsive layouts and detail pages.
**No extracted private client content is checked into this public repository.**
The public catalogs are intentionally empty until editors approve independently verified articles.

## Data governance

Astro collections live under src/content/events/{en,pt-br}/ and
src/content/mercenaries/{en,pt-br}/.

All entries are drafts by default. To publish, all these conditions must hold:
1. draft: false
2. reviewStatus: approved
3. evidenceStatus: official-announced plus a verifiable verificationUrl, OR
   evidenceStatus: in-game-verified plus a nonempty verificationNote.

evidenceStatus: client-config is never permitted to publish.
The site lists and generates routes only for approved non-client-only articles.

**Never commit research ZIPs, decrypted tables, private review exports or candidate draft bundles.**
The offline Atlantica Editorial Staging 10.2 importer generates review candidates
outside the Git repository and has no publish action. Do not copy its output
unreviewed to a public commit, EVEN AS A DRAFT: draft files would still be visible
in the public source repository.

Client dates are not server-confirmed dates. Once independently verified, add
startsAt / endsAt as timezone-aware RFC3339 timestamps (for example 2026-11-22T13:00:00-03:00).
Never invent a timezone.

## Example event frontmatter (illustrative only)

    ---
    title: "Example Event"
    description: "A fictitious example, for documentation only."
    translationKey: example-event
    lang: en
    kind: event
    updatedAt: 2026-11-22
    draft: true
    reviewStatus: draft
    evidenceStatus: client-config
    ---

Mercenary articles use the same common fields, with optional weaponType and recruitment
instead of kind.

## Testing

    npm install
    npm run build
    npm run dev

Verify that both language listings show an empty state when none have been approved,
that search and filtering work with reviewed fixtures, and that a trial unapproved
publication is rejected by the schema. Check existing guide routes as well.
Do not deploy private drafts to Cloudflare.
