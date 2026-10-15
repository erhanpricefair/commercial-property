/**
 * Browser-safe parts of the landing page content: the enquiry form's options
 * and the suburb helpers. Client components import from here, never from
 * `home-landing.ts`, which also holds the builder approval records.
 */

/** Fired by an opportunity row; the form adds the suburb it carries. */
export const SUBURB_EVENT = "nf:choose-suburb";

export const SUBURB_PATTERN = /^[A-Za-z][A-Za-z' .-]{1,48}$/;

/** Clean a suburb passed in a URL (`/?suburb=Preston`) before it reaches the form. */
export function cleanSuburbParam(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim().slice(0, 50);
  return SUBURB_PATTERN.test(trimmed) ? trimmed : "";
}


/* ------------------------------------------------------------------ */
/* Form options                                                        */
/* ------------------------------------------------------------------ */

/** Kept for the API contract; the NewPF form always sends "townhouse". */
export const HOME_TYPES = ["house", "townhouse", "apartment", "land", "open"] as const;
export const HOME_TYPE_LABELS: Record<(typeof HOME_TYPES)[number], string> = {
  house: "House",
  townhouse: "Townhouse",
  apartment: "Apartment",
  land: "Land",
  open: "Open to options",
};

export const HOME_BUDGETS = [
  "under_900k",
  "900k_1m",
  "1m_1_15m",
  "1_15m_1_3m",
  "over_1_3m",
  "unsure",
] as const;
export const HOME_BUDGET_LABELS: Record<(typeof HOME_BUDGETS)[number], string> = {
  under_900k: "Under $900,000",
  "900k_1m": "$900,000 – $1M",
  "1m_1_15m": "$1M – $1.15M",
  "1_15m_1_3m": "$1.15M – $1.3M",
  over_1_3m: "Over $1.3M",
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
