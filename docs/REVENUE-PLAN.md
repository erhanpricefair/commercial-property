# Getting to $100,000

An honest read of what the number requires, what the platform now does about
it, and what only you can do.

> Every figure below is **illustrative**, using placeholder rates. Put your own
> commission rate and average price into **Admin → Settings** and the dashboard
> will do this arithmetic against your live pipeline instead.

---

## $100k is not a traffic problem

It's a small number of transactions. At an illustrative 4% commission:

| Average property price | Commission per sale | Sales to reach $100k |
| --- | --- | --- |
| $300,000 | $12,000 | ~9 |
| $500,000 | $20,000 | 5 |
| $700,000 | $28,000 | ~4 |
| $1,000,000 | $40,000 | 3 |

So the whole exercise is: **produce three to nine qualified buyers who
transact.** That reframes what to optimise. Doubling website traffic is worth
far less than lifting the proportion of registrations you actually call, or
shifting your average price point up a band.

Work backwards from your own numbers:

```
Sales needed        = target ÷ (average price × commission rate)
Registrations needed = sales needed ÷ your registration-to-sale rate
Ad spend needed      = registrations needed × your cost per registration
```

The dashboard computes the first two continuously. The third you'll only know
once ads have run for a week or two.

---

## The thing that decides whether "quick" is possible

**When does your channel partner actually pay?**

This matters more than anything on the website:

| Stock type | Commission typically payable | Realistic time to cash |
| --- | --- | --- |
| **Completed** | On settlement | Weeks after unconditional — often 30–60 days |
| Under construction | On completion | Months |
| Off the plan | On completion | Can be a year or more |

A $40,000 commission on off-the-plan stock and a $20,000 commission on a
completed property are not comparable if you need money this quarter. The
first might land after the second has already been spent.

**Three questions to put to your channel partner this week:**

1. Is commission paid at unconditional exchange, or at settlement?
2. What proportion of current stock is completed and settleable now?
3. Is any part of the commission payable earlier — on exchange, or on deposit?

The answers determine whether a near-term target is achievable at all. If
everything available is off-the-plan, no amount of lead generation produces
cash in the next few months, and you'd be better off negotiating terms than
buying traffic.

**The platform now reflects this.** Every coverage area and deal shows a
settlement-speed flag — *Settles in weeks* in green for completed stock,
*Settles on completion* for the rest — on the call list, the deal record and
the dashboard. The dashboard also shows how much commission is sitting in
completed stock specifically.

---

## What the platform now does for you

**Revenue tracker** (dashboard). Your target, what's banked, what's committed,
and a probability-weighted forecast of everything open. It translates the gap
into *deals still needed* and *registrations still needed*, so the target is
operational rather than aspirational. The stage probabilities are deliberately
conservative — a forecast that flatters you hides the problem until it's too
late to fix.

**Deal records.** Attach a deal to an investor the moment you send them an
opportunity, not at settlement. Price and commission calculate automatically.
Stages carry a probability, so the forecast updates as things move.

**Instant HOT lead alerts.** When a lead scores HOT, you get an email
immediately — not on the next cron run — with their criteria, match count and
a tap-to-call link. Speed of first contact is the largest controllable factor
in whether a registration becomes a sale. Set `OWNER_ALERT_EMAIL`.

**The call list** (`/admin/today`, built for your phone). Uncontacted leads
first, highest scoring at the top. Each card carries the whole pre-call brief:
what they want, their budget, finance position, what you could show them, what
it's worth in commission, and one tap to dial. Six one-tap outcomes log the
call and schedule the follow-up without opening anything else.

**Campaign attribution.** Which ad, which creative, and — crucially — the hot
rate per campaign, not just the lead count.

---

## The sequence

**This week — nothing else matters until these are done**

1. **Record your coverage.** Not a stocklist — asset type, suburb or area, and
   a price band, from your own market knowledge. Five or six rows is enough,
   and matching works from the first one. `npm run coverage:seed` gives you
   starter bands to correct. → `docs/COVERAGE.md`
2. **Deploy.** No traffic can arrive at a repository. → `docs/GO-LIVE.md`
3. **Ask your channel partner the three payment-timing questions above.**
4. **Set your target and commission rate** in Admin → Settings.

**Next — before spending on ads**

5. Start Meta's financial-services verification. It gates the whole channel and
   takes time. → `docs/CAMPAIGNS.md`
6. Run the pre-flight checklist. Register on your own live site and confirm the
   alert reaches your phone.
7. Warm outreach first: anyone who has previously enquired, your existing
   network, past residential clients considering diversification. These convert
   at a far higher rate than cold traffic and cost nothing. Point them at
   `/register` and work the call list.

**Then — paid traffic**

8. Two campaigns, two creatives each, optimised for the `Lead` event. Start
   small — enough to learn the cost per registration, not enough to hurt.
   → `docs/CAMPAIGNS.md`
9. Judge on **hot rate**, not lead volume. Kill the weakest creative weekly.
10. Watch cost per registration against commission per deal. If a registration
    costs $80 and 3% convert, each sale costs ~$2,700 in ad spend against a
    $20,000 commission. Those are workable economics; if your real numbers say
    otherwise, stop spending and fix conversion first.

---

## Where the leverage actually is

In rough order of return on your effort:

1. **Call every HOT lead within the hour.** Free. Larger effect than anything
   else on this list.
2. **Sell completed stock first.** Same work, cash months earlier.
3. **Raise your average price point.** Three $700k sales beat nine $300k sales
   for the same target — and roughly the same amount of work per sale.
4. **Work the existing list before buying a new one.** Nurture leads become hot
   when their circumstances change; nobody else is calling them.
5. **Ad creative.** Real, but downstream of all of the above.

---

## What this platform cannot do

It generates and organises demand, and it tells you where you stand. It cannot
supply stock you don't have, shorten a settlement period, or close a sale.

If the honest answer to "what can I sell today that settles quickly" is *not
much*, the constraint is supply, not marketing — and the fastest route to
$100,000 runs through your channel partner, not your ad account.
