import type { Budget, LocationScope, PropertyType } from "../taxonomy";

/**
 * Paid-social campaign landing pages.
 *
 * These are NOT the SEO pages. Search traffic arrives with intent and patience;
 * paid social traffic is interrupted mid-scroll, is overwhelmingly on a phone,
 * and decides in about three seconds. So these pages are built differently:
 *
 *   - one message, matched to the ad that paid for the click
 *   - the form is the page, not a destination further down it
 *   - no site navigation — every outbound link is a leak of paid traffic
 *   - the questions the ad already answered are pre-filled
 *
 * Compliance is unchanged and non-negotiable: no guarantee of return, rental,
 * yield or growth; no claim that commercial beats residential; no individual
 * property, developer, project or address. Ad platforms police financial
 * advertising heavily, and a compliant page is also a page that stays live.
 */

export type Campaign = {
  slug: string;
  /** Internal label, shown in admin and used as the default utm_campaign. */
  name: string;
  art: "warehouse" | "industrial" | "storage" | "commercial" | "streetscape";
  /** Small line above the headline. Keep it short — it competes with nothing. */
  eyebrow: string;
  /** The promise. Should echo the ad's first line almost word for word. */
  h1: string;
  subhead: string;
  /** Three scannable reasons to keep reading. Six words each, at most. */
  proofPoints: string[];
  /** What registering actually gets them. */
  whatYouGet: string[];
  /** The two or three objections that stop this audience converting. */
  objections: { q: string; a: string }[];
  formHeading: string;
  formSubheading: string;
  /** Pre-answers the questions the ad established. */
  prefill?: { propertyType?: PropertyType; budget?: Budget; locationScope?: LocationScope };
  metaTitle: string;
  metaDescription: string;
  /** Suggested ad copy, so the page and the creative stay in sync. */
  adCopy: { primaryText: string; headline: string; description: string };
};

export const CAMPAIGNS: Campaign[] = [
  {
    slug: "warehouse-melbourne",
    name: "Warehouse — Melbourne",
    art: "warehouse",
    eyebrow: "Melbourne & Victoria",
    h1: "Warehouse investment opportunities, matched to your budget",
    subhead:
      "Tell us your budget and preferred area. We'll let you know when a warehouse or industrial opportunity comes up that appears to fit — before it goes anywhere public.",
    proofPoints: [
      "Melbourne & regional Victoria",
      "Two-minute registration",
      "No obligation to purchase",
    ],
    whatYouGet: [
      "Opportunities filtered to your budget and area, not a mailing list",
      "Property type, size, price, estimated rental and outgoings up front",
      "A straight answer when nothing suitable is available",
      "Your criteria kept private, and withdrawable at any time",
    ],
    objections: [
      {
        q: "Am I committing to anything?",
        a: "No. You're telling us what you're looking for so we can work out whether anything currently available is relevant. There's no obligation to purchase, inspect or proceed.",
      },
      {
        q: "Why isn't there a list of properties on this page?",
        a: "We don't publish listings. Opportunities are discussed directly with investors whose criteria appear to fit, which is why the first step is telling us yours.",
      },
      {
        q: "I've only bought residential before.",
        a: "That's the most common starting point. Commercial works differently — longer leases, outgoings that may be recoverable, different finance. We'll walk you through what's realistic at your price point.",
      },
    ],
    formHeading: "See what may suit your budget",
    formSubheading: "Six quick taps, then your details. About two minutes.",
    prefill: { propertyType: "warehouse" },
    metaTitle: "Warehouse Investment Opportunities | Register Your Criteria",
    metaDescription:
      "Register your budget and preferred area and we'll identify warehouse and industrial investment opportunities that may suit. No obligation.",
    adCopy: {
      primaryText:
        "Looking at commercial property but tired of scrolling listings that don't fit? Tell us your budget and area, and we'll let you know when a warehouse opportunity comes up that actually matches. No obligation to purchase.",
      headline: "Warehouse investment opportunities",
      description: "Register your criteria in two minutes",
    },
  },
  {
    slug: "under-500k",
    name: "Entry price — under $500k",
    art: "commercial",
    eyebrow: "Lower-entry commercial",
    h1: "Commercial property investment from under $500,000",
    subhead:
      "Smaller commercial and storage-style assets can sit at price points investors don't expect. Tell us your budget and we'll let you know what's realistic — and what's actually available.",
    proofPoints: ["Lower-entry price points", "Melbourne & Victoria", "No obligation to purchase"],
    whatYouGet: [
      "An honest view of what your budget reaches in commercial property",
      "Opportunities filtered to your price range and preferred area",
      "Size, price, estimated rental and outgoings before you commit time",
      "A plain-English guide to how commercial income and outgoings work",
    ],
    objections: [
      {
        q: "Can you really buy commercial under $500,000?",
        a: "That segment exists — typically smaller strata-titled units rather than standalone buildings. What's available at any given moment varies, which is exactly what we'll tell you.",
      },
      {
        q: "Is a cheaper property a riskier one?",
        a: "Not automatically, but the risks are different. Smaller and more specialised properties can have a narrower tenant pool, and owners corporation obligations add a layer. Every property should be assessed on its own merits with independent advice.",
      },
      {
        q: "What deposit will I need?",
        a: "Commercial lending typically asks for a larger deposit than residential, and terms vary by lender and asset type. Worth speaking to a commercial broker early — we can talk you through what we see.",
      },
    ],
    formHeading: "Find out what your budget reaches",
    formSubheading: "Six quick taps, then your details. About two minutes.",
    prefill: { budget: "300k_500k" },
    metaTitle: "Commercial Property Under $500,000 | Register Your Criteria",
    metaDescription:
      "What can you buy in commercial property under $500,000? Register your budget and area and we'll identify opportunities that may suit. No obligation.",
    adCopy: {
      primaryText:
        "Most people assume commercial property starts in the millions. Smaller commercial and storage-style assets can sit well below that. Tell us your budget — we'll tell you what's realistic.",
      headline: "Commercial property from under $500k",
      description: "See what may suit your budget",
    },
  },
  {
    slug: "diversify-from-residential",
    name: "Diversify — residential investors",
    art: "streetscape",
    eyebrow: "For residential investors",
    h1: "Already own residential? Here's how commercial differs",
    subhead:
      "Longer leases, outgoings that may be recoverable, a different tenant base and different finance. Tell us what you're considering and we'll show you what's actually available at your budget.",
    proofPoints: [
      "Different sector, different drivers",
      "Melbourne & Victoria",
      "No obligation to purchase",
    ],
    whatYouGet: [
      "A clear comparison of how commercial and residential actually differ",
      "Opportunities matched to your budget, area and objectives",
      "The risks set out plainly — vacancy, outgoings, liquidity, finance",
      "The Commercial Property Investor Starter Guide, free",
    ],
    objections: [
      {
        q: "Is commercial better than residential?",
        a: "Neither is better. They behave differently and suit different objectives — different lease structures, tenant pools, vacancy patterns and finance. Which suits you depends on your circumstances, and you should get independent advice.",
      },
      {
        q: "What's the main thing that catches people out?",
        a: "Vacancy. A commercial property earns nothing while it's empty, and re-letting can take considerably longer than residential while the outgoings keep running. It's worth knowing how long you could comfortably carry a property.",
      },
      {
        q: "Do I need to decide anything now?",
        a: "No. Plenty of people register while they're still working out whether commercial suits them at all. We'll keep your criteria on file and get in touch if something relevant comes up.",
      },
    ],
    formHeading: "Tell us what you're considering",
    formSubheading: "Six quick taps, then your details. About two minutes.",
    metaTitle: "Commercial vs Residential Investment | Register Your Criteria",
    metaDescription:
      "Considering commercial property after building a residential portfolio? Understand how it differs and register your criteria to see what may suit.",
    adCopy: {
      primaryText:
        "You've done residential. Commercial works differently — longer leases, outgoings that may be recoverable, a different tenant base. Worth understanding before you decide either way.",
      headline: "Residential investor considering commercial?",
      description: "See how the two actually differ",
    },
  },
  {
    slug: "storage-investment",
    name: "Storage — entry level",
    art: "storage",
    eyebrow: "Storage & small commercial",
    h1: "Storage unit investment, explained properly",
    subhead:
      "Often the smallest capital commitment in commercial property — and the most misunderstood. Tell us your budget and we'll show you what's available, and what to check before you commit.",
    proofPoints: ["Smallest entry point", "Melbourne & Victoria", "No obligation to purchase"],
    whatYouGet: [
      "What you're actually buying, including the owners corporation position",
      "Opportunities filtered to your budget and preferred area",
      "The questions worth asking before you commit to a complex",
      "A straight answer when nothing suitable is available",
    ],
    objections: [
      {
        q: "Is storage a good first commercial investment?",
        a: "It can be an accessible entry point because the capital commitment is lower. Accessible isn't the same as low risk — the owners corporation position, complex occupancy and resale market all warrant careful review, with independent advice.",
      },
      {
        q: "What return should I expect?",
        a: "We won't quote you one, and be cautious of anyone who does. Income depends on the specific unit, the complex, local demand and the lease terms. What matters is the net position after levies and costs.",
      },
      {
        q: "Can I get finance on one?",
        a: "Some lenders will, though terms vary and some treat smaller specialised assets more conservatively. Worth a conversation with a commercial broker before you commit.",
      },
    ],
    formHeading: "See what's available at your budget",
    formSubheading: "Six quick taps, then your details. About two minutes.",
    prefill: { propertyType: "storage" },
    metaTitle: "Storage Property Investment | Register Your Criteria",
    metaDescription:
      "Storage unit investment explained: what you're buying, what to check, and what may suit your budget. Register your criteria. No obligation.",
    adCopy: {
      primaryText:
        "Storage units are often the smallest way into commercial property — and the most misunderstood. Here's what you're actually buying, and what to check before you commit.",
      headline: "Storage property investment explained",
      description: "Register your criteria in two minutes",
    },
  },
];

export function getCampaign(slug: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.slug === slug);
}

export const CAMPAIGN_SLUGS = CAMPAIGNS.map((c) => c.slug);
