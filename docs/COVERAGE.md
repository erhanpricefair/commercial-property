# Coverage, not stock

## Why this exists

A channel partner's stocklist is their property. Loading it into a third-party
system — even a private one — is the kind of thing that damages the
relationship that the whole business depends on, and no amount of lead
generation is worth that.

So the platform's primary matching source is **coverage**, not stock.

|  | Stocklist | Coverage |
| --- | --- | --- |
| What it is | Specific properties available now | What you can source, at market level |
| Example | *Warehouse 29, 14 Example St, Coburg North, $714,000* | *Warehouse, Northern Melbourne, $420k–950k, comes up occasionally* |
| Whose information | Your channel partner's | Your own market knowledge |
| Goes stale | Daily | Quarterly |
| Answers | "What can I sell today?" | "Is this investor worth calling?" |

The second question is the one you actually need answered when a registration
arrives at 9pm. What is available on the day is a question for your partner, at
the time, in a conversation — which is where it belongs.

## The protection is structural

The `coverage_areas` table has **no columns** for a developer, a development
name, an address, a lot number or a source channel. Not "please don't fill
these in" — the columns do not exist. A specific property cannot be recorded
there even by accident, by you or by anyone you give admin access to.

A test asserts those columns stay absent, so nobody can helpfully add one later.

## What a coverage row looks like

| Field | Example | Why |
| --- | --- | --- |
| Property type | Warehouse | Matches against what the investor asked for |
| Suburb *or* area | Northern Melbourne | Suburb if you're confident, area if not |
| State | VIC | |
| Price band | $420,000 – $950,000 | Band, never an exact figure |
| How often available | Comes up occasionally | Orders your call list |
| Typically | Completed | Drives the settlement-speed flag |
| Notes | *Yours only* | Never shown to an investor |

Five or six rows is enough to start. Matching works from the moment the first
one exists.

## How matching works without stock

An investor states a budget **band**. Coverage states a price **band**. A match
is an overlap. Nothing on either side is an exact price for an individual
property, which is precisely why this works without holding a stocklist.

The investor record then answers plainly: **"Can we help them? Yes — 8 coverage
areas"**, with the reasoning shown, and a note that what's actually available
should be checked with your partner before you present anything.

Fit dominates the ranking; how often something comes up is only a tiebreaker. A
rarely-available area that matches their suburb and budget outranks a
frequently-available one in the wrong region — because the first is a call
worth making and the second isn't.

## Keeping it honest

Coverage you haven't checked in 90 days shows as **needs re-confirming** on the
coverage page and in the dashboard. Open it, correct anything that's moved, and
hit *Still accurate*.

This matters more than it sounds. Coverage that's quietly wrong has you calling
investors you can't help — which wastes your time and, worse, spends your
credibility with people who might have been buyers later.

## Getting started

```bash
npm run coverage:seed
```

Seeds ten broad Melbourne and regional Victorian bands as a starting point.
**Every row is marked `VERIFY`.** Open Admin → Coverage, correct each band to
what you can genuinely source, and confirm it. The seed is scaffolding, not
knowledge — it's there so the system is usable in five minutes, not so you can
skip thinking about it.

## When you *are* authorised to record a specific property

The Opportunities section still exists, with the full private fields, for when
a partner has explicitly cleared you to record and present a specific property
to a named investor. It's optional: nothing in the platform requires it, and
the whole system works on coverage alone.

If in doubt, don't. Coverage is enough to run the business.
