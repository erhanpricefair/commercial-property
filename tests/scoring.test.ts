import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  scoreLead,
  MAX_SCORE,
  CLASSIFICATION_THRESHOLDS,
  followUpWindowDays,
  type ScoringInput,
} from "../src/lib/scoring.ts";

const base: ScoringInput = {
  propertyType: "warehouse",
  budget: "500k_750k",
  locationScope: "melbourne",
  locationFree: null,
  priorities: ["rental_income", "long_term"],
  financeStatus: "pre_approved",
  timeframe: "immediately",
};

describe("lead scoring", () => {
  test("a fully qualified investor scores highly and classifies HOT", () => {
    const result = scoreLead({ ...base });
    assert.ok(result.score >= CLASSIFICATION_THRESHOLDS.HOT, `expected >= 70, got ${result.score}`);
    assert.equal(result.classification, "HOT");
  });

  test("a pure researcher classifies NURTURE", () => {
    const result = scoreLead({
      propertyType: "open",
      budget: "unsure",
      locationScope: "open",
      locationFree: null,
      priorities: ["researching"],
      financeStatus: "not_yet",
      timeframe: "researching",
    } satisfies ScoringInput);
    assert.equal(result.classification, "NURTURE");
    assert.ok(result.score < CLASSIFICATION_THRESHOLDS.WARM);
  });

  test("score never exceeds the maximum", () => {
    const result = scoreLead({
      ...base,
      locationFree: "Coburg North",
      priorities: [
        "rental_income", "long_term", "entry_price", "location",
        "industrial_exposure", "storage", "capital_growth", "diversification",
      ],
    });
    assert.ok(result.score <= MAX_SCORE);
    assert.equal(MAX_SCORE, 100);
  });

  test("a clear budget outscores an unsure one, all else equal", () => {
    const clear = scoreLead({ ...base, budget: "300k_500k" }).score;
    const unsure = scoreLead({ ...base, budget: "unsure" }).score;
    assert.ok(clear > unsure, `${clear} should beat ${unsure}`);
  });

  test("finance readiness outscores 'not yet', all else equal", () => {
    const ready = scoreLead({ ...base, financeStatus: "cash_buyer" }).score;
    const notReady = scoreLead({ ...base, financeStatus: "not_yet" }).score;
    assert.ok(ready > notReady);
  });

  test("a near-term timeframe outscores a distant one", () => {
    const near = scoreLead({ ...base, timeframe: "1_3_months" }).score;
    const far = scoreLead({ ...base, timeframe: "6_12_months" }).score;
    assert.ok(near > far);
  });

  test("naming a suburb adds location specificity", () => {
    const withSuburb = scoreLead({ ...base, locationScope: "australia_wide", locationFree: "Thomastown" }).score;
    const without = scoreLead({ ...base, locationScope: "australia_wide", locationFree: null }).score;
    assert.ok(withSuburb > without);
  });

  test("a finance-ready near-term buyer is HOT even without a stated budget", () => {
    const result = scoreLead({
      ...base,
      budget: "unsure",
      propertyType: "open",
      locationScope: "open",
      priorities: ["researching"],
      financeStatus: "pre_approved",
      timeframe: "immediately",
    });
    assert.equal(result.classification, "HOT");
  });

  test("component points never exceed their weights", () => {
    const result = scoreLead({ ...base, locationFree: "Preston" });
    for (const component of result.components) {
      assert.ok(
        component.points <= component.max,
        `${component.label}: ${component.points} > ${component.max}`,
      );
    }
  });

  test("follow-up windows tighten as classification heats up", () => {
    assert.ok(followUpWindowDays("HOT") < followUpWindowDays("WARM"));
    assert.ok(followUpWindowDays("WARM") < followUpWindowDays("NURTURE"));
  });
});
