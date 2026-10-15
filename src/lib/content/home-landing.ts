/**
 * NewPF — copy, form options and the builder-home index for the landing page
 * at `/`. Editing this file is all it takes to change what the page says.
 *
 * CLAIMS. Every factual statement here is one of:
 *   - supplied by the business: established townhouses, typically
 *     $900,000–$1.3 million, the four suburbs, the builder's marketing
 *     restriction;
 *   - checked publicly: each suburb's council (see SUBURB_COUNCILS);
 *   - a description of how NewPF works with buyers.
 * Don't add a claim about the homes themselves (bedrooms, parking, outdoor
 * space, finishes, distances, "inner" Melbourne) unless it has been verified
 * for every home it would describe. "Inner Melbourne" was deliberately not
 * used: the current suburbs are 9–12 km from the CBD, in the north.
 *
 * IMAGERY. No property photographs and nothing that could identify a
 * restricted home: the page uses original drawings (components/brand/Artwork).
 * A builder's own photo appears only where a FEATURED_HOMES entry carries one
 * the builder has authorised.
 */

import { SUBURB_PATTERN } from "./home-options";

// Form options and suburb helpers live in a browser-safe module of their own,
// so the client bundle never carries FEATURED_HOMES' approval notes.
export * from "./home-options";

/* ------------------------------------------------------------------ */
/* Builder homes: suburb (and an authorised photo) only                 */
/* ------------------------------------------------------------------ */

/**
 * Homes a builder has cleared to show publicly — as a SUBURB NAME, and a
 * PHOTO only where the builder has authorised one. There is deliberately no
 * field for an address, lot, street, estate, development or price, so one
 * can't be added by accident; `tests/featured-homes` also rejects a suburb
 * containing a number (which is what an address looks like).
 *
 * Each entry records who at the builder approved it and the evidence. An
 * entry without both is not shown. `approvalExpires` (YYYY-MM-DD, optional):
 * the suburb disappears from the page after it.
 */
export type FeaturedHome = {
  suburb: string;
  photo?: string;
  approvedBy: string;
  approvalRef: string;
  approvalExpires?: string;
};

/**
 * Approval so far: given verbally by the builder to the agency owner on
 * 15 Oct 2026 — photo (or generic image) and suburb only, no address.
 * Replace `approvedBy` with the builder contact's name and `approvalRef` with
 * the date of their confirming email once you have it.
 */
const BUILDER_APPROVAL = {
  approvedBy: "Builder (contact name to be recorded)",
  approvalRef: "Verbal approval to the agency owner, 15/10/2026: photo and suburb only, no address — confirm by email",
};

export const FEATURED_HOMES: FeaturedHome[] = [
  { suburb: "Reservoir", ...BUILDER_APPROVAL },
  { suburb: "Preston", ...BUILDER_APPROVAL },
  { suburb: "Pascoe Vale", ...BUILDER_APPROVAL },
  { suburb: "Bellfield", ...BUILDER_APPROVAL },
  // To add another — and, if the builder authorises it, a photo saved in
  // public/homes/ — copy an entry and add e.g. photo: "/homes/preston-1.jpg".
];

/**
 * Council for each suburb, shown in the index. Checked against public sources
 * (Wikipedia, eMelbourne, council and agency suburb profiles), Oct 2026.
 * A suburb not listed here simply shows without a council.
 */
export const SUBURB_COUNCILS: Record<string, string> = {
  Reservoir: "City of Darebin",
  Preston: "City of Darebin",
  "Pascoe Vale": "City of Merri-bek",
  Bellfield: "City of Banyule",
};

/**
 * Entries safe to put on the public page: approval recorded and not lapsed,
 * and a suburb that is just a suburb (letters only — any digit means someone
 * has typed a street address or lot number).
 */
export function publishableFeaturedHomes(
  homes: FeaturedHome[] = FEATURED_HOMES,
  today: string = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(new Date()),
): FeaturedHome[] {
  return homes.filter(
    (home) =>
      SUBURB_PATTERN.test(home.suburb.trim()) &&
      home.approvedBy.trim().length > 0 &&
      home.approvalRef.trim().length > 0 &&
      (!home.approvalExpires || home.approvalExpires >= today),
  );
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export const HOME_COPY = {
  metaTitle: "Established townhouses in Melbourne's north",
  metaDescription:
    "Established townhouses in Melbourne's northern neighbourhoods, typically $900,000 to $1.3 million, introduced personally. Register your interest.",

  descriptor: "Established townhouses",
  heroEyebrow: "Established townhouses — Melbourne's north",
  /** Two lines; the second is set in italic. */
  headline: ["Melbourne's north.", "A more considered way home."],
  subhead:
    "Discover established townhouses across Melbourne's northern neighbourhoods, introduced through a considered and personal property experience.",
  primaryCta: "Explore Available Opportunities",
  secondaryCta: "Register Your Interest",
  facts: [
    { label: "Homes", value: "Established townhouses" },
    { label: "Typically", value: "$900,000 – $1.3 million" },
  ],

  approachLabel: "Approach",
  approachStatement: "Homes introduced, not advertised.",
  approachBody:
    "The townhouses we present are subject to the builder's marketing restrictions, so you won't find them here with an address or a photograph. We introduce them directly instead — by suburb first, then in full once we understand what you're looking for.",
  principles: [
    {
      title: "Already built",
      body: "Established townhouses, so you consider the home itself rather than a plan.",
    },
    {
      title: "Introduced personally",
      body: "Details come from a person who can answer your questions, not from a listing.",
    },
    {
      title: "Room without relocating",
      body: "For buyers who want more space without leaving the neighbourhoods they know.",
    },
  ],

  opportunitiesLabel: "Available opportunities",
  opportunitiesHeading: "Current opportunities, by suburb.",
  opportunitiesBody:
    "At the builder's request, addresses and photographs aren't published. Choose a suburb and we'll send you the details directly. All opportunities are subject to availability.",
  opportunityCta: "Request details",

  audienceLabel: "Who it's for",
  audience: ["Professionals.", "Couples.", "Growing families.", "Owner-occupiers."],
  audienceNote:
    "And anyone looking for more space without leaving an established urban neighbourhood.",

  processLabel: "How it works",
  process: [
    { title: "Register your interest", body: "Your budget, preferred suburbs and timing. It takes about a minute." },
    { title: "A personal introduction", body: "We contact you to talk it through, and share details of homes that may suit." },
    { title: "See it in person", body: "If a home interests you, we arrange a time for you to inspect it." },
  ],

  registerLabel: "Register",
  registerHeading: "Register your interest.",
  registerBody:
    "Tell us what you're looking for and we'll be in touch personally. There's no obligation, and your details aren't shared with anyone without your agreement.",

  imageNote:
    "Illustrations on this page are original drawings and don't depict any property. In line with builder marketing restrictions, no property addresses or photographs are published.",
  disclaimer:
    "Information on this page is general in nature. Registering your interest doesn't create any obligation to buy. Prices are indicative of the homes we typically present; opportunities are subject to availability.",
} as const;

