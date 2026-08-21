import type {
  Budget,
  FinanceStatus,
  LeadClassification,
  LocationScope,
  Priority,
  PropertyType,
  Timeframe,
} from "./taxonomy";

/**
 * INTERNAL LEAD SCORING — admin surface only.
 *
 * Never render a score or classification on a public page, in an API response
 * to an unauthenticated caller, or in an email to the investor themselves.
 *
 * The scale is 0–100, built from six weighted signals. Weights are exported so
 * they can be tuned from one place and asserted in tests.
 */

export const SCORE_WEIGHTS = {
  budget: 22,
  propertyType: 16,
  finance: 24,
  timeframe: 22,
  location: 10,
  intent: 6,
} as const;

export const MAX_SCORE = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0); // 100

/** A clear, committed budget scores highest; "not sure yet" scores nothing. */
const BUDGET_POINTS: Record<Budget, number> = {
  under_300k: 18,
  "300k_500k": 22,
  "500k_750k": 22,
  "750k_1m": 22,
  "1m_plus": 22,
  unsure: 4,
};

/** A named asset class is a stronger signal than "open to options". */
const PROPERTY_TYPE_POINTS: Record<PropertyType, number> = {
  warehouse: 16,
  industrial: 16,
  storage: 16,
  small_commercial: 16,
  open: 7,
};

const FINANCE_POINTS: Record<FinanceStatus, number> = {
  cash_buyer: 24,
  pre_approved: 24,
  assessment_underway: 17,
  not_sure: 6,
  not_yet: 4,
};

const TIMEFRAME_POINTS: Record<Timeframe, number> = {
  immediately: 22,
  "1_3_months": 19,
  "3_6_months": 12,
  "6_12_months": 7,
  researching: 2,
};

/** A specific geography is more actionable than "anywhere". */
const LOCATION_POINTS: Record<LocationScope, number> = {
  melbourne: 10,
  greater_melbourne: 10,
  regional_vic: 9,
  anywhere_vic: 7,
  australia_wide: 5,
  open: 3,
};

/** Priorities that indicate a defined investment thesis rather than browsing. */
const STRONG_INTENT: Priority[] = [
  "rental_income",
  "long_term",
  "capital_growth",
  "industrial_exposure",
  "storage",
  "diversification",
  "entry_price",
  "location",
];

export type ScoringInput = {
  propertyType: PropertyType;
  budget: Budget;
  locationScope: LocationScope;
  locationFree?: string | null;
  priorities: Priority[];
  financeStatus: FinanceStatus;
  timeframe: Timeframe;
};

export type ScoreBreakdown = {
  score: number;
  classification: LeadClassification;
  components: { label: string; points: number; max: number; note: string }[];
};

export function scoreLead(input: ScoringInput): ScoreBreakdown {
  const budget = BUDGET_POINTS[input.budget] ?? 0;
  const propertyType = PROPERTY_TYPE_POINTS[input.propertyType] ?? 0;
  const finance = FINANCE_POINTS[input.financeStatus] ?? 0;
  const timeframe = TIMEFRAME_POINTS[input.timeframe] ?? 0;

  // A free-text suburb on top of a broad scope still counts as specific.
  const hasSuburb = Boolean(input.locationFree && input.locationFree.trim().length >= 3);
  const locationBase = LOCATION_POINTS[input.locationScope] ?? 0;
  const location = Math.min(SCORE_WEIGHTS.location, hasSuburb ? locationBase + 3 : locationBase);

  const strongCount = input.priorities.filter((p) => STRONG_INTENT.includes(p)).length;
  const stillResearching = input.priorities.includes("researching");
  let intent = Math.min(SCORE_WEIGHTS.intent, strongCount * 2);
  if (stillResearching) intent = Math.max(0, intent - 3);

  const score = Math.max(
    0,
    Math.min(MAX_SCORE, budget + propertyType + finance + timeframe + location + intent),
  );

  return {
    score,
    classification: classify(score, input),
    components: [
      { label: "Budget clarity", points: budget, max: SCORE_WEIGHTS.budget, note: input.budget },
      { label: "Property type clarity", points: propertyType, max: SCORE_WEIGHTS.propertyType, note: input.propertyType },
      { label: "Finance readiness", points: finance, max: SCORE_WEIGHTS.finance, note: input.financeStatus },
      { label: "Timeframe", points: timeframe, max: SCORE_WEIGHTS.timeframe, note: input.timeframe },
      { label: "Location specificity", points: location, max: SCORE_WEIGHTS.location, note: hasSuburb ? `${input.locationScope} + suburb` : input.locationScope },
      { label: "Investment intent", points: intent, max: SCORE_WEIGHTS.intent, note: `${strongCount} defined priorit${strongCount === 1 ? "y" : "ies"}` },
    ],
  };
}

export const CLASSIFICATION_THRESHOLDS = { HOT: 70, WARM: 45 } as const;

function classify(score: number, input: ScoringInput): LeadClassification {
  const financeReady =
    input.financeStatus === "pre_approved" ||
    input.financeStatus === "cash_buyer" ||
    input.financeStatus === "assessment_underway";
  const nearTerm = input.timeframe === "immediately" || input.timeframe === "1_3_months";

  // A near-term, finance-ready buyer is HOT even if they left budget open —
  // that conversation is worth having today.
  if (financeReady && nearTerm) return "HOT";
  if (score >= CLASSIFICATION_THRESHOLDS.HOT) return "HOT";
  if (score >= CLASSIFICATION_THRESHOLDS.WARM) return "WARM";
  return "NURTURE";
}

/** Suggested next-contact window in days, used for the follow-up queue. */
export function followUpWindowDays(classification: LeadClassification): number {
  switch (classification) {
    case "HOT":
      return 1;
    case "WARM":
      return 3;
    default:
      return 14;
  }
}
