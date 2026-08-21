/**
 * Default follow-up sequence. These are seeded into `email_templates` and are
 * editable from the admin area — the code never hard-codes copy at send time,
 * it always reads the current row.
 *
 * Merge fields available: {{firstName}} {{lastName}} {{propertyType}}
 * {{budget}} {{location}} {{timeframe}} {{siteName}} {{siteUrl}}
 *
 * Compliance note: none of this copy may promise a return, guarantee rental,
 * or attach a specific property. Email 1 confirms receipt only.
 */

export type EmailTemplateSeed = {
  key: string;
  name: string;
  subject: string;
  body: string;
  delayHours: number;
};

export const EMAIL_TEMPLATE_SEEDS: EmailTemplateSeed[] = [
  {
    key: "investor_welcome",
    name: "Email 1 — Registration received",
    subject: "Thanks for registering for Commercial Investor Access",
    delayHours: 0,
    body: `Hi {{firstName}},

Thanks for registering for Commercial Investor Access.

We've received your investment criteria:

  Property type: {{propertyType}}
  Budget: {{budget}}
  Location: {{location}}
  Timeframe: {{timeframe}}

Here's what happens next. We review the opportunities currently available through our network against what you've told us. If something appears to line up with your budget, location and objectives, we'll be in touch to talk it through.

If nothing suitable is available right now, we'll keep your criteria on file and contact you when something relevant comes up. There's no obligation at any stage, and you can update or withdraw your criteria at any time by replying to this email.

Kind regards,
{{siteName}}

---
Information provided is general in nature and does not constitute financial, legal or investment advice. Commercial property involves risks and investors should conduct their own due diligence and obtain independent professional advice before making an investment decision.`,
  },
  {
    key: "investor_education",
    name: "Email 2 — Commercial property essentials",
    subject: "A few things worth understanding about commercial property",
    delayHours: 48,
    body: `Hi {{firstName}},

While we review what's available against your criteria, here are the things most investors tell us they wish they'd understood earlier.

1. Income works differently
Commercial tenants typically sign longer leases than residential tenants, and lease terms vary considerably between properties. The structure of the lease matters as much as the headline rent.

2. Outgoings change the picture
Council rates, water, insurance, owners corporation fees and land tax all sit in the outgoings column. Depending on the lease, some or all of these may be recoverable from the tenant. Net figures tell you more than gross figures.

3. Yield is a calculation, not a promise
Yield is simply income divided by price. It reflects a point in time and a set of assumptions. It can change if the tenancy, the rent or the outgoings change.

4. Vacancy is the main risk to plan for
A vacant commercial property earns nothing while it's empty, and re-letting periods can be longer than residential. Investors should consider how long they could comfortably carry a property without a tenant.

5. Due diligence is not optional
Building condition, permitted use, zoning, lease documentation and owners corporation records all warrant review before you commit.

You can read more in our resources section: {{siteUrl}}/resources

If you'd like to talk any of this through, just reply to this email.

Kind regards,
{{siteName}}

---
Information provided is general in nature and does not constitute financial, legal or investment advice. Commercial property involves risks and investors should conduct their own due diligence and obtain independent professional advice before making an investment decision.`,
  },
  {
    key: "investor_invitation",
    name: "Email 3 — Invitation to speak",
    subject: "Would it help to talk through what you're looking for?",
    delayHours: 120,
    body: `Hi {{firstName}},

You registered with us recently looking for {{propertyType}} in {{location}} around the {{budget}} mark.

If it would help, we're happy to have a short conversation about what you're trying to achieve. Investors usually find it useful for working out:

  - what's realistic at their price point
  - which asset types suit their objectives
  - what to look at closely before committing
  - how to compare one opportunity against another

There's no cost and no obligation to purchase anything. If the timing isn't right, that's completely fine — just let us know and we'll keep your criteria on file.

You can reply to this email, or update your criteria any time at {{siteUrl}}/register

Kind regards,
{{siteName}}

---
Information provided is general in nature and does not constitute financial, legal or investment advice. Commercial property involves risks and investors should conduct their own due diligence and obtain independent professional advice before making an investment decision.`,
  },
  {
    key: "guide_delivery",
    name: "Lead magnet — Starter guide",
    subject: "Your Commercial Property Investor Starter Guide",
    delayHours: 0,
    body: `Hi {{firstName}},

Thanks for requesting the Commercial Property Investor Starter Guide. You can read it here:

{{siteUrl}}/guide/read

It covers what commercial property is, the main asset types, how rental income and outgoings work, lease considerations, due diligence, finance considerations, the questions worth asking and the mistakes we see most often.

If you'd like us to look at what's currently available against your budget and location, you can register your criteria here:

{{siteUrl}}/register

Kind regards,
{{siteName}}

---
Information provided is general in nature and does not constitute financial, legal or investment advice. Commercial property involves risks and investors should conduct their own due diligence and obtain independent professional advice before making an investment decision.`,
  },
];

/** Simple, dependency-free mustache-style merge. Unknown fields render empty. */
export function renderTemplate(template: string, vars: Record<string, string | null | undefined>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? "");
}
