import { BUDGET_RANGES, type Budget, type LocationScope, type PropertyType, type Priority } from "./taxonomy";

/**
 * OPPORTUNITY MATCHING — admin surface only.
 *
 * Compares an investor's registered criteria against the private opportunity
 * database. The *count* of matches may be shown in the admin dashboard; the
 * matched records themselves are only ever rendered inside authenticated admin
 * pages or an explicitly issued tokenised presentation.
 */

export type MatchableOpportunity = {
  id: number;
  reference: string;
  property_type: string;
  suburb: string | null;
  state: string | null;
  price: number | null;
  estimated_rental: number | null;
  estimated_yield: number | null;
  availability: string;
};

export type MatchCriteria = {
  propertyType: PropertyType;
  budget: Budget;
  locationScope: LocationScope;
  locationFree?: string | null;
  priorities: Priority[];
};

export type MatchResult = {
  opportunityId: number;
  score: number;
  reasons: string[];
};

/** Melbourne metro is treated as a superset of "Melbourne" for matching. */
const GREATER_MELBOURNE_HINTS = [
  "melbourne", "coburg", "brunswick", "preston", "thomastown", "epping", "craigieburn",
  "dandenong", "clayton", "braeside", "moorabbin", "cheltenham", "bayswater", "ringwood",
  "sunshine", "laverton", "truganina", "derrimut", "altona", "campbellfield", "somerton",
  "reservoir", "heidelberg", "footscray", "port melbourne", "notting hill", "mordialloc",
  "keysborough", "hallam", "narre warren", "pakenham", "werribee", "hoppers crossing",
];

/**
 * Property types that satisfy an investor's stated type. Warehouse and
 * industrial overlap heavily in this market, and "small commercial" is a size
 * descriptor that storage and small warehouse stock can satisfy.
 */
const TYPE_COMPATIBILITY: Record<PropertyType, string[]> = {
  warehouse: ["warehouse", "industrial"],
  industrial: ["industrial", "warehouse"],
  storage: ["storage", "small_commercial"],
  small_commercial: ["small_commercial", "storage", "warehouse"],
  open: ["warehouse", "industrial", "storage", "small_commercial"],
};

const AVAILABLE_STATES = new Set(["available", "on_hold"]);

export function matchOpportunities(
  criteria: MatchCriteria,
  opportunities: MatchableOpportunity[],
  options: { minScore?: number; limit?: number } = {},
): MatchResult[] {
  const minScore = options.minScore ?? 40;
  const results: MatchResult[] = [];

  for (const opp of opportunities) {
    if (!AVAILABLE_STATES.has(opp.availability)) continue;
    const result = scoreMatch(criteria, opp);
    if (result.score >= minScore) results.push(result);
  }

  results.sort((a, b) => b.score - a.score || a.opportunityId - b.opportunityId);
  return options.limit ? results.slice(0, options.limit) : results;
}

export function scoreMatch(criteria: MatchCriteria, opp: MatchableOpportunity): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  /* Property type — 40 points */
  const compatible = TYPE_COMPATIBILITY[criteria.propertyType] ?? [];
  if (opp.property_type === criteria.propertyType) {
    score += 40;
    reasons.push("Property type is an exact match");
  } else if (compatible.includes(opp.property_type)) {
    score += criteria.propertyType === "open" ? 30 : 26;
    reasons.push("Property type is a related asset class");
  }

  /* Budget — 35 points */
  const range = BUDGET_RANGES[criteria.budget];
  if (range === null) {
    // No stated budget: don't reward or punish, the price simply isn't a signal.
    score += 14;
    reasons.push("No budget stated — price not assessed");
  } else if (opp.price == null) {
    score += 8;
    reasons.push("Opportunity has no price recorded");
  } else {
    const max = range.max ?? Number.POSITIVE_INFINITY;
    if (opp.price >= range.min && opp.price <= max) {
      score += 35;
      reasons.push("Price sits inside the stated budget band");
    } else {
      // Allow a 15% stretch either side — investors routinely flex a little.
      const lower = range.min * 0.85;
      const upper = max === Number.POSITIVE_INFINITY ? max : max * 1.15;
      if (opp.price >= lower && opp.price <= upper) {
        score += 20;
        reasons.push("Price is just outside the stated budget band");
      }
    }
  }

  /* Location — 20 points */
  score += scoreLocation(criteria, opp, reasons);

  /* Priorities — 5 points of fine-tuning */
  if (criteria.priorities.includes("rental_income") && opp.estimated_rental) {
    score += 3;
    reasons.push("Rental income figures are recorded");
  }
  if (criteria.priorities.includes("entry_price") && opp.price != null && opp.price <= 500_000) {
    score += 2;
    reasons.push("Lower entry price point");
  }

  return { opportunityId: opp.id, score: Math.min(100, score), reasons };
}

function scoreLocation(
  criteria: MatchCriteria,
  opp: MatchableOpportunity,
  reasons: string[],
): number {
  const suburb = (opp.suburb ?? "").toLowerCase();
  const state = (opp.state ?? "").toUpperCase();
  const isVic = state === "VIC";
  const inMelbourne = GREATER_MELBOURNE_HINTS.some((hint) => suburb.includes(hint));

  // A free-text suburb the investor typed themselves is the strongest signal.
  const freeText = (criteria.locationFree ?? "").trim().toLowerCase();
  if (freeText.length >= 3 && suburb && (suburb.includes(freeText) || freeText.includes(suburb))) {
    reasons.push("Matches the suburb the investor named");
    return 20;
  }

  switch (criteria.locationScope) {
    case "melbourne":
    case "greater_melbourne":
      if (isVic && inMelbourne) {
        reasons.push("Located in the Melbourne metropolitan area");
        return 20;
      }
      if (isVic) {
        reasons.push("Located in Victoria, outside the metro area");
        return 8;
      }
      return 0;
    case "regional_vic":
      if (isVic && !inMelbourne) {
        reasons.push("Located in regional Victoria");
        return 20;
      }
      if (isVic) return 8;
      return 0;
    case "anywhere_vic":
      if (isVic) {
        reasons.push("Located in Victoria");
        return 20;
      }
      return 4;
    case "australia_wide":
    case "open":
      reasons.push("Investor is open on location");
      return 14;
    default:
      return 0;
  }
}
