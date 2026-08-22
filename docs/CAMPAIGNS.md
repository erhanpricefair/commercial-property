# Running Instagram & Facebook campaigns

Everything needed to point paid social traffic at this site and know which ad
produced which lead.

---

## Before you spend anything

**Meta requires verification for financial products and services ads targeting
Australia.** Since Meta's anti-scam changes, advertisers promoting financial
products or services to Australian users generally must complete Meta's
financial-services verification — which asks for an AFS licence number, or
evidence of an exemption or authorised-representative status.

A commercial property opportunity-matching service may or may not be caught by
that definition depending on how it's structured and how the ads are worded.
**Check this with Meta Business Support and your own adviser before building
the campaign**, because ad sets get rejected or accounts restricted after the
fact, not before. It's a paperwork problem if you handle it early and a
dead-campaign problem if you don't.

Two things that reduce risk either way, and are already true of these pages:

- No return, rental, yield or capital-growth figure is promised anywhere.
- Every page carries the general-advice disclaimer and "no obligation to
  purchase".

Keep the ad creative to the same standard. The page can be perfectly compliant
and still get the account flagged if the ad says "guaranteed 7% returns".

---

## The landing pages

Four campaign pages, each matched to a different ad angle. They live at
`/lp/<slug>` and are **not** in the search index — they exist to receive paid
clicks, not to rank (the SEO pages do that job).

| Page | Angle | Pre-fills |
| --- | --- | --- |
| `/lp/warehouse-melbourne` | Warehouse & industrial, Melbourne | Property type = warehouse |
| `/lp/under-500k` | Entry price under $500k | Budget = $300–500k |
| `/lp/diversify-from-residential` | Residential investors looking at commercial | — |
| `/lp/storage-investment` | Storage, lowest entry point | Property type = storage |

**Pre-filling matters.** Someone who clicked an ad about warehouses opens the
form at question 2, not question 1 — the ad already answered the first one.
Re-asking a question the ad just posed is the fastest way to lose a click you
paid for. They can still step back and change it.

These pages differ from the rest of the site on purpose:

- **No site navigation.** Every outbound link on a paid landing page leaks a
  click you paid for. Only the legal links remain.
- **Form above the fold on mobile.** The first question is visible on a phone
  without scrolling.
- **Sticky CTA.** Once the form scrolls out of view, a bar appears at the
  bottom that jumps back to it.
- **Objections answered on the page.** The three questions this audience
  actually has, addressed before they're asked.

### Adding a campaign

Add an entry to `src/lib/content/campaigns.ts` and the page builds itself. It's
a data change, not a code change. Each entry also carries suggested ad copy, so
the page and the creative stay in sync — copy it into Ads Manager rather than
writing something new that no longer matches the page.

---

## Tagging your links

Attribution only works if the URL carries it. Use this pattern:

```
https://yourdomain.com.au/lp/warehouse-melbourne
  ?utm_source=instagram
  &utm_medium=paid_social
  &utm_campaign=warehouse_vic_q3
  &utm_content=carousel_a
```

| Parameter | Use it for | Example |
| --- | --- | --- |
| `utm_source` | The platform | `instagram`, `facebook` |
| `utm_medium` | Always `paid_social` for ads | `paid_social` |
| `utm_campaign` | The campaign, one value per campaign | `warehouse_vic_q3` |
| `utm_content` | **The specific creative** | `carousel_a`, `video_15s`, `static_shed` |

`utm_content` is the one people skip and then regret. It is what tells you
*which creative* works, not just which campaign — and creative is usually where
the difference in cost per lead actually lives.

Meta appends `fbclid` automatically; it's captured too, alongside `gclid`,
`ttclid`, `li_fat_id` and `msclkid` if you run elsewhere.

### How attribution survives the journey

Captured on arrival and held in `sessionStorage`, so it survives the seven-step
form and any wandering around the site before converting. **First touch wins**
within a session: if someone arrives from your ad, reads two articles, then
registers, the ad still gets the credit. A *new* campaign click overwrites it,
because they genuinely arrived from a new ad.

Stored per lead: source, medium, campaign, content, term, click ID, referrer
and landing page.

---

## Reading the results

**Admin → Dashboard → Campaign performance** breaks leads down by campaign,
source and creative, and shows:

- **Leads** — raw volume
- **Hot** — how many scored HOT
- **Hot rate** — the column that actually matters
- **Converted** — how many closed

Lead volume on its own is misleading. A cheap campaign producing only NURTURE
leads costs more per sale than an expensive one producing buyers. Optimise on
hot rate and conversions, not cost per lead.

Click any campaign name to filter the investor list to it. The CSV export
carries every UTM column, so you can join it against Ads Manager spend and work
out true cost per qualified lead.

---

## Conversion events

Already wired. Each fires to `dataLayer`, GA4 and the Meta Pixel simultaneously,
and carries campaign and creative:

| Event | Meta standard event | Fires when |
| --- | --- | --- |
| `investor_access_click` | — | Any CTA is clicked |
| `investor_form_start` | `InitiateCheckout` | First interaction with the form |
| `investor_form_step` | — | Each step advance |
| `investor_form_complete` | **`Lead`** | Registration completes |
| `guide_download` | `CompleteRegistration` | Guide requested |
| `contact_request` | `Contact` | Enquiry sent |

**Optimise your ad sets for `Lead`.** Optimising for landing page views buys
you traffic; optimising for `Lead` buys you registrations.

Set `NEXT_PUBLIC_META_PIXEL_ID` and the pixel loads. `investor_form_step` is
useful as a custom conversion for diagnosing *where* people drop out.

> **Worth knowing:** browser pixels miss a meaningful share of conversions to
> tracking prevention and ad blockers. If spend gets significant, add Meta's
> Conversions API server-side. The `click_id` stored against every lead is what
> you'd match on, which is why it's captured.

---

## Link previews

Shared links render a branded card (1200×630) generated at build time — dark
ground, brass rule, the campaign's own headline. Each campaign gets its own, so
a forwarded link carries that campaign's message.

To check one after deploying, run the URL through Meta's Sharing Debugger and
hit "Scrape Again" — Facebook caches previews aggressively and will keep serving
a stale one otherwise.

---

## A sensible first test

1. Two campaigns — `under-500k` and `diversify-from-residential`. They target
   different motivations and will teach you the most about your audience.
2. Two creatives each, distinguished by `utm_content`.
3. Optimise for `Lead`.
4. Let it run until each ad set has produced enough leads to judge — a handful
   is noise.
5. Compare **hot rate**, not lead count.
6. Kill the weakest creative, add a new one against the winner.

The form takes about two minutes and asks for a mobile number, so expect a
lower registration rate than a single-field email capture — and a far higher
proportion of people worth calling. That trade is the point of the whole design.
