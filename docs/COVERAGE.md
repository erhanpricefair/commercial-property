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
| Suburb | Truganina | The strongest matching signal |
| Area | Western Melbourne | Chosen from a list, drives metro vs regional |
| Price band | $420,000 – $950,000 | Band, never an exact figure |
| How often available | Comes up occasionally | Orders your call list |
| Typically | Completed | Drives the settlement-speed flag |
| Notes | *Yours only* | Never shown to an investor |

**Suburb with no address is the point.** "Warehouse, Truganina, $420k–950k" is
market knowledge — anyone active in the western industrial market knows there
is warehouse stock in Truganina at that sort of money. It becomes a stocklist
only when it names a building, and there is nowhere here to put one.

The area is a **structured choice**, not free text, because whether a precinct
counts as metropolitan drives location matching. Sniffing that from a typed
string ("Nth Melbourne", "Melb North") fails silently — an investor who asked
for Melbourne quietly stops matching coverage that does cover them.

### Adding suburbs quickly

The suburbs box takes a comma- or line-separated list and creates one row per
suburb, so a whole precinct goes in at once:

```
Truganina, Laverton North, Derrimut, Sunshine, Ravenhall
```

Five or six precincts is enough to start. Matching works from the first row.

## How matching works without stock

An investor states a budget **band**. Coverage states a price **band**. A match
is an overlap. Nothing on either side is an exact price for an individual
property, which is precisely why this works without holding a stocklist.

The investor record then answers plainly: **"Can we help them? Yes — 9 areas we
cover"**, with the reasoning shown, and a note that what's actually available
should be checked with your partner before you present anything.

Matches are **grouped by precinct**, so five storage suburbs across the north
read as one line rather than five near-identical ones — the way you'd say it on
a call.

Ranking, in order of weight:

1. **A suburb or area they typed themselves.** Someone who wrote "Ballarat" is
   telling you more than someone who ticked "regional Victoria". "Northern
   suburbs" finds Northern Melbourne; "Melbourne" on its own doesn't favour any
   metro precinct, because it describes them all equally.
2. **Asset type and budget-band overlap.**
3. **How often something comes up** — a bounded nudge, never enough to overturn
   fit. A rarely-available area that matches their suburb still outranks a
   frequently-available one in the wrong region, because the first is a call
   worth making.

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

Seeds 38 suburb-level bands across Melbourne's established industrial and
commercial precincts and regional Victoria, as a starting point.
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
