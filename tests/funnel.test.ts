import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  computeFunnelSteps,
  worstFunnelStep,
  completionRate,
  FUNNEL_STEP_LABELS,
} from "../src/lib/funnel.ts";

/** 100 start; the contact step loses most of them, as it usually does. */
const reached = new Map([
  [2, 88],
  [3, 80],
  [4, 74],
  [5, 70],
  [6, 66],
  [7, 40],
]);

describe("funnel drop-off", () => {
  const steps = computeFunnelSteps(100, reached);

  test("step 1 is everyone who started", () => {
    assert.equal(steps[0].reached, 100);
    assert.equal(steps[0].dropOff, 0);
  });

  test("each step is measured against the one before it", () => {
    // 88 reached step 2 of the 100 who started → 12 lost, 12%
    assert.equal(steps[1].reached, 88);
    assert.equal(steps[1].dropOff, 12);
    assert.equal(steps[1].dropOffPct, 12);
    // 40 of the 66 who reached step 6 got to step 7 → 26 lost, 39%
    assert.equal(steps[6].dropOff, 26);
    assert.equal(steps[6].dropOffPct, 39);
  });

  test("labels every step", () => {
    assert.equal(steps.length, FUNNEL_STEP_LABELS.length);
    assert.equal(steps[6].label, "Contact details");
  });

  test("a step nobody reached reports zero rather than dividing by zero", () => {
    const sparse = computeFunnelSteps(10, new Map());
    for (const step of sparse.slice(1)) {
      assert.equal(step.reached, 0);
      assert.ok(Number.isFinite(step.dropOffPct));
    }
  });

  test("no traffic produces no percentages rather than NaN", () => {
    for (const step of computeFunnelSteps(0, new Map())) {
      assert.equal(step.dropOffPct, 0);
    }
  });

  test("never reports negative drop-off if a step is over-counted", () => {
    // Stepping backwards can push a later step above an earlier one.
    const odd = computeFunnelSteps(100, new Map([[2, 120]]));
    assert.equal(odd[1].dropOff, 0);
  });
});

describe("worst step", () => {
  test("finds the step losing the largest share of those who reach it", () => {
    const worst = worstFunnelStep(computeFunnelSteps(100, reached));
    assert.equal(worst?.step, 7);
    assert.equal(worst?.label, "Contact details");
  });

  test("never nominates step 1, which is everyone by definition", () => {
    const steps = computeFunnelSteps(1000, new Map([[2, 100], [3, 50], [4, 45]]));
    assert.notEqual(worstFunnelStep(steps)?.step, 1);
  });

  test("a heavy loss on the first question is itself the finding", () => {
    // 1000 start and only 100 answer question 1: that IS the leak, and
    // reporting a later, smaller one instead would send you off fixing the
    // wrong screen.
    const steps = computeFunnelSteps(1000, new Map([[2, 100], [3, 50], [4, 45], [5, 44], [6, 43], [7, 42]]));
    const worst = worstFunnelStep(steps);
    assert.equal(worst?.step, 2);
    assert.equal(worst?.dropOffPct, 90);
  });

  test("returns nothing when there is no data", () => {
    assert.equal(worstFunnelStep(computeFunnelSteps(0, new Map())), null);
  });
});

describe("completion rate", () => {
  test("is completions over starts", () => {
    assert.equal(completionRate(100, 40), 40);
    assert.equal(completionRate(3, 1), 33);
  });

  test("is zero rather than NaN with no starts", () => {
    assert.equal(completionRate(0, 0), 0);
  });
});
