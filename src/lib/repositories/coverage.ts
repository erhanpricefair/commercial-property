import "server-only";
import { getDb } from "../db";
import { matchCoverage, type CoverageArea, type MatchCriteria } from "../matching";
import { getInvestor } from "./investors";

/**
 * COVERAGE AREAS — what we can source, at market level.
 *
 * Unlike `repositories/opportunities.ts`, nothing in this file can hold a
 * developer, a development name, an address or a lot number, because the table
 * has no columns for them. That is the point: coverage can be recorded and
 * maintained without ever holding a channel partner's stocklist.
 *
 * Still admin-only. Even market-level knowledge of where we can source and at
 * what price is commercially sensitive, and no public route reads this.
 */

export type CoverageRow = {
  id: number;
  property_type: string;
  suburb: string | null;
  region: string | null;
  state: string;
  price_min: number | null;
  price_max: number | null;
  size_min_sqm: number | null;
  size_max_sqm: number | null;
  typical_completion: string | null;
  frequency: string;
  is_active: number;
  last_confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CoverageInput = {
  propertyType: string;
  suburb?: string | null;
  region?: string | null;
  state?: string;
  priceMin?: number | null;
  priceMax?: number | null;
  sizeMinSqm?: number | null;
  sizeMaxSqm?: number | null;
  typicalCompletion?: string | null;
  frequency?: string;
  notes?: string | null;
};

export function listCoverage(filters: { activeOnly?: boolean } = {}): CoverageRow[] {
  const where = filters.activeOnly ? "WHERE is_active = 1" : "";
  return getDb()
    .prepare(
      `SELECT * FROM coverage_areas ${where}
        ORDER BY is_active DESC,
                 CASE frequency WHEN 'regular' THEN 0 WHEN 'occasional' THEN 1 ELSE 2 END,
                 property_type, suburb`,
    )
    .all() as CoverageRow[];
}

export function getCoverage(id: number): CoverageRow | null {
  return (
    (getDb().prepare("SELECT * FROM coverage_areas WHERE id = ?").get(id) as
      | CoverageRow
      | undefined) ?? null
  );
}

export function createCoverage(input: CoverageInput): number {
  const result = getDb()
    .prepare(
      `INSERT INTO coverage_areas
         (property_type, suburb, region, state, price_min, price_max,
          size_min_sqm, size_max_sqm, typical_completion, frequency, notes,
          last_confirmed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))`,
    )
    .run(
      input.propertyType,
      input.suburb || null,
      input.region || null,
      input.state || "VIC",
      input.priceMin ?? null,
      input.priceMax ?? null,
      input.sizeMinSqm ?? null,
      input.sizeMaxSqm ?? null,
      input.typicalCompletion || null,
      input.frequency || "occasional",
      input.notes || null,
    );
  return Number(result.lastInsertRowid);
}

export function updateCoverage(id: number, input: Partial<CoverageInput> & { isActive?: boolean }): void {
  const db = getDb();
  const existing = getCoverage(id);
  if (!existing) return;

  db.prepare(
    `UPDATE coverage_areas
        SET property_type = ?, suburb = ?, region = ?, state = ?,
            price_min = ?, price_max = ?, size_min_sqm = ?, size_max_sqm = ?,
            typical_completion = ?, frequency = ?, notes = ?,
            is_active = ?, updated_at = datetime('now')
      WHERE id = ?`,
  ).run(
    input.propertyType ?? existing.property_type,
    input.suburb === undefined ? existing.suburb : input.suburb || null,
    input.region === undefined ? existing.region : input.region || null,
    input.state ?? existing.state,
    input.priceMin === undefined ? existing.price_min : input.priceMin,
    input.priceMax === undefined ? existing.price_max : input.priceMax,
    input.sizeMinSqm === undefined ? existing.size_min_sqm : input.sizeMinSqm,
    input.sizeMaxSqm === undefined ? existing.size_max_sqm : input.sizeMaxSqm,
    input.typicalCompletion === undefined ? existing.typical_completion : input.typicalCompletion || null,
    input.frequency ?? existing.frequency,
    input.notes === undefined ? existing.notes : input.notes || null,
    input.isActive === undefined ? existing.is_active : input.isActive ? 1 : 0,
    id,
  );
}

export function confirmCoverage(id: number): void {
  getDb()
    .prepare("UPDATE coverage_areas SET last_confirmed_at = date('now'), updated_at = datetime('now') WHERE id = ?")
    .run(id);
}

export function deleteCoverage(id: number): void {
  getDb().prepare("DELETE FROM coverage_areas WHERE id = ?").run(id);
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

export type CoverageMatchRow = CoverageRow & { match_score: number; reasons: string[] };

/**
 * Which coverage areas fit this investor.
 *
 * Computed on demand rather than stored: coverage changes rarely and there are
 * few rows, so there is nothing to gain from a cache that could go stale and
 * quietly tell someone we can help when we can't.
 */
export function coverageMatchesForInvestor(investorId: number): CoverageMatchRow[] {
  const investor = getInvestor(investorId);
  if (!investor?.preferences) return [];

  const areas = getDb()
    .prepare(
      `SELECT id, property_type, suburb, region, state, price_min, price_max, frequency, is_active
         FROM coverage_areas WHERE is_active = 1`,
    )
    .all() as CoverageArea[];
  if (!areas.length) return [];

  const criteria: MatchCriteria = {
    propertyType: investor.preferences.property_type as MatchCriteria["propertyType"],
    budget: investor.preferences.budget as MatchCriteria["budget"],
    locationScope: investor.preferences.location_scope as MatchCriteria["locationScope"],
    locationFree: investor.preferences.location_free,
    priorities: investor.preferences.priorities as MatchCriteria["priorities"],
  };

  const matches = matchCoverage(criteria, areas);
  const byId = new Map(listCoverage({ activeOnly: true }).map((row) => [row.id, row]));

  return matches
    .map((match) => {
      const row = byId.get(match.coverageId);
      return row ? { ...row, match_score: match.score, reasons: match.reasons } : null;
    })
    .filter((row): row is CoverageMatchRow => row !== null);
}

export function countCoverageMatches(investorId: number): number {
  return coverageMatchesForInvestor(investorId).length;
}

export function coverageStats(): {
  total: number;
  active: number;
  stale: number;
  byType: { property_type: string; c: number }[];
} {
  const db = getDb();
  const one = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  return {
    total: one("SELECT COUNT(*) AS c FROM coverage_areas"),
    active: one("SELECT COUNT(*) AS c FROM coverage_areas WHERE is_active = 1"),
    // Coverage you haven't checked in three months is a guess, not knowledge.
    stale: one(
      `SELECT COUNT(*) AS c FROM coverage_areas
        WHERE is_active = 1
          AND (last_confirmed_at IS NULL OR last_confirmed_at < date('now','-90 days'))`,
    ),
    byType: db
      .prepare(
        "SELECT property_type, COUNT(*) AS c FROM coverage_areas WHERE is_active = 1 GROUP BY property_type",
      )
      .all() as { property_type: string; c: number }[],
  };
}
