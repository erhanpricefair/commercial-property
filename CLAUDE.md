# Commercial Property Investor Platform — working notes

## The one rule

The public site markets **categories** of opportunity. The private database
holds **individual properties**. Nothing may cross that line.

Before merging any change, run:

```bash
npm run typecheck && npm test && npm run audit:privacy
```

`npm run audit:privacy -- <url>` additionally crawls a running server.

## What will fail the build

- A public route (anything under `src/app` that isn't `admin/` or
  `opportunity/`) importing `lib/repositories/opportunities` or `lib/db`.
- An admin page without `requireAdminPage()`, or a server action without
  `requireAdmin()`.
- An admin API route without `requireAdmin`.
- A public GET handler that returns data rather than 404.
- `Product`, `Offer`, `RealEstateListing` or price structured data on a public page.
- Banned public copy: a channel-partner name, "guaranteed return/rental/
  income/yield/capital/growth", "safe investment", "secure return", "high
  return", "our development", "our project", "secret stocklist", "exclusive stock".
- The sitemap importing a repository or listing `/admin`, `/api/` or `/opportunity/`.

## Where things live

- `src/lib/taxonomy.ts` — the shared vocabulary. The `value` strings are
  persisted; changing one is a migration, not an edit.
- `src/lib/scoring.ts` — weights are exported and asserted in tests. Tune them
  there, not inline.
- `src/lib/matching.ts` — pure functions, no DB access, so they're directly testable.
- `src/lib/services/lead-intake.ts` — the public/private seam. If a public route
  ever needs something that touches stock, it goes here, behind a return type
  that can't carry opportunity data.
- `src/lib/content/` — all editorial copy. Adding an article or landing page is
  a data change, not a code change.

## Conventions

- Public copy uses "may", "can", "depending on the property", "investors should
  consider". Never a guarantee, never a comparison claiming one sector is better.
- Illustrative figures must be labelled illustrative and must not come from a
  real property.
- Imagery is abstract SVG, never photography — a photo of a real building can
  identify a development.
- Tap targets are 48px minimum; the qualification form advances on single-select.
