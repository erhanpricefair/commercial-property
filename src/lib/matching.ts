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

/* ------------------------------------------------------------------ */
/* COVERAGE MATCHING                                                   */
/* ------------------------------------------------------------------ */

/**
 * Matching an investor against COVERAGE rather than against stock.
 *
 * Coverage says "we can source this asset type, in this suburb, around this
 * price". That is enough to answer the only question that matters when a
 * registration arrives: is this someone we can actually help, and therefore
 * someone to call?
 *
 * Deliberately band-to-band. An investor states a budget band; coverage states
 * a price band; a match is an overlap. No exact price for any individual
 * property is involved on either side, which is why this works without holding
 * a channel partner's stocklist.
 */

export type CoverageArea = {
  id: number;
  property_type: string;
  suburb: string | null;
  region: string | null;
  state: string | null;
  price_min: number | null;
  price_max: number | null;
  frequency: string;
  is_active: number;
};

export type CoverageMatch = {
  coverageId: number;
  score: number;
  reasons: string[];
};

/**
 * Coverage that comes up often is worth more than coverage that rarely does —
 * but only as a tiebreaker.
 *
 * The range here is deliberately narrow. An earlier, wider spread let a
 * frequently-available area in the wrong region outrank a rarely-available one
 * that actually matched the investor's suburb and budget, which is exactly
 * backwards: fit decides whether the call is worth making, availability only
 * decides the order you make them in.
 */
const FREQUENCY_WEIGHT: Record<string, number> = {
  regular: 1,
  occasional: 0.92,
  rare: 0.8,
};

export const FREQUENCY_LABELS: Record<string, string> = {
  regular: "Comes up regularly",
  occasional: "Comes up occasionally",
  rare: "Rarely available",
};

export function matchCoverage(
  criteria: MatchCriteria,
  areas: CoverageArea[],
  options: { minScore?: number; limit?: number } = {},
): CoverageMatch[] {
  const minScore = options.minScore ?? 45;
  const results: CoverageMatch[] = [];

  for (const area of areas) {
    if (area.is_active !== 1) continue;
    const result = scoreCoverage(criteria, area);
    if (result.score >= minScore) results.push(result);
  }

  results.sort((a, b) => b.score - a.score || a.coverageId - b.coverageId);
  return options.limit ? results.slice(0, options.limit) : results;
}

export function scoreCoverage(criteria: MatchCriteria, area: CoverageArea): CoverageMatch {
  const reasons: string[] = [];
  let score = 0;

  /* Property type — 40 */
  const compatible = TYPE_COMPATIBILITY[criteria.propertyType] ?? [];
  if (area.property_type === criteria.propertyType) {
    score += 40;
    reasons.push("We cover this property type");
  } else if (compatible.includes(area.property_type)) {
    score += criteria.propertyType === "open" ? 32 : 26;
    reasons.push("We cover a related asset class");
  }

  /* Budget band overlap — 35 */
  const investorRange = BUDGET_RANGES[criteria.budget];
  if (investorRange === null) {
    score += 16;
    reasons.push("No budget stated — worth a conversation to establish one");
  } else {
    const investorMin = investorRange.min;
    const investorMax = investorRange.max ?? Number.POSITIVE_INFINITY;
    const areaMin = area.price_min ?? 0;
    const areaMax = area.price_max ?? Number.POSITIVE_INFINITY;

    if (investorMin <= areaMax && areaMin <= investorMax) {
      score += 35;
      reasons.push("Their budget overlaps what we see at this price point");
    } else {
      // Adjacent bands are still worth a call — budgets flex once someone
      // understands what their money actually reaches.
      const gap = investorMin > areaMax ? investorMin - areaMax : areaMin - investorMax;
      if (Number.isFinite(gap) && gap <= 100_000) {
        score += 18;
        reasons.push("Their budget sits just outside this band");
      }
    }
  }

  /* Location — 25 */
  score += scoreCoverageLocation(criteria, area, reasons);

  // Weight the whole thing by how often something actually comes up here.
  const weight = FREQUENCY_WEIGHT[area.frequency] ?? 0.8;
  const weighted = Math.round(score * weight);
  if (weight < 1 && score > 0) {
    reasons.push(FREQUENCY_LABELS[area.frequency] ?? "Availability varies");
  }

  return { coverageId: area.id, score: Math.min(100, weighted), reasons };
}

function scoreCoverageLocation(
  criteria: MatchCriteria,
  area: CoverageArea,
  reasons: string[],
): number {
  const suburb = (area.suburb ?? "").toLowerCase();
  const region = (area.region ?? "").toLowerCase();
  const state = (area.state ?? "").toUpperCase();
  const isVic = state === "VIC";
  const inMelbourne =
    GREATER_MELBOURNE_HINTS.some((hint) => suburb.includes(hint)) ||
    region.includes("melbourne") ||
    region.includes("metro");

  const freeText = (criteria.locationFree ?? "").trim().toLowerCase();
  if (freeText.length >= 3 && suburb && (suburb.includes(freeText) || freeText.includes(suburb))) {
    reasons.push("Covers the suburb they named");
    return 25;
  }
  if (freeText.length >= 3 && region && region.includes(freeText)) {
    reasons.push("Covers the area they named");
    return 23;
  }

  switch (criteria.locationScope) {
    case "melbourne":
    case "greater_melbourne":
      if (isVic && inMelbourne) {
        reasons.push("Melbourne metropolitan coverage");
        return 25;
      }
      if (isVic) {
        reasons.push("Victorian coverage, outside the metro area");
        return 10;
      }
      return 0;
    case "regional_vic":
      if (isVic && !inMelbourne) {
        reasons.push("Regional Victorian coverage");
        return 25;
      }
      if (isVic) return 10;
      return 0;
    case "anywhere_vic":
      if (isVic) {
        reasons.push("Victorian coverage");
        return 25;
      }
      return 5;
    case "australia_wide":
    case "open":
      reasons.push("Investor is open on location");
      return 18;
    default:
      return 0;
  }
}
