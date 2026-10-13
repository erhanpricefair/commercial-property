# Launch-readiness report

**Audit date:** 13 October 2026 · **Branch:** `claude/optimistic-cori-p76c47`

This is a product, security and conversion audit of the platform as code. It is
**not legal advice and does not certify compliance** with the Privacy Act 1988,
the Spam Act 2003, the Australian Consumer Law, the Estate Agents Act 1980 (Vic)
or any other law. Items marked **⚖ Legal**, **👤 Principal** or **🏗 Builder**
need a decision from the agency's Australian legal adviser, its principal
(licensed estate agent / officer in effective control), or the builder/channel
partner. The tool cannot make those decisions.

## How this was tested

"Tested" below means one of these was actually run, not inferred from code:

| Method | What it covered |
|---|---|
| `npm run typecheck`, `npm test` (133 tests, 22 suites) | All pass. 24 tests are new: release approval, consent/unsubscribe, CRM, Melbourne time, funnel gaps. |
| `npm run audit:privacy -- <url>` against a production build | 26 checks pass, 0 fail. One expected warning (a link withdrawn during testing). |
| HTTP requests (curl) against `next start` | Every public page and API, rate limits, content-type guard, dedupe, unsubscribe. |
| Headless Chromium (Playwright), iPhone 13 profile at 375px | Full registration on a campaign page; admin login → create opportunity → approval gate → private link → withdrawal; call-list claim; every admin nav link. |
| Automated accessibility crawl, 20 pages at 375px | Overflow, tap-target size, contrast, labels, headings, `lang`. |
| Email via a local webhook receiver | The in-process scheduler sent the queued mail with footer and `List-Unsubscribe`. |

**Not tested at all:** real email providers (Resend/Postmark/SMTP2GO), HubSpot,
Slack, Google Sheets and the generic lead webhook; GA4/GTM/Meta Pixel with real
IDs; HOT-lead owner alerts; deployment on Fly (volume, health check, TLS);
first-run `/admin/setup`; stocklist import; coverage editing; deal create/update
through the UI; email-template editing; Safari/Firefox; screen readers;
keyboard-only use.

---

## What was found and fixed

### 1. Broken buttons, forms and workflows
- **No email was ever sent.** Dispatch was a manual script that nothing
  scheduled, and the production image can't run it. Confirmations, guide links
  and follow-ups would have queued forever. *Fixed:* the server now drains the
  queue itself every 5 min (`src/lib/jobs.ts`). Tested end to end with a
  webhook provider.
- **Log mode marked unsent email as "sent"**, so the admin showed confirmations
  that never went. *Fixed:* recorded as `not_sent`.
- **"Create private link" on the opportunity page appeared to do nothing**: no
  confirmation, no link shown. An unknown investor ID crashed with a server
  error. *Fixed:* it now redirects to the link list with the new link
  highlighted; errors are shown inline.
- **Editing a deal reset its "commission paid" date to today on every save**,
  moving banked revenue between months. *Fixed.*
- **No favicon** (404 on every page). *Fixed.*

### 2. Exposure of restricted property information
- Public pages, metadata, sitemap, robots and APIs: the live crawl found no
  developer, development name, address, lot or reference in public output.
- **Private links and admin sessions outlived their expiry** by up to a day.
  ISO timestamps were compared as text with SQLite's format. *Fixed*, including
  legacy rows; there is a regression test.
- **The health endpoint published the live lead count** and raw database
  errors. *Fixed:* it now returns `{ok}` only.
- **The unsubscribe URL (which carries a per-person token) would have been sent
  to GA and Meta.** *Fixed:* the page sits in the analytics-free layout and is
  noindex.

### 3. Builder approval enforcement — there was none
Any admin could issue a private link to any property, with the full address and
developer, and nothing recorded that the builder had agreed. *Fixed*
(`src/lib/release.ts`):
- Each opportunity carries a release approval: `none` / `summary` / `full` /
  `withdrawn`, plus who approved, the evidence, and an optional expiry. New
  stock defaults to `none`.
- Links are refused in the data layer without approval. Identity disclosure
  needs `full`.
- The check is re-run **on every view and enquiry**. Withdrawn or lapsed
  approval, or stock marked sold or withdrawn, takes existing links down
  without anyone revoking them. A downgrade hides identity on the next view.
- Changes are logged (who recorded it, from and to, evidence). The privacy
  audit warns about live links the approval no longer covers.
- Tested in the browser: the button is disabled with a reason, a forced
  submission is refused server-side, and a withdrawn link returns 404 and its
  enquiries are dropped.
- ⚠ **On an existing database every opportunity becomes `none`, so every
  existing private link stops working until approval is recorded.** This is
  deliberate (fail-closed). Tell agents before deploying.

### 4. Security and privacy
- **Login rate limit bypassable** by changing `X-Forwarded-For` (verified: 12
  attempts, no lockout). *Fixed:* trusted proxy IP plus a per-account lockout
  (10 per 15 min). All public forms use the same IP logic.
- **Cross-site form posts accepted** (login CSRF, lead spam). *Fixed:* JSON only
  (415 otherwise).
- Admin inputs (lead status, deal stage, contact channel) were written
  unvalidated. *Fixed.* HSTS added in production.
- **Admin times were shown in UTC**, 10–11 hours off for Melbourne agents.
  *Fixed.*
- The privacy policy promises unfinished registrations are deleted after 90
  days, but that only happened when someone pressed a button. *Fixed:* now
  automatic.

### 5. Misleading or unsubstantiated marketing
- **"See Current Opportunities"** (12 places) led to a form, not a list.
  *Changed to* "Register Your Criteria".
- Social post 2: "Most people think commercial starts at $1M" and "the most
  common thing we hear" were unevidenced claims. *Rewritten;* images
  regenerated.
- The privacy audit's banned-phrase check now also scans email templates and
  social copy.
- Remaining claims needing substantiation: see "Must be resolved".

### 6. Consent and unsubscribe
- **There was no unsubscribe mechanism at all**, although the form, the guide
  page and the privacy policy all promised one. *Fixed:*
  - every email now has a footer identifying the sender and an unsubscribe link
  - RFC 8058 one-click `List-Unsubscribe` headers
  - a token-based `/unsubscribe` page that confirms on a POST, so mail scanners
    can't trigger it
  - unsubscribing cancels queued marketing email for every record with that
    address
  - admins can record an opt-out received by phone
- **Nurture emails went to people who left the consent box unticked.** *Fixed:*
  only the confirmation and the requested guide are sent without consent.
  Consent is re-checked at send time, and unknown templates count as marketing.
  Admins can no longer hand-send marketing templates to non-consenting leads.
- The guide form gained an optional, unticked consent box. All three forms now
  link to the privacy policy at the point of collection. The privacy policy
  gained an overseas-disclosure section and names builders and developers as
  possible recipients.

### 7. CRM and lead assignment
- **One person registering twice became two HOT leads**, with two alerts and
  two email sequences (verified). The guide and contact forms did the same.
  *Fixed:* a known email updates the existing investor with new criteria,
  re-scores, and resurfaces nurture or not-suitable leads; nurture email is
  never queued twice.
- **No lead assignment existed.** With more than one agent, everyone worked the
  same list. *Added:* an owner per lead. The first agent to log a call claims
  it (race-safe). The call list defaults to "mine + unassigned". Owner can be
  edited, filtered, and appears in the CSV export.
- **Automatic events moved leads backwards**: a second link knocked a
  negotiating buyer back to "Opportunity Sent", and an enquiry reopened a
  converted client. *Fixed:* automatic moves are forward-only.

### 8. Analytics calculations
- **Prefilled campaign pages showed 100% drop-off at "Budget"**, because skipped
  steps were never reported. *Fixed* and verified in the browser.
- **Back-then-Continue counted a step twice**, so later steps could exceed
  earlier ones. *Fixed:* each step is counted on first reach only.
- **The funnel "by source" table compared starts and completions under
  different names** (component source vs UTM source), showing 0% for paid
  traffic. *Fixed.*
- **A gap in the step data** was charged to the next step as drop-off.
  *Fixed* (tested).
- **GA and Meta counted every landing page view twice** (the tags' own page
  view plus the route tracker). *Fixed:* verified 0 extra on landing and 1 per
  client-side navigation.
- **"Today's leads" used the UTC date**, so leads from midnight to 10–11am
  Melbourne time counted as yesterday. *Fixed* (DST-tested).
- **Observed conversion rate** counted deals rather than buyers, and divided by
  all contacts including guide downloads. *Fixed* to registrations → buyers.
- **Guide-form leads lost campaign attribution.** *Fixed.*

### 9. Mobile and accessibility
- No horizontal overflow at 375px; one `h1` per page; every field labelled;
  `lang="en-AU"`.
- **Small grey and brass text failed WCAG AA contrast on every page**
  (3.3–4.4:1). *Fixed* by darkening the `ink-400` and `brass-600` tokens and
  the brass button. Re-crawl: no failures except decorative numerals, now
  hidden from screen readers.
- **Footer, breadcrumb and guide contents links were 16–19px tall.** *Fixed* to
  ≥44px. Admin screens were not contrast-audited.

### 10. Features that look implemented but aren't (or weren't)
- Email sending: fixed (above), but it still needs provider credentials.
- **HubSpot destination:** posts to custom properties (`commercial_*`) that
  must already exist in the portal. A repeat email returns 409. Failures are
  logged but **never retried**. Untested.
- Integration events record `attempts`, but no retry job exists.
- The **SMS** contact preference is recorded, but the platform cannot send SMS.
- **Owner HOT alerts** do nothing until `OWNER_ALERT_EMAIL`/`_WEBHOOK` is set.
- **Admin users can only be added by CLI**: no UI, no roles (every admin sees
  all private stock and commission), no password reset, no 2FA.

---

## Launch-readiness

### ✅ Ready for testing (in a staging environment)
Verified working in this audit:
- Public site, campaign pages, guide, contact and registration on mobile
- Partial save and promotion; attribution capture
- The release-approval gate end to end
- Private presentations with redaction, expiry and enquiry
- Unsubscribe (page and one-click)
- Consent gating
- One-lead-per-person de-duplication
- The call list with claim-on-first-call
- Forward-only status moves
- The funnel report inputs
- The privacy audit

Next, have the principal and one agent run a scripted UAT. Cover the items
listed as untested above, especially deal tracking, coverage, stocklist import
and email-template editing.

### 🔧 Requires configuration or credentials
- `EMAIL_PROVIDER` plus key and a verified sending domain (SPF/DKIM/DMARC).
  Without them **no email leaves the system**.
- `NEXT_PUBLIC_LEGAL_NAME`, `NEXT_PUBLIC_ABN`, `NEXT_PUBLIC_CONTACT_EMAIL`,
  `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_SITE_URL`. The footer and every
  email currently show placeholder identity (`example.com.au`, no ABN).
- `OWNER_ALERT_EMAIL` for HOT-lead alerts; `ADMIN_SETUP_TOKEN` before first
  deploy.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `GTM_ID` / `META_PIXEL_ID`:
  - In Meta, switch **off** automatic advanced matching (the forms contain
    email and phone).
  - In GA4, check that "page changes based on browser history" isn't
    double-counting alongside the app's own SPA page views.
- HubSpot: create the `commercial_*` contact properties first, or don't enable
  it.
- `TRUSTED_IP_HEADER` if the site sits behind anything other than Fly.
  `fly.toml` must stay at one machine.
- **Backups of `/data/platform.db` are not automated.** Set up volume snapshots
  or an off-site copy before real leads arrive.
- Seed admin password in `.env.example` must not be reused.

### ⛔ Must be resolved before production launch
1. **⚖ Legal:** review the privacy policy, terms and disclaimer, and the
   collection notices on each form:
   - saving unfinished registrations before submit
   - overseas disclosure (US providers)
   - disclosure to builders and partners
2. **⚖ Legal:** confirm which emails are "commercial electronic messages" under
   the Spam Act. The code treats only the confirmation and the requested guide
   as transactional. Confirm the footer's sender-identification wording.
3. **⚖ Legal / 👤 Principal:** confirm the agency's licensing and advertising
   obligations for the website, campaign pages, social images and private
   presentations (e.g. agency name and licence details on advertising).
   Confirm whether any presentation figures (price, rent, yield) trigger
   further obligations.
4. **👤 Principal:** substantiate or remove these claims:
   - "opportunities currently available through our network" (site and Email 1)
   - "selected opportunities"
   - "not every opportunity is publicly listed" (social post 4)
   - the Melbourne / Victoria coverage implied by campaign pages

   If the agency has no channel-partner arrangements yet, this copy is
   misleading.
5. **🏗 Builder / 👤 Principal:** agree in writing what each builder/partner
   permits (summary vs full disclosure, expiry, what counts as evidence) before
   recording approvals. Confirm whether partner agreements allow
   investor-facing yield figures. Tell agents that existing links stop working
   until approval is recorded.
6. **⚖ Legal:** analytics and advertising tags load without a consent prompt.
   Decide whether that is acceptable for this business and update the policy to
   match.
7. **👤 Principal:** the guide at `/guide/read` is readable without giving an
   email (and is in the sitemap), so the lead magnet does not gate anything.
   Keep it for SEO or gate it — a CRO decision.
8. **Security before more than one or two users:**
   - admin user management with roles (agents shouldn't all see commission and
     every private address)
   - 2FA and password reset
   - a Content-Security-Policy
   - The per-account lockout can be used to lock an admin out for 15 minutes;
     an acceptable trade-off for now, but monitor it.
9. Configure backups and email (above). Then run
   `npm run audit:privacy -- https://<live-domain>` against production. The
   audit must pass before any ad spend.
