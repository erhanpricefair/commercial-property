/**
 * Revenue forecasting.
 *
 * Turns the lead pipeline into an expected-commission figure so a target can
 * be tracked rather than hoped for. Pure functions, no database access, so the
 * weighting can be asserted in tests and tuned in one place.
 *
 * ADMIN ONLY — commission, targets and probabilities never appear publicly.
 */

export type DealStage =
  | "opportunity_sent"
  | "inspection_discussion"
  | "negotiating"
  | "committed"
  | "settled"
  | "lost";

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  opportunity_sent: "Opportunity sent",
  inspection_discussion: "Inspection / discussion",
  negotiating: "Negotiating",
  committed: "Committed (unconditional)",
  settled: "Settled",
  lost: "Lost",
};

export const DEAL_STAGES = Object.keys(DEAL_STAGE_LABELS) as DealStage[];

/**
 * Probability each stage actually converts to paid commission.
 *
 * These are deliberately conservative. A forecast that flatters you is worse
 * than no forecast — it hides the fact that you need more leads, until it is
 * too late to do anything about it.
 */
export const STAGE_PROBABILITY: Record<DealStage, number> = {
  opportunity_sent: 0.1,
  inspection_discussion: 0.25,
  negotiating: 0.5,
  committed: 0.9,
  settled: 1,
  lost: 0,
};

export type Deal = {
  stage: DealStage | string;
  commissionAmount: number | null;
  expectedSettlement?: string | null;
  commissionPaidAt?: string | null;
};

export type Forecast = {
  /** Commission already received. */
  banked: number;
  /** Sum of commission on deals that are unconditional but not yet settled. */
  committed: number;
  /** Probability-weighted value of everything still open. */
  weightedPipeline: number;
  /** Face value of everything still open, ignoring probability. */
  grossPipeline: number;
  /** banked + committed + weightedPipeline. */
  forecast: number;
  openDeals: number;
};

export function forecastRevenue(deals: Deal[]): Forecast {
  let banked = 0;
  let committed = 0;
  let weightedPipeline = 0;
  let grossPipeline = 0;
  let openDeals = 0;

  for (const deal of deals) {
    const amount = deal.commissionAmount ?? 0;
    if (!amount) continue;

    if (deal.commissionPaidAt) {
      banked += amount;
      continue;
    }

    const stage = deal.stage as DealStage;
    if (stage === "lost") continue;

    if (stage === "settled") {
      // Settled but not marked paid — treat as banked-in-all-but-name.
      banked += amount;
      continue;
    }

    openDeals += 1;
    grossPipeline += amount;

    if (stage === "committed") {
      committed += amount;
      weightedPipeline += amount * STAGE_PROBABILITY.committed;
    } else {
      weightedPipeline += amount * (STAGE_PROBABILITY[stage] ?? 0);
    }
  }

  return {
    banked,
    committed,
    weightedPipeline: Math.round(weightedPipeline),
    grossPipeline,
    forecast: Math.round(banked + weightedPipeline),
    openDeals,
  };
}

export type TargetProgress = {
  target: number;
  banked: number;
  forecast: number;
  gap: number;
  percentOfTarget: number;
  /** Deals still needed at the average commission, after the weighted forecast. */
  dealsStillNeeded: number;
  /** Registrations needed to produce them, at the observed conversion rate. */
  leadsStillNeeded: number | null;
};

/**
 * How far the current pipeline gets you, and what is missing.
 *
 * `conversionRate` is registrations → paid deals. Pass the observed rate once
 * there is enough history; until then the caller supplies an assumption and
 * the number should be read as an order of magnitude, not a promise.
 */
export function progressToTarget(
  forecast: Forecast,
  options: { target: number; averageCommission: number; conversionRate?: number | null },
): TargetProgress {
  const { target, averageCommission } = options;
  const gap = Math.max(0, target - forecast.forecast);

  const dealsStillNeeded =
    averageCommission > 0 ? Math.ceil(gap / averageCommission) : 0;

  const conversionRate = options.conversionRate ?? null;
  const leadsStillNeeded =
    conversionRate && conversionRate > 0 ? Math.ceil(dealsStillNeeded / conversionRate) : null;

  return {
    target,
    banked: forecast.banked,
    forecast: forecast.forecast,
    gap,
    percentOfTarget: target > 0 ? Math.min(100, Math.round((forecast.forecast / target) * 100)) : 0,
    dealsStillNeeded,
    leadsStillNeeded,
  };
}

export function commissionFor(price: number | null | undefined, ratePercent: number): number | null {
  if (!price || price <= 0 || ratePercent <= 0) return null;
  return Math.round(price * (ratePercent / 100));
}

/**
 * Days until commission is realistically payable.
 *
 * The distinction that matters for a near-term cash target: completed stock
 * settles in weeks, off-the-plan settles at completion, which can be a year or
 * more away. Two deals of identical value are not equally useful.
 */
export const SETTLEMENT_SPEED: Record<string, { label: string; typicalDays: number; tone: "fast" | "medium" | "slow" }> = {
  completed: { label: "Settles in weeks", typicalDays: 45, tone: "fast" },
  under_construction: { label: "Settles on completion", typicalDays: 240, tone: "medium" },
  off_the_plan: { label: "Settles on completion", typicalDays: 420, tone: "slow" },
  planned: { label: "Long-dated", typicalDays: 540, tone: "slow" },
};

export function settlementSpeed(completionStatus: string | null | undefined) {
  if (!completionStatus) return null;
  return SETTLEMENT_SPEED[completionStatus] ?? null;
}
