import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  forecastRevenue,
  progressToTarget,
  commissionFor,
  settlementSpeed,
  STAGE_PROBABILITY,
  type Deal,
} from "../src/lib/revenue.ts";

describe("commission", () => {
  test("calculates from price and rate", () => {
    assert.equal(commissionFor(500_000, 4), 20_000);
    assert.equal(commissionFor(714_000, 5), 35_700);
  });

  test("returns null when either input is missing or zero", () => {
    assert.equal(commissionFor(null, 4), null);
    assert.equal(commissionFor(0, 4), null);
    assert.equal(commissionFor(500_000, 0), null);
  });
});

describe("revenue forecast", () => {
  const deals: Deal[] = [
    { stage: "settled", commissionAmount: 20_000, commissionPaidAt: "2026-07-01" },
    { stage: "committed", commissionAmount: 25_000 },
    { stage: "negotiating", commissionAmount: 30_000 },
    { stage: "opportunity_sent", commissionAmount: 18_000 },
    { stage: "lost", commissionAmount: 40_000 },
  ];

  test("banks only commission actually received", () => {
    assert.equal(forecastRevenue(deals).banked, 20_000);
  });

  test("excludes lost deals entirely", () => {
    const withoutLost = deals.filter((d) => d.stage !== "lost");
    assert.equal(forecastRevenue(deals).forecast, forecastRevenue(withoutLost).forecast);
  });

  test("weights the pipeline by stage probability", () => {
    const f = forecastRevenue(deals);
    // 25k*0.9 + 30k*0.5 + 18k*0.1 = 22500 + 15000 + 1800
    assert.equal(f.weightedPipeline, 39_300);
    assert.equal(f.forecast, 59_300);
  });

  test("gross pipeline ignores probability", () => {
    assert.equal(forecastRevenue(deals).grossPipeline, 73_000);
  });

  test("counts only open deals", () => {
    assert.equal(forecastRevenue(deals).openDeals, 3);
  });

  test("a settled deal not yet marked paid still counts as banked", () => {
    const f = forecastRevenue([{ stage: "settled", commissionAmount: 15_000 }]);
    assert.equal(f.banked, 15_000);
    assert.equal(f.openDeals, 0);
  });

  test("probabilities are conservative and ordered", () => {
    assert.ok(STAGE_PROBABILITY.opportunity_sent < STAGE_PROBABILITY.inspection_discussion);
    assert.ok(STAGE_PROBABILITY.inspection_discussion < STAGE_PROBABILITY.negotiating);
    assert.ok(STAGE_PROBABILITY.negotiating < STAGE_PROBABILITY.committed);
    assert.equal(STAGE_PROBABILITY.settled, 1);
    assert.equal(STAGE_PROBABILITY.lost, 0);
  });

  test("an empty pipeline forecasts nothing rather than throwing", () => {
    const f = forecastRevenue([]);
    assert.equal(f.forecast, 0);
    assert.equal(f.openDeals, 0);
  });
});

describe("progress to target", () => {
  const forecast = forecastRevenue([
    { stage: "committed", commissionAmount: 25_000 },
    { stage: "negotiating", commissionAmount: 30_000 },
  ]);

  test("reports the gap to the target", () => {
    const p = progressToTarget(forecast, { target: 100_000, averageCommission: 20_000 });
    // 25k*0.9 + 30k*0.5 = 37500
    assert.equal(p.forecast, 37_500);
    assert.equal(p.gap, 62_500);
  });

  test("converts the gap into deals still needed", () => {
    const p = progressToTarget(forecast, { target: 100_000, averageCommission: 20_000 });
    assert.equal(p.dealsStillNeeded, 4); // ceil(62500 / 20000)
  });

  test("converts deals into leads at the conversion rate", () => {
    const p = progressToTarget(forecast, {
      target: 100_000,
      averageCommission: 20_000,
      conversionRate: 0.03,
    });
    assert.equal(p.leadsStillNeeded, 134); // ceil(4 / 0.03)
  });

  test("omits the lead estimate when no conversion rate is known", () => {
    const p = progressToTarget(forecast, { target: 100_000, averageCommission: 20_000 });
    assert.equal(p.leadsStillNeeded, null);
  });

  test("a met target leaves no gap", () => {
    const met = forecastRevenue([{ stage: "settled", commissionAmount: 120_000 }]);
    const p = progressToTarget(met, { target: 100_000, averageCommission: 20_000 });
    assert.equal(p.gap, 0);
    assert.equal(p.dealsStillNeeded, 0);
    assert.equal(p.percentOfTarget, 100);
  });
});

describe("settlement speed", () => {
  test("completed stock is the fast path to commission", () => {
    const fast = settlementSpeed("completed");
    const slow = settlementSpeed("off_the_plan");
    assert.equal(fast?.tone, "fast");
    assert.equal(slow?.tone, "slow");
    assert.ok(fast!.typicalDays < slow!.typicalDays);
  });

  test("unknown or missing status returns null rather than guessing", () => {
    assert.equal(settlementSpeed(null), null);
    assert.equal(settlementSpeed("something_else"), null);
  });
});
