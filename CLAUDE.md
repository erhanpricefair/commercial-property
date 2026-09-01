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

## Route groups

`src/app` has four root layouts, one per group. This is not cosmetic:

- `(site)` — public marketing. Header, footer, analytics.
- `(campaign)` — paid landing pages at `/lp/*`. Analytics, no navigation
  (an outbound link leaks a click that was paid for). noindex.
- `(admin)` — no public chrome and **no analytics**: a nested layout would
  report URLs like `/admin/investors/42` to GA and Meta.
- `(presentation)` — same reasoning, plus `Referrer-Policy: no-referrer`.

Never add a top-level `src/app/layout.tsx` — it would wrap every group in the
public shell and reintroduce that leak. A test asserts it doesn't exist.

## Where things live

- `src/lib/taxonomy.ts` — the shared vocabulary. The `value` strings are
  persisted; changing one is a migration, not an edit.
- `src/lib/scoring.ts` — weights are exported and asserted in tests. Tune them
  there, not inline.
- `src/lib/matching.ts` — pure functions, no DB access, so they're directly testable.
- `src/lib/services/lead-intake.ts` — the public/private seam. If a public route
  ever needs something that touches stock, it goes here, behind a return type
  that can't carry opportunity data.
- `src/lib/content/` — all editorial copy. Adding an article, SEO page or
  campaign is a data change, not a code change.
- `src/lib/attribution.ts` — UTM/click-ID capture. First touch wins per
  session; it must never throw, because blocked storage is common and a lost
  UTM is much cheaper than a lost lead.
- `src/lib/db.ts` — `addMissingColumns()` runs between the schema block and
  any index over a late-added column. An index declared in the `CREATE TABLE`
  block over a column added later will fail on every existing database.

## Revenue model

- `src/lib/revenue.ts` — pure forecasting. Stage probabilities are exported and
  asserted in tests; keep them conservative. A flattering forecast hides a
  shortfall until it is too late to act on.
- Observed conversion is only trusted above a minimum sample
  (`MIN_LEADS_FOR_OBSERVED` / `MIN_DEALS_FOR_OBSERVED` in
  `repositories/deals.ts`). Below it, the stated assumption is used and the UI
  says so.
- Settlement speed is surfaced everywhere a deal or opportunity appears:
  completed stock pays in weeks, off-the-plan pays on completion. Two equal
  commissions are not equally useful.

## Conventions

- Public copy uses "may", "can", "depending on the property", "investors should
  consider". Never a guarantee, never a comparison claiming one sector is better.
- Illustrative figures must be labelled illustrative and must not come from a
  real property.
- Imagery is abstract SVG, never photography — a photo of a real building can
  identify a development.
- Tap targets are 48px minimum; the qualification form advances on single-select.
