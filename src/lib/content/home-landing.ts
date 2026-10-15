/**
 * Copy, options and imagery for the residential home-buyer landing page (`/`).
 *
 * Editing this file is all it takes to change the wording, the form choices or
 * the photos.
 *
 * PHOTOS: generic stock images under the Unsplash License (free for commercial
 * use, no attribution required), loaded straight from images.unsplash.com.
 * They are deliberately NOT of any home the agency is marketing, and the page
 * labels them as illustrative — a photo of a real listing would imply that
 * home is available. To use your own, put files in `public/homes/` and change
 * `src` to e.g. "/homes/hero.jpg".
 */

export type HomePhoto = { src: string; alt: string };

const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=70`;

export const HOME_PHOTOS = {
  hero: { src: unsplash("photo-1568605114967-8130f3a36994", 2000), alt: "A family home with a front lawn" },
  gallery: [
    { src: unsplash("photo-1570129477492-45c003edd2be", 900), alt: "A modern family home" },
    { src: unsplash("photo-1564013799919-ab600027ffc6", 900), alt: "A contemporary home with a pool" },
    { src: unsplash("photo-1600596542815-ffad4c1539a9", 900), alt: "A two-storey home at dusk" },
  ],
} satisfies { hero: HomePhoto; gallery: HomePhoto[] };

/* ------------------------------------------------------------------ */
/* Builder homes: photo + suburb, nothing else                         */
/* ------------------------------------------------------------------ */

/**
 * Homes a builder has cleared to show publicly — as a PHOTO and a SUBURB NAME
 * ONLY. There is deliberately no field for an address, lot, street, estate or
 * development name, so one can't be added by accident; `tests/featured-homes`
 * also rejects a suburb containing a number (which is what an address looks
 * like). No price either: the builder cleared photo and suburb, nothing more.
 *
 * Each entry records who at the builder approved it and the evidence. An
 * entry without both is not shown. Ask the builder to confirm by email and
 * put that email's date in `approvalRef` — a phone call is hard to point to
 * later.
 *
 * `photo`: the builder's photo, saved in `public/homes/` (e.g.
 * "/homes/tarneit-1.jpg"). Leave it out to use the standard generic photo.
 * `approvalExpires` (YYYY-MM-DD, optional): the card disappears after it.
 */
export type FeaturedHome = {
  suburb: string;
  photo?: string;
  approvedBy: string;
  approvalRef: string;
  approvalExpires?: string;
};

export const FEATURED_HOMES: FeaturedHome[] = [
  // Example — copy, fill in and uncomment:
  // {
  //   suburb: "Tarneit",
  //   photo: "/homes/tarneit-1.jpg",
  //   approvedBy: "Jane Citizen, Example Builder Pty Ltd",
  //   approvalRef: "Email 15/10/2026: photo and suburb only, no address",
  // },
];

/** The standard generic photo, for a home the builder hasn't supplied one for. */
export const GENERIC_HOME_PHOTO: HomePhoto = {
  src: unsplash("photo-1568605114967-8130f3a36994", 900),
  alt: "",
};

const SUBURB_PATTERN = /^[A-Za-z][A-Za-z' .-]{1,48}$/;

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

/** Clean a suburb passed in a URL (`/?suburb=Tarneit`) before it reaches the form. */
export function cleanSuburbParam(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim().slice(0, 50);
  return SUBURB_PATTERN.test(trimmed) ? trimmed : "";
}

export const HOME_COPY = {
  metaTitle: "Find Your Next Home in Melbourne",
  metaDescription:
    "Tell us your budget, suburbs and timing, and a local agent will be in touch about homes that may suit you. Free and no obligation.",
  eyebrow: "Melbourne homes",
  headline: "Find your next home in Melbourne",
  subhead:
    "Tell us your budget, the suburbs you like and when you'd like to move. A local agent will be in touch about homes that may suit you.",
  trust: ["Free, no obligation", "Takes under a minute", "Your details stay private"],
  stepsHeading: "How it works",
  steps: [
    { title: "Tell us what you're after", body: "Budget, suburbs, the type of home and your timing." },
    { title: "We get in touch", body: "A local agent contacts you to talk through what you're looking for." },
    { title: "See homes that may suit", body: "We let you know about homes that match what you've told us." },
  ],
  galleryCaption: "Stock images, for illustration only. Not homes currently for sale.",
  featuredHeading: "Homes in these suburbs",
  featuredBody:
    "Builder homes in the suburbs below. Tap a suburb and we'll send you the details, subject to availability.",
  featuredCta: "Ask about this home",
  featuredGenericCaption: "Representative image",
  closingHeading: "Ready to start looking?",
  closingBody: "It takes under a minute, and there's no obligation.",
  disclaimer:
    "Information on this page is general in nature. Registering your details does not create any obligation to buy, and availability of homes matching your criteria isn't guaranteed.",
} as const;

/* ------------------------------------------------------------------ */
/* Form options                                                        */
/* ------------------------------------------------------------------ */

export const HOME_TYPES = ["house", "townhouse", "apartment", "land", "open"] as const;
export const HOME_TYPE_LABELS: Record<(typeof HOME_TYPES)[number], string> = {
  house: "House",
  townhouse: "Townhouse",
  apartment: "Apartment",
  land: "Land",
  open: "Open to options",
};

export const HOME_BUDGETS = [
  "under_600k",
  "600k_800k",
  "800k_1m",
  "1m_1_5m",
  "1_5m_2m",
  "2m_plus",
  "unsure",
] as const;
export const HOME_BUDGET_LABELS: Record<(typeof HOME_BUDGETS)[number], string> = {
  under_600k: "Under $600,000",
  "600k_800k": "$600,000 – $800,000",
  "800k_1m": "$800,000 – $1M",
  "1m_1_5m": "$1M – $1.5M",
  "1_5m_2m": "$1.5M – $2M",
  "2m_plus": "$2M+",
  unsure: "Not sure yet",
};

export const HOME_TIMEFRAMES = ["asap", "3_6_months", "6_12_months", "just_looking"] as const;
export const HOME_TIMEFRAME_LABELS: Record<(typeof HOME_TIMEFRAMES)[number], string> = {
  asap: "Within 3 months",
  "3_6_months": "3–6 months",
  "6_12_months": "6–12 months",
  just_looking: "Just looking",
};

export const HOME_PURPOSES = ["live_in", "invest", "unsure"] as const;
export const HOME_PURPOSE_LABELS: Record<(typeof HOME_PURPOSES)[number], string> = {
  live_in: "A home to live in",
  invest: "An investment",
  unsure: "Not sure yet",
};
