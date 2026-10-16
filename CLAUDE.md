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
- Banned copy in email templates (`lib/email/templates.ts`) or social copy
  (`social/POST-THESE.md`, `scripts/make-social.ts`) — the audit scans them too.

## Route groups

`src/app` has five root layouts, one per group. This is not cosmetic:

- `(home)` — NewPF: completed builder townhouses in Melbourne's north. The
  owner holds an INDIVIDUAL estate agent's licence (no company licence), so the
  business is the owner trading as NewPF — never name NewPF Business Group Pty
  Ltd as the business. Identity comes from `NEXT_PUBLIC_LICENSEE_NAME` and
  `NEXT_PUBLIC_AGENT_LICENCE`; with neither set the site says "NewPF" alone.
  It introduces buyers; the builder sells. The landing page at `/` plus `/privacy` and `/terms`,
  in the NewPF shell (`components/brand/`). Analytics, no navigation away from
  the funnel, indexed. Copy and the suburb index live in
  `src/lib/content/home-landing.ts`; the form's options in
  `content/home-options.ts`, which is the only content module client
  components may import (home-landing holds builder approval records). Leads
  post to `/api/home-enquiry` → `services/home-enquiry.ts`.
- `(site)` — public marketing. Header, footer, analytics.
- `(campaign)` — paid landing pages at `/lp/*`. Analytics, no navigation
  (an outbound link leaks a click that was paid for). noindex.
- `(admin)` — no public chrome and **no analytics**: a nested layout would
  report URLs like `/admin/investors/42` to GA and Meta.
- `(presentation)` — same reasoning, plus `Referrer-Policy: no-referrer`. The
  `/unsubscribe` page lives here too: its URL carries a per-person token.

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
- `src/lib/release.ts` — builder / channel-partner release approval. Pure.
  `createPresentation()` refuses a link the approval doesn't cover, and
  `loadPresentationByToken()` re-checks on every view, so withdrawn or lapsed
  approval, or sold/withdrawn stock, takes existing links down. New stock is
  `none` (not shareable) by default. Never bypass it in a template or script.
- `src/lib/repositories/consent.ts` — marketing consent and unsubscribe.
  Only `TRANSACTIONAL_TEMPLATES` go to people without consent; unknown
  template keys count as marketing. The dispatcher re-checks at send time and
  appends the sender-identity / unsubscribe footer and `List-Unsubscribe`.
- `src/lib/request.ts` — `clientIp()` (never the leftmost `X-Forwarded-For`;
  set `TRUSTED_IP_HEADER` behind a proxy other than Fly) and `rejectNonJson()`
  on every public JSON POST.
- `src/lib/time.ts` — Melbourne "today". Never `date('now')` for anything an
  agent reads as today; the server is UTC.
- Stored timestamps go through `toSqliteTime()` (db.ts). An ISO string compared
  as text against `datetime('now')` stays "unexpired" until the end of its UTC day.
- `src/lib/db.ts` — `addMissingColumns()` runs between the schema block and
  any index over a late-added column. An index declared in the `CREATE TABLE`
  block over a column added later will fail on every existing database.

## Coverage vs stock

`coverage_areas` is the primary matching source: asset type, suburb/area, price
band. It has **no columns** for developer, development name, address, lot
number or source channel, and `tests/coverage.test.ts` asserts they stay
absent. Never add one — the protection is structural, not procedural, and that
is the whole point.

`opportunities` (with the private fields) is optional and secondary, for the
case where a partner has cleared a specific property. Nothing in the platform
requires a row in it.

Matching is band-to-band: investor budget band overlapping coverage price band.
Coverage is recorded per suburb; matches are grouped by (type, region) for
display.

Ranking: a suburb or area the investor typed outranks a scope match, which
outranks nothing. Availability frequency is a **bounded adjustment**
(+4 / 0 / -6), never a multiplier — a multiplier scales with the score and can
swamp a real difference in location fit.

`COVERAGE_REGIONS` in taxonomy carries an explicit `isMetro` flag. Never infer
metro-ness by sniffing a free-text region string; it fails silently.

## The funnel is the point

The public site exists to capture registrations. Every page a visitor can land
on carries the form itself (`InlineForm`), not a link to it — a link to
`/register` is a click some proportion of people don't make.

- `src/lib/funnel.ts` — pure drop-off arithmetic, asserted in tests. A funnel
  report that is quietly wrong sends you off fixing the wrong screen.
- Partial registrations save once a **valid email** exists, never before. The
  form discloses it at the point of collection and the privacy policy covers
  it; do not move the save earlier or remove the notice.
- `promotePartial()` links a completed registration back to its partial, so one
  person is never worked as two leads. Likewise a repeat registration, guide
  request or enquiry from a known email attaches to the existing investor
  (`reRegisterInvestor()`), never a second row.
- Funnel steps are reported once per session, on first reach, under one
  `source` label for start/step/complete. Prefilled steps count as reached.
- Landing pages carry a `prefill` so a page that has already established intent
  doesn't ask for it again.

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
- Imagery is original drawing, never photography — a photo of a real building
  can identify a development, and the NewPF homes are under builder marketing
  restrictions. NewPF's artwork (`components/brand/Artwork.tsx`) is generic
  townhouse massing, brick bond and drafting marks, labelled illustrative. The
  only exception is a builder-authorised photo on a `FEATURED_HOMES` entry,
  which also carries the suburb name only — no address, lot, estate or price —
  and records who approved it and the evidence, or it isn't shown.
- NewPF claims: only what's verified. "Inner Melbourne" is not used — the
  current suburbs are 9–12 km north of the CBD. The $900k–$1.3m band is the
  business's own figure. Don't describe the homes' features (bedrooms,
  parking, outdoor space) unless true of every home it would describe.
  Never "exclusive" (no written exclusivity), "not available online" (some
  homes are listed online), "wholesale" or "builder direct" — the privacy
  audit fails on all four. Revisit only if the underlying facts change.
- NewPF design: ivory / limestone / charcoal / olive tokens, Newsreader +
  Instrument Sans (self-hosted, `app/(home)/fonts.ts`), square edges, thin
  rules, numbered sections, colour fields rather than cards. Styles are scoped
  under `.nf` in globals.css so the commercial pages and admin are unaffected.
- Tap targets are 48px minimum; the qualification form advances on single-select.
