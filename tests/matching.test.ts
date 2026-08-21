import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  matchOpportunities,
  scoreMatch,
  type MatchCriteria,
  type MatchableOpportunity,
} from "../src/lib/matching.ts";

const opportunities: MatchableOpportunity[] = [
  { id: 1, reference: "A", property_type: "storage", suburb: "Coburg North", state: "VIC", price: 245000, estimated_rental: 16800, estimated_yield: 5.5, availability: "available" },
  { id: 2, reference: "B", property_type: "storage", suburb: "Thomastown", state: "VIC", price: 420000, estimated_rental: 28000, estimated_yield: 5.8, availability: "available" },
  { id: 3, reference: "C", property_type: "warehouse", suburb: "Dandenong South", state: "VIC", price: 640000, estimated_rental: 43000, estimated_yield: 5.4, availability: "available" },
  { id: 4, reference: "D", property_type: "industrial", suburb: "Truganina", state: "VIC", price: 890000, estimated_rental: 58000, estimated_yield: 5.2, availability: "available" },
  { id: 5, reference: "E", property_type: "storage", suburb: "Ballarat", state: "VIC", price: 300000, estimated_rental: 19000, estimated_yield: 5.1, availability: "available" },
  { id: 6, reference: "F", property_type: "storage", suburb: "Coburg North", state: "VIC", price: 380000, estimated_rental: 25000, estimated_yield: 5.6, availability: "sold" },
];

const storageInvestor: MatchCriteria = {
  propertyType: "storage",
  budget: "300k_500k",
  locationScope: "melbourne",
  locationFree: null,
  priorities: ["rental_income"],
};

describe("opportunity matching", () => {
  test("matches an investor to in-budget, in-region opportunities of their type", () => {
    const results = matchOpportunities({ ...storageInvestor }, opportunities);
    const ids = results.map((r) => r.opportunityId);
    assert.ok(ids.includes(2), "Thomastown storage at $420k should match");
    assert.ok(results.length > 0);
  });

  test("never returns sold or withdrawn stock", () => {
    const results = matchOpportunities({ ...storageInvestor }, opportunities);
    assert.ok(!results.map((r) => r.opportunityId).includes(6), "sold opportunity must be excluded");
  });

  test("an exact type match outranks a merely related one", () => {
    const exact = scoreMatch({ ...storageInvestor }, opportunities[1]);
    const related = scoreMatch(
      { ...storageInvestor, propertyType: "warehouse" },
      opportunities[1],
    );
    assert.ok(exact.score > related.score);
  });

  test("a price inside the budget band beats one outside it", () => {
    const inside = scoreMatch({ ...storageInvestor }, opportunities[1]);   // $420k in 300–500k
    const outside = scoreMatch({ ...storageInvestor }, opportunities[3]);  // $890k
    assert.ok(inside.score > outside.score);
  });

  test("results are ordered by descending score", () => {
    const results = matchOpportunities(
      {
        propertyType: "open",
        budget: "unsure",
        locationScope: "anywhere_vic",
        priorities: [],
      } satisfies MatchCriteria,
      opportunities,
    );
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].score >= results[i].score);
    }
  });

  test("a named suburb is the strongest location signal", () => {
    const named = scoreMatch(
      { ...storageInvestor, locationScope: "australia_wide", locationFree: "Coburg North" },
      opportunities[0],
    );
    assert.ok(named.reasons.some((r) => r.includes("suburb the investor named")));
  });

  test("regional intent excludes metropolitan stock from the top results", () => {
    const regional = scoreMatch(
      { ...storageInvestor, locationScope: "regional_vic" },
      opportunities[4], // Ballarat
    );
    const metro = scoreMatch(
      { ...storageInvestor, locationScope: "regional_vic" },
      opportunities[1], // Thomastown
    );
    assert.ok(regional.score > metro.score);
  });

  test("every match carries a human-readable reason", () => {
    const results = matchOpportunities({ ...storageInvestor }, opportunities);
    for (const result of results) {
      assert.ok(result.reasons.length > 0, `match ${result.opportunityId} has no reasons`);
    }
  });

  test("an investor with no budget still gets matched on type and location", () => {
    const results = matchOpportunities(
      { ...storageInvestor, budget: "unsure" },
      opportunities,
    );
    assert.ok(results.length > 0);
  });

  test("scores are capped at 100", () => {
    for (const opportunity of opportunities) {
      const result = scoreMatch({ ...storageInvestor }, opportunity);
      assert.ok(result.score <= 100);
    }
  });
});
