import {
  BUDGET_RANGES,
  regionIsMetro,
  regionLabel,
  type Budget,
  type LocationScope,
  type PropertyType,
  type Priority,
} from "./taxonomy";

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
 * How often something comes up, as a bounded adjustment rather than a
 * multiplier.
 *
 * A multiplier scales with the score, so a 20% penalty on a strong match costs
 * ~19 points — enough to swamp a genuine difference in location fit and put a
 * metro precinct above the regional one the investor actually asked for. A
 * fixed adjustment can nudge the order without ever overturning fit.
 */
const FREQUENCY_ADJUSTMENT: Record<string, number> = {
  regular: 4,
  occasional: 0,
  rare: -6,
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

  // Nudge by how often something actually comes up here.
  const adjustment = FREQUENCY_ADJUSTMENT[area.frequency] ?? 0;
  const adjusted = score > 0 ? score + adjustment : 0;
  if (adjustment !== 0 && score > 0) {
    reasons.push(FREQUENCY_LABELS[area.frequency] ?? "Availability varies");
  }

  return { coverageId: area.id, score: Math.max(0, Math.min(100, adjusted)), reasons };
}

/**
 * Does what the investor typed describe this region?
 *
 * Compared on distinctive words rather than as a substring, so "northern
 * suburbs" finds Northern Melbourne. Generic words are ignored — on their own
 * "Melbourne" or "Victoria" describe every metro region equally and so
 * distinguish nothing.
 */
const GENERIC_LOCATION_WORDS = new Set([
  "melbourne", "victoria", "vic", "suburbs", "suburb", "area", "areas",
  "region", "regional", "greater", "metro", "metropolitan", "and", "the",
]);

function regionMatchesText(region: string | null, freeText: string): boolean {
  const label = regionLabel(region).toLowerCase();
  if (label === "—") return false;
  if (label.includes(freeText)) return true;

  const distinctive = (text: string) =>
    text
      .split(/[^a-z]+/)
      .filter((word) => word.length >= 3 && !GENERIC_LOCATION_WORDS.has(word));

  const wanted = distinctive(freeText);
  if (!wanted.length) return false;
  const available = new Set(distinctive(label));
  return wanted.some((word) => available.has(word));
}

function scoreCoverageLocation(
  criteria: MatchCriteria,
  area: CoverageArea,
  reasons: string[],
): number {
  const suburb = (area.suburb ?? "").toLowerCase();
  const state = (area.state ?? "").toUpperCase();
  const isVic = state === "VIC";

  // The recorded region is authoritative — it is a structured value chosen from
  // a list. Only when a row has no region do we fall back to guessing from the
  // suburb name, which is what the hint list is for.
  const inMelbourne =
    regionIsMetro(area.region) ?? GREATER_MELBOURNE_HINTS.some((hint) => suburb.includes(hint));

  /**
   * A suburb the investor typed themselves outranks a broad scope match.
   *
   * Someone who wrote "Ballarat" is telling you something more specific than
   * someone who ticked "regional Victoria", and the ranking has to reflect
   * that — otherwise every regional suburb ties with the one they asked for.
   */
  const freeText = (criteria.locationFree ?? "").trim().toLowerCase();
  if (freeText.length >= 3 && suburb && (suburb.includes(freeText) || freeText.includes(suburb))) {
    reasons.push("Covers the suburb they named");
    return 25;
  }
  if (freeText.length >= 3 && regionMatchesText(area.region, freeText)) {
    reasons.push("Covers the area they named");
    return 23;
  }

  switch (criteria.locationScope) {
    case "melbourne":
    case "greater_melbourne":
      if (isVic && inMelbourne) {
        reasons.push("Melbourne metropolitan coverage");
        return 21;
      }
      if (isVic) {
        reasons.push("Victorian coverage, outside the metro area");
        return 9;
      }
      return 0;
    case "regional_vic":
      if (isVic && !inMelbourne) {
        reasons.push("Regional Victorian coverage");
        return 21;
      }
      if (isVic) return 9;
      return 0;
    case "anywhere_vic":
      if (isVic) {
        reasons.push("Victorian coverage");
        return 21;
      }
      return 5;
    case "australia_wide":
    case "open":
      reasons.push("Investor is open on location");
      return 16;
    default:
      return 0;
  }
}


/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

export type GroupableCoverage = {
  property_type: string;
  suburb: string | null;
  region: string | null;
  price_min: number | null;
  price_max: number | null;
  frequency: string;
  typical_completion: string | null;
  match_score: number;
  reasons: string[];
};

export type GroupedCoverageMatch = {
  key: string;
  property_type: string;
  region: string | null;
  suburbs: string[];
  price_min: number | null;
  price_max: number | null;
  frequency: string;
  typical_completion: string | null;
  match_score: number;
  reasons: string[];
};

/**
 * Collapse matches into one row per asset type and precinct.
 *
 * Coverage is recorded per suburb, so one investor legitimately matches dozens
 * of rows — five storage suburbs across the north is five rows saying the same
 * thing. Ungrouped that reads as noise; grouped it reads the way you would say
 * it on a call: "storage in the northern suburbs, five areas, $180k–$320k".
 */
export function groupCoverageMatches<T extends GroupableCoverage>(
  matches: T[],
): GroupedCoverageMatch[] {
  const groups = new Map<string, GroupedCoverageMatch>();

  for (const match of matches) {
    const key = `${match.property_type}|${match.region ?? ""}`;
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        key,
        property_type: match.property_type,
        region: match.region,
        suburbs: match.suburb ? [match.suburb] : [],
        price_min: match.price_min,
        price_max: match.price_max,
        frequency: match.frequency,
        typical_completion: match.typical_completion,
        match_score: match.match_score,
        reasons: [...match.reasons],
      });
      continue;
    }

    if (match.suburb && !existing.suburbs.includes(match.suburb)) {
      existing.suburbs.push(match.suburb);
    }
    // The group is worth what its best member is worth, and spans the full
    // band across the precinct.
    existing.match_score = Math.max(existing.match_score, match.match_score);
    if (match.price_min !== null) {
      existing.price_min =
        existing.price_min === null ? match.price_min : Math.min(existing.price_min, match.price_min);
    }
    if (match.price_max !== null) {
      existing.price_max =
        existing.price_max === null ? match.price_max : Math.max(existing.price_max, match.price_max);
    }
    for (const reason of match.reasons) {
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
    }
  }

  return [...groups.values()].sort((a, b) => b.match_score - a.match_score);
}
