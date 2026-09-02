import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { matchCoverage, scoreCoverage, type CoverageArea, type MatchCriteria } from "../src/lib/matching.ts";

const coverage: CoverageArea[] = [
  { id: 1, property_type: "storage", suburb: "Coburg North", region: "Northern Melbourne", state: "VIC", price_min: 200_000, price_max: 320_000, frequency: "regular", is_active: 1 },
  { id: 2, property_type: "storage", suburb: "Bayswater", region: "Eastern Melbourne", state: "VIC", price_min: 210_000, price_max: 300_000, frequency: "occasional", is_active: 1 },
  { id: 3, property_type: "warehouse", suburb: "Truganina", region: "Western Melbourne", state: "VIC", price_min: 450_000, price_max: 900_000, frequency: "regular", is_active: 1 },
  { id: 4, property_type: "small_commercial", suburb: "Ballarat", region: "Regional Victoria", state: "VIC", price_min: 280_000, price_max: 480_000, frequency: "occasional", is_active: 1 },
  { id: 5, property_type: "industrial", suburb: "Dandenong South", region: "South East Melbourne", state: "VIC", price_min: 800_000, price_max: 2_000_000, frequency: "rare", is_active: 1 },
  { id: 6, property_type: "storage", suburb: "Preston", region: "Northern Melbourne", state: "VIC", price_min: 200_000, price_max: 300_000, frequency: "regular", is_active: 0 },
];

const storageInvestor: MatchCriteria = {
  propertyType: "storage",
  budget: "under_300k",
  locationScope: "melbourne",
  locationFree: null,
  priorities: ["rental_income"],
};

describe("coverage matching", () => {
  test("matches an investor to coverage in their type, area and price band", () => {
    const ids = matchCoverage(storageInvestor, coverage).map((m) => m.coverageId);
    assert.ok(ids.includes(1), "Coburg North storage should match");
    assert.ok(ids.includes(2), "Bayswater storage should match");
  });

  test("ignores deactivated coverage", () => {
    const ids = matchCoverage(storageInvestor, coverage).map((m) => m.coverageId);
    assert.ok(!ids.includes(6), "inactive coverage must not be offered");
  });

  test("overlapping price bands beat non-overlapping ones", () => {
    const overlapping = scoreCoverage(storageInvestor, coverage[0]);
    const wayOff = scoreCoverage(storageInvestor, coverage[4]); // $800k–2M industrial
    assert.ok(overlapping.score > wayOff.score);
  });

  test("an adjacent budget band still scores something — budgets flex", () => {
    const nearMiss = scoreCoverage(
      { ...storageInvestor, budget: "300k_500k" },
      { ...coverage[0], price_min: 150_000, price_max: 250_000 },
    );
    assert.ok(nearMiss.score > 0);
  });

  test("a named suburb is the strongest location signal", () => {
    const named = scoreCoverage(
      { ...storageInvestor, locationScope: "australia_wide", locationFree: "Coburg North" },
      coverage[0],
    );
    assert.ok(named.reasons.some((r) => r.includes("suburb they named")));
  });

  test("a named region matches even without a suburb", () => {
    const named = scoreCoverage(
      { ...storageInvestor, locationScope: "australia_wide", locationFree: "northern melbourne" },
      coverage[0],
    );
    assert.ok(named.reasons.some((r) => r.toLowerCase().includes("area they named")));
  });

  test("frequently available coverage outranks rarely available coverage, all else equal", () => {
    const regular = scoreCoverage(storageInvestor, coverage[0]);
    const rare = scoreCoverage(storageInvestor, { ...coverage[0], id: 99, frequency: "rare" });
    assert.ok(regular.score > rare.score);
    assert.ok(rare.reasons.some((r) => r.includes("Rarely available")));
  });

  test("a better fit beats a more available area — availability is only a tiebreaker", () => {
    // Rare coverage that matches their region, against frequently available
    // coverage in the wrong one. The right call is the one they can actually use.
    const rightPlaceRarely = scoreCoverage(
      { ...storageInvestor, propertyType: "small_commercial", budget: "under_300k", locationScope: "regional_vic" },
      coverage[3], // Ballarat, regional, "occasional"
    );
    const wrongPlaceOften = scoreCoverage(
      { ...storageInvestor, propertyType: "small_commercial", budget: "under_300k", locationScope: "regional_vic" },
      { ...coverage[3], id: 97, suburb: "Preston", region: "Northern Melbourne", frequency: "regular" },
    );
    assert.ok(
      rightPlaceRarely.score > wrongPlaceOften.score,
      `regional match (${rightPlaceRarely.score}) should beat metro match (${wrongPlaceOften.score})`,
    );
  });

  test("regional intent prefers regional coverage", () => {
    const regional = scoreCoverage(
      { ...storageInvestor, propertyType: "small_commercial", budget: "300k_500k", locationScope: "regional_vic" },
      coverage[3],
    );
    const metro = scoreCoverage(
      { ...storageInvestor, propertyType: "small_commercial", budget: "300k_500k", locationScope: "regional_vic" },
      { ...coverage[3], id: 98, suburb: "Preston", region: "Northern Melbourne" },
    );
    assert.ok(regional.score > metro.score);
  });

  test("an investor with no budget still matches on type and location", () => {
    const results = matchCoverage({ ...storageInvestor, budget: "unsure" }, coverage);
    assert.ok(results.length > 0);
    assert.ok(results[0].reasons.some((r) => r.includes("No budget stated")));
  });

  test("every match explains itself", () => {
    for (const match of matchCoverage(storageInvestor, coverage)) {
      assert.ok(match.reasons.length > 0, `coverage ${match.coverageId} gave no reason`);
    }
  });

  test("scores stay within bounds", () => {
    for (const area of coverage) {
      const { score } = scoreCoverage(storageInvestor, area);
      assert.ok(score >= 0 && score <= 100, `score out of range: ${score}`);
    }
  });

  test("no coverage recorded yields no matches rather than throwing", () => {
    assert.deepEqual(matchCoverage(storageInvestor, []), []);
  });
});

describe("coverage holds no identifying data by construction", () => {
  const schema = fs.readFileSync(path.join(process.cwd(), "src/lib/db.ts"), "utf8");
  const table = schema.slice(
    schema.indexOf("CREATE TABLE IF NOT EXISTS coverage_areas"),
    schema.indexOf("CREATE INDEX IF NOT EXISTS idx_coverage_type"),
  );

  test("the table exists", () => {
    assert.ok(table.length > 0, "coverage_areas table not found in schema");
  });

  /**
   * The protection is structural, not procedural: if there is no column for a
   * developer or an address, no amount of careless data entry can put one
   * there. This test is what stops someone helpfully adding one later.
   */
  for (const column of ["developer", "development_name", "address", "lot_unit_number", "source_channel"]) {
    test(`has no ${column} column`, () => {
      assert.ok(!table.includes(column), `coverage_areas must not have a ${column} column`);
    });
  }

  test("the coverage repository never reads or writes identifying fields", () => {
    // Comments stripped: a comment that names a banned field in order to
    // explain why it is banned is documentation, not a leak.
    const repo = fs
      .readFileSync(path.join(process.cwd(), "src/lib/repositories/coverage.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
    for (const column of ["developer", "development_name", "lot_unit_number", "source_channel"]) {
      assert.ok(!repo.includes(column), `coverage repository must not reference ${column}`);
    }
  });
});
