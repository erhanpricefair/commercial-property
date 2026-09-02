# Commercial Property Investor Acquisition Platform

An investor lead-generation platform for a commercial property business.

The public website creates investor demand. The private backend holds the
supply. The two are separated by design: **no public page, API response,
sitemap entry or schema block can reach the opportunity database.**

---

## The model

```
TRAFFIC (SEO / Google / social)
   ↓
GENERIC COMMERCIAL INVESTMENT LANDING PAGE
   ↓  "See Current Opportunities"
INVESTOR QUALIFICATION FORM  (7 steps, mobile-first)
   ↓
LEAD CREATED  →  LEAD SCORED (0–100, HOT / WARM / NURTURE)
   ↓
ADMIN MATCHES INVESTOR AGAINST PRIVATE OPPORTUNITIES
   ↓
ADMIN CONTACTS INVESTOR
   ↓
PRIVATE OPPORTUNITY PRESENTATION  (tokenised, noindex, revocable)
   ↓
ENQUIRY / INSPECTION  →  SALE
```

The public site markets **categories** of opportunity, never individual
properties. A visitor tells us what they're looking for; we privately decide
what — if anything — to show them.

---

## Quick start

```bash
npm install
cp .env.example .env.local          # optional; every value has a default
npm run db:migrate                  # create the schema
npm run db:seed                     # demo admin + synthetic opportunities + investors
npm run dev                         # http://localhost:3000
```

The seed prints an admin email and password. Sign in at `/admin/login`.
**Change that password before deploying.** For a real account:

```bash
npm run admin:create -- you@yourdomain.com.au "Your Name"
```

With no password argument, a strong one is generated and printed once.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | Unit tests — scoring, matching, and the privacy separation |
| `npm run audit:privacy` | **Pre-deploy privacy audit** (see below) |
| `npm run db:migrate` | Create/update the schema |
| `npm run db:seed` | Demo data |
| `npm run admin:create -- <email> "<name>" [password]` | Create or reset an admin |
| `npm run stocklist:import -- ./data/stocklist.csv` | Import a real stocklist as PRIVATE |
| `npm run email:dispatch` | Send queued follow-up email |

---

## The privacy boundary

This is the part that matters most, so it is enforced in five places rather
than one.

**1. Module boundary.** Everything that can read the opportunity tables lives
in `src/lib/repositories/opportunities.ts`, which is marked `server-only`. No
public route imports it. `/api/leads` needs matching to run at intake, so that
coupling lives behind `src/lib/services/lead-intake.ts`, whose return type
carries no opportunity data at all.

**2. Redaction in the data layer.** `loadPresentationByToken()` strips
developer, development name, address and lot/unit number unless the admin who
issued that specific link ticked "disclose identity". Source channel and
internal notes are *never* released, on any link. Because the redaction happens
in the data layer, no template change can leak them.

**3. Authentication on every admin surface.** Each admin page calls
`requireAdminPage()` and each server action calls `requireAdmin()`, both of
which validate the session against the database. `middleware.ts` only checks
whether a cookie exists — it is a fast fail, never the authorisation boundary.
A forged cookie gets past the middleware and is then rejected by the page.

**4. Crawler controls.** `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
on `/admin/*`, `/opportunity/*` and `/api/*`, set in both `next.config.ts` and
`middleware.ts`. `robots.txt` disallows them. `sitemap.xml` is generated purely
from static content models and never queries the database. Presentation pages
use a bare layout with no public navigation and `Referrer-Policy: no-referrer`.

**5. Automated verification.** `npm run audit:privacy` checks the source tree
and the database. Given a base URL it also crawls a running server:

```bash
npm run build && npm start &
npm run audit:privacy -- http://localhost:3000
```

It verifies that no public page imports the private repository, that public
APIs are write-only, that banned phrases are absent, that no identifying string
from the opportunity database appears on any public page, that the sitemap
excludes private paths, that admin routes reject anonymous callers, and that
presentation routes send `noindex`. It exits non-zero on any failure — wire it
into CI.

### Public language

The audit and the test suite both fail the build on: any mention of a channel
partner name, "guaranteed return/rental/income/yield/capital/growth", "safe
investment", "secure return", "high return", "our development", "our project",
"secret stocklist" and "exclusive stock". Educational copy uses *may*, *can*,
*depending on the property* and *investors should consider* throughout, and no
page claims commercial property is better than residential.

---

## Coverage vs stock

The platform's primary matching source is **coverage** — what you can source,
described as an asset type, a suburb or area, and a price band. Not a
stocklist.

This is deliberate. A channel partner's stocklist is their property, and the
`coverage_areas` table has **no columns** for a developer, development name,
address or lot number — so a specific property cannot be recorded there even by
accident. A test keeps it that way.

Coverage answers the question you actually need answered when a registration
arrives: *is this someone we can help, and therefore someone to call?* What is
available on the day stays with your partner.

```bash
npm run coverage:seed   # ten starter bands, all marked VERIFY
```

See **[`docs/COVERAGE.md`](docs/COVERAGE.md)**.

## Loading a stocklist (only when authorised)

⚠️ **You probably don't need this.** Coverage is enough to run the business,
and recording a partner's stock carries a relationship risk that coverage does
not. Use this only where a partner has explicitly cleared you to record and
present a specific property.

The Opportunities section holds the full private fields for that case. To
import in bulk:

```bash
npm run stocklist:import -- ./data/stocklist.csv
```

Every imported row is marked `PRIVATE`, is readable only by an authenticated
admin, and triggers a match recomputation across all investors. `data/*.csv`
and `data/*.db` are gitignored.

The importer accepts flexible column headers (case and punctuation are
ignored):

| Field | Accepted headers |
| --- | --- |
| Internal ID | `reference`, `id`, `opportunity id`, `ref`, `code` |
| Property type | `type`, `property type` |
| Location | `suburb`, `state` |
| Size | `size`, `sqm`, `area` |
| Price | `price`, `asking price` |
| Rental | `rental`, `rent`, `estimated rental`, `income` |
| Outgoings | `outgoings` |
| Yield | `yield`, `estimated yield` *(calculated if omitted)* |
| Status | `completion`, `availability`, `status` |
| **Private** | `developer`, `development`, `address`, `lot`, `unit`, `source`, `channel`, `notes` |

Unrecognised columns are appended to internal notes rather than discarded.

---

## Lead scoring

`src/lib/scoring.ts` — 0–100 across six weighted signals:

| Signal | Weight | Rewards |
| --- | --- | --- |
| Finance readiness | 24 | Cash buyer or pre-approved |
| Budget clarity | 22 | A stated band rather than "not sure" |
| Timeframe | 22 | Immediate or 1–3 months |
| Property type clarity | 16 | A named asset class over "open to options" |
| Location specificity | 10 | A region, plus a bonus for a named suburb |
| Investment intent | 6 | Defined priorities rather than "still researching" |

**HOT** ≥ 70, **WARM** ≥ 45, otherwise **NURTURE**. A finance-ready, near-term
buyer is classified HOT even with an open budget — that conversation is worth
having today. Classification drives the follow-up window: 1 day, 3 days, or 14.

Scores are **admin-only**. The public API returns a coarse category
(`hot`/`warm`/`nurture`) for ad-platform reporting and never the numeric score,
the matched properties, or the match count.

## Opportunity matching

`src/lib/matching.ts` — scores each available opportunity against an investor's
criteria out of 100: property type (40, with related asset classes partially
credited), price against the budget band (35, with a 15% stretch allowance),
location (20, where a named suburb is the strongest signal), and priorities (5).
Sold and withdrawn stock is excluded. Every match carries human-readable
reasons, shown in the admin UI.

---

## Admin

| Route | Purpose |
| --- | --- |
| `/admin` | Today's leads, hot leads, investors with matches, follow-up queue, conversion pipeline |
| `/admin/investors` | Filter by status, score, type, budget, location, date, follow-up; CSV export |
| `/admin/investors/[id]` | Criteria, score breakdown, matches, notes, communications, activity, pipeline controls |
| `/admin/opportunities` | The private database — create, edit, filter, recompute matches |
| `/admin/presentations` | Issued links: views, expiry, revoke |
| `/admin/email-templates` | Edit the follow-up sequence |
| `/admin/settings` | Configuration status and integration activity |

Statuses: New → Contacted → Qualified → Opportunity Sent →
Inspection/Discussion → Negotiating → Converted, plus Nurture and Not Suitable.

### Private presentations

From an investor's match list or an opportunity page, issue a link backed by 32
bytes of randomness (`/opportunity/<token>`). Choose whether to disclose the
identifying fields, add an intro note, and set an expiry. Links are revocable,
view-counted, `noindex`, and absent from the sitemap and all navigation.

---

## Automated follow-up

Three emails are queued on registration and are editable at
`/admin/email-templates`:

1. **Immediately** — confirms their criteria were received. Deliberately
   contains no specific property.
2. **+48 hours** — educational: income, outgoings, yields, vacancy, due diligence.
3. **+120 hours** — an invitation to talk, with no obligation.

Nothing sends inline. Messages are written to the `communications` table with a
scheduled time and drained by `npm run email:dispatch` — run it from cron every
15 minutes or so. With `EMAIL_PROVIDER` unset it prints instead of sending,
which is useful for checking template output.

## CRM and automation

Set an environment variable and the destination activates — no code change:

| Variable | Destination |
| --- | --- |
| `LEAD_WEBHOOK_URL` (+ optional `LEAD_WEBHOOK_SECRET`) | Zapier, Make, n8n, or your own endpoint |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot contact |
| `GOOGLE_SHEETS_WEBHOOK` | Apps Script → a spreadsheet row |
| `SLACK_WEBHOOK_URL` | Internal alert on HOT leads |

Add a provider by adding one entry to `DESTINATIONS` in
`src/lib/integrations/index.ts`. Delivery is fire-and-forget with an 8-second
timeout, recorded in `integration_events`, and never blocks the visitor — the
lead is already safe in your own database.

## Analytics

GA4, Google Tag Manager and the Meta Pixel each load only when their ID is set.
Conversion events fire through `src/lib/analytics.ts` to `dataLayer`, `gtag` and
`fbq` simultaneously:

`investor_access_click` · `investor_form_start` · `investor_form_step` ·
`investor_form_complete` · `guide_download` · `contact_request`

Each carries lead source, lead category, budget, property type, location and
landing page — the investor's own self-reported criteria, never private data.
Meta standard events are mapped (`Lead`, `InitiateCheckout`,
`CompleteRegistration`, `Contact`) so the pixel reports against known
conversions.

---

## Paid social campaigns

Four dedicated landing pages at `/lp/<slug>` for Instagram and Facebook
traffic, with UTM and click-ID attribution flowing through to a campaign
performance table in the admin dashboard.

Paid traffic behaves nothing like search traffic — cold, interrupted, almost
entirely mobile — so these pages are built differently: no site navigation
(every outbound link leaks a paid click), the form above the fold on a phone, a
sticky CTA once it scrolls away, and the questions the ad already answered
pre-filled so nobody is asked the same thing twice.

**See [`docs/CAMPAIGNS.md`](docs/CAMPAIGNS.md)** for the URL tagging
convention, the conversion events to optimise for, how to read the results —
and the Meta financial-services verification requirement to check *before* you
build the campaign.

## SEO

Eight intent-targeted landing pages, statically generated:

`/commercial-property-investment-melbourne` ·
`/commercial-property-under-500k` · `/warehouse-investment-melbourne` ·
`/industrial-property-investment-melbourne` · `/storage-property-investment` ·
`/small-commercial-property-investment` · `/commercial-property-for-investors` ·
`/commercial-property-melbourne`

Plus twelve articles under `/resources`, each closing with the same conversion
prompt (rendered by the template, so a new article can't forget it).

Structured data is limited to `ProfessionalService`, `FAQPage`, `Article` and
`BreadcrumbList`. There is deliberately **no** `Product`, `Offer`,
`RealEstateListing` or price markup anywhere — property-level structured data
is exactly the leak this platform must avoid, and the test suite fails the build
if any appears.

---

## Design

Charcoal ink (`#14161A`) on warm off-white (`#FBFAF8`), with one restrained
brass accent (`#9C7A46`). Serif display headings, generous spacing, no price
badges, no urgency, no agent-brochure gradients.

All imagery is abstract SVG rather than photography — a photograph of a real
building risks identifying a development, which is the one thing this site must
never do. It also keeps the shared JS bundle at ~103 kB and loads instantly on
mobile.

Mobile-first throughout: 48px minimum tap targets, single-select answers that
advance automatically (one tap per screen), typing required only on the final
step, correct `inputMode`/`autocomplete` on every field, and a visible progress
indicator.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    Homepage
│   ├── [slug]/                     SEO landing pages (static)
│   ├── resources/                  Articles (static)
│   ├── register/                   Qualification form
│   ├── guide/                      Lead magnet + full guide
│   ├── admin/                      PRIVATE — session required
│   ├── opportunity/[token]/        PRIVATE — tokenised, noindex
│   └── api/
│       ├── leads|guide|contact/    Public, WRITE-ONLY
│       └── admin/                  Admin-only
├── lib/
│   ├── db.ts                       Schema + connection
│   ├── auth.ts / password.ts       scrypt + DB-backed sessions
│   ├── scoring.ts                  Lead scoring (admin-only)
│   ├── matching.ts                 Opportunity matching (admin-only)
│   ├── repositories/
│   │   └── opportunities.ts        PRIVATE — server-only
│   ├── services/lead-intake.ts     The public/private seam
│   ├── integrations/               Provider-agnostic CRM dispatch
│   ├── email/                      Templates + queue + dispatch
│   └── content/                    Static editorial (no DB access)
└── middleware.ts                   Edge guard + robots headers
```

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS ·
SQLite (`better-sqlite3`) · Zod. No native crypto dependency — passwords use
Node's built-in scrypt.

### Database

`admin_users` · `admin_sessions` · `investors` · `investor_preferences` ·
`opportunities` *(private)* · `opportunity_matches` · `presentations` ·
`lead_activity` · `notes` · `communications` · `email_templates` ·
`integration_events` — all indexed on their query paths.

### Moving to Postgres

SQLite is the default because it needs no external service. All SQL is plain
and portable, and every query lives in `src/lib/db.ts` and
`src/lib/repositories/`. To migrate: swap the driver in `db.ts`, port the
schema (the `CREATE TABLE` statements are standard apart from
`AUTOINCREMENT` → `SERIAL`/`IDENTITY` and `datetime('now')` → `now()`), and
adapt the repository functions. Nothing else in the application talks to the
database.

---

## Getting to revenue

- **[`docs/GO-LIVE.md`](docs/GO-LIVE.md)** — deploy in about 30 minutes, with
  the hosting constraint that matters (SQLite needs a persistent disk) and a
  pre-flight checklist to run before spending on traffic.
- **[`docs/REVENUE-PLAN.md`](docs/REVENUE-PLAN.md)** — what a revenue target
  actually requires in transactions, why settlement timing decides whether a
  near-term target is reachable, and the sequence to work in.
- **[`docs/CAMPAIGNS.md`](docs/CAMPAIGNS.md)** — paid social playbook.

The admin dashboard carries a revenue tracker: banked, committed, a
probability-weighted forecast, and the gap expressed as deals and registrations
still needed. Set your target and commission rate in Admin → Settings.

## Deployment checklist

1. Set `NEXT_PUBLIC_SITE_URL` to your real domain — canonicals, the sitemap and
   email links all derive from it.
2. Create a real admin account and delete or reset the seeded one.
3. Point `DATABASE_PATH` at persistent storage, or migrate to Postgres.
   **On Vercel/Netlify/Cloud Run the filesystem is ephemeral — SQLite data
   will be lost on redeploy.** A VPS, Fly.io volume, Railway volume or
   container with a mounted disk all work as-is.
4. Configure `EMAIL_PROVIDER` and schedule `npm run email:dispatch`.
5. Add your GA4/GTM/Pixel IDs and verify Search Console.
6. Run `npm run audit:privacy -- https://yourdomain.com.au` against production.
7. Serve over HTTPS — session cookies are `secure` in production.
8. Have a solicitor review `/privacy`, `/terms` and `/disclaimer`. They are a
   sound Australian-context starting point, not legal advice, and the privacy
   policy in particular should be checked against your actual data handling.
9. Put a real rate limiter (Cloudflare, WAF) in front of the public forms.
   The built-in one is per-instance and is a floor, not a ceiling.
10. Take regular backups of the database — it holds your entire lead pipeline.

---

## Compliance notes

- No page guarantees a return, rental income, yield or capital growth.
- No page claims commercial property is safer or better than residential.
- Illustrative figures are labelled as illustrative and are not drawn from any
  real property.
- Every article, landing page and form carries the general-advice disclaimer.
- The full disclaimer appears in the footer of every public page.
- Registration copy states plainly that there is no obligation to purchase.
