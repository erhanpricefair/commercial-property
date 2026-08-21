import "server-only";
import crypto from "node:crypto";
import { getDb } from "../db";
import { matchOpportunities, type MatchCriteria, type MatchableOpportunity } from "../matching";
import { getInvestor } from "./investors";

/**
 * PRIVATE OPPORTUNITY REPOSITORY.
 *
 * Every export in this file reads or writes PRIVATE / INTERNAL data. It must
 * only be imported from:
 *   - admin server components and route handlers behind `requireAdmin()`
 *   - the tokenised presentation loader, which returns a redacted projection
 *
 * It must never be imported from a public page, a public API route, the
 * sitemap, or any metadata generator. `scripts/privacy-audit.ts` enforces this.
 */

export type OpportunityRow = {
  id: number;
  reference: string;
  visibility: string;
  property_type: string;
  suburb: string | null;
  state: string | null;
  size_sqm: number | null;
  price: number | null;
  estimated_rental: number | null;
  outgoings: number | null;
  estimated_yield: number | null;
  completion_status: string | null;
  availability: string;
  internal_notes: string | null;
  source_channel: string | null;
  developer: string | null;
  development_name: string | null;
  address: string | null;
  lot_unit_number: string | null;
  created_at: string;
  updated_at: string;
};

/** Fields that identify a property or its origin. Never leave the admin tier
 *  unless an admin has explicitly ticked `disclose_identity` on a link. */
export const IDENTIFYING_FIELDS = [
  "developer",
  "development_name",
  "address",
  "lot_unit_number",
  "source_channel",
  "internal_notes",
] as const;

export type OpportunityInput = Omit<OpportunityRow, "id" | "created_at" | "updated_at" | "visibility"> &
  Partial<Pick<OpportunityRow, "visibility">>;

export function listOpportunities(filters: {
  propertyType?: string;
  state?: string;
  availability?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
} = {}): { rows: OpportunityRow[]; total: number } {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.propertyType) {
    where.push("property_type = ?");
    params.push(filters.propertyType);
  }
  if (filters.state) {
    where.push("state = ?");
    params.push(filters.state);
  }
  if (filters.availability) {
    where.push("availability = ?");
    params.push(filters.availability);
  }
  if (filters.minPrice != null) {
    where.push("price >= ?");
    params.push(filters.minPrice);
  }
  if (filters.maxPrice != null) {
    where.push("price <= ?");
    params.push(filters.maxPrice);
  }
  if (filters.search) {
    where.push("(reference LIKE ? OR suburb LIKE ? OR development_name LIKE ? OR address LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.min(filters.limit ?? 100, 500);
  const offset = filters.offset ?? 0;

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM opportunities ${whereSql}`).get(...params) as { c: number }
  ).c;
  const rows = db
    .prepare(
      `SELECT * FROM opportunities ${whereSql}
       ORDER BY availability = 'available' DESC, updated_at DESC
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as OpportunityRow[];

  return { rows, total };
}

export function getOpportunity(id: number): OpportunityRow | null {
  return (
    (getDb().prepare("SELECT * FROM opportunities WHERE id = ?").get(id) as
      | OpportunityRow
      | undefined) ?? null
  );
}

export function createOpportunity(input: OpportunityInput): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO opportunities
        (reference, visibility, property_type, suburb, state, size_sqm, price,
         estimated_rental, outgoings, estimated_yield, completion_status, availability,
         internal_notes, source_channel, developer, development_name, address, lot_unit_number)
       VALUES (@reference, @visibility, @property_type, @suburb, @state, @size_sqm, @price,
               @estimated_rental, @outgoings, @estimated_yield, @completion_status, @availability,
               @internal_notes, @source_channel, @developer, @development_name, @address, @lot_unit_number)`,
    )
    .run({ ...input, visibility: input.visibility ?? "PRIVATE" });
  return Number(result.lastInsertRowid);
}

export function updateOpportunity(id: number, input: Partial<OpportunityInput>): void {
  const db = getDb();
  const keys = Object.keys(input).filter((k) => input[k as keyof OpportunityInput] !== undefined);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE opportunities SET ${sets}, updated_at = datetime('now') WHERE id = @id`).run({
    ...input,
    id,
  });
}

export function deleteOpportunity(id: number): void {
  getDb().prepare("DELETE FROM opportunities WHERE id = ?").run(id);
}

/** Derived yield, used when the importer or admin leaves it blank. */
export function computeYield(price?: number | null, rental?: number | null, outgoings?: number | null): number | null {
  if (!price || price <= 0 || !rental) return null;
  const net = rental - (outgoings ?? 0);
  return Math.round((net / price) * 10000) / 100;
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

export function recomputeMatchesForInvestor(investorId: number): number {
  const investor = getInvestor(investorId);
  if (!investor?.preferences) return 0;

  const db = getDb();
  const pool = db
    .prepare(
      `SELECT id, reference, property_type, suburb, state, price, estimated_rental,
              estimated_yield, availability
         FROM opportunities
        WHERE availability IN ('available','on_hold')`,
    )
    .all() as MatchableOpportunity[];

  const criteria: MatchCriteria = {
    propertyType: investor.preferences.property_type as MatchCriteria["propertyType"],
    budget: investor.preferences.budget as MatchCriteria["budget"],
    locationScope: investor.preferences.location_scope as MatchCriteria["locationScope"],
    locationFree: investor.preferences.location_free,
    priorities: investor.preferences.priorities as MatchCriteria["priorities"],
  };

  const matches = matchOpportunities(criteria, pool);

  const write = db.transaction(() => {
    db.prepare("DELETE FROM opportunity_matches WHERE investor_id = ?").run(investorId);
    const insert = db.prepare(
      `INSERT INTO opportunity_matches (investor_id, opportunity_id, match_score, reasons)
       VALUES (?, ?, ?, ?)`,
    );
    for (const m of matches) {
      insert.run(investorId, m.opportunityId, m.score, JSON.stringify(m.reasons));
    }
  });
  write();

  return matches.length;
}

/** Refresh every investor's matches — run after a stocklist import. */
export function recomputeAllMatches(): { investors: number; matches: number } {
  const db = getDb();
  const ids = db.prepare("SELECT id FROM investors").all() as { id: number }[];
  let matches = 0;
  for (const { id } of ids) matches += recomputeMatchesForInvestor(id);
  return { investors: ids.length, matches };
}

export type MatchWithOpportunity = OpportunityRow & {
  match_score: number;
  reasons: string[];
};

export function getMatchesForInvestor(investorId: number): MatchWithOpportunity[] {
  const rows = getDb()
    .prepare(
      `SELECT o.*, m.match_score, m.reasons
         FROM opportunity_matches m
         JOIN opportunities o ON o.id = m.opportunity_id
        WHERE m.investor_id = ?
        ORDER BY m.match_score DESC, o.price ASC`,
    )
    .all(investorId) as (OpportunityRow & { match_score: number; reasons: string })[];

  return rows.map((r) => ({ ...r, reasons: parseArray(r.reasons) }));
}

export function countMatchesForInvestor(investorId: number): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS c FROM opportunity_matches WHERE investor_id = ?")
      .get(investorId) as { c: number }
  ).c;
}

/* ------------------------------------------------------------------ */
/* Tokenised private presentations                                     */
/* ------------------------------------------------------------------ */

export type PresentationRow = {
  id: number;
  token: string;
  investor_id: number | null;
  opportunity_id: number;
  disclose_identity: number;
  intro_note: string | null;
  created_by: number | null;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
};

export function createPresentation(input: {
  opportunityId: number;
  investorId?: number | null;
  discloseIdentity?: boolean;
  introNote?: string | null;
  createdBy?: number | null;
  expiresInDays?: number | null;
}): PresentationRow {
  const db = getDb();
  // 32 random bytes → 43 url-safe characters. Not guessable, not enumerable.
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 86400_000).toISOString()
      : null;

  db.prepare(
    `INSERT INTO presentations
       (token, investor_id, opportunity_id, disclose_identity, intro_note, created_by, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    token,
    input.investorId ?? null,
    input.opportunityId,
    input.discloseIdentity ? 1 : 0,
    input.introNote ?? null,
    input.createdBy ?? null,
    expiresAt,
  );

  return db.prepare("SELECT * FROM presentations WHERE token = ?").get(token) as PresentationRow;
}

export function listPresentations(): (PresentationRow & {
  reference: string;
  property_type: string;
  investor_name: string | null;
})[] {
  return getDb()
    .prepare(
      `SELECT p.*, o.reference, o.property_type,
              CASE WHEN i.id IS NULL THEN NULL ELSE i.first_name || ' ' || i.last_name END AS investor_name
         FROM presentations p
         JOIN opportunities o ON o.id = p.opportunity_id
         LEFT JOIN investors i ON i.id = p.investor_id
        ORDER BY p.created_at DESC`,
    )
    .all() as never;
}

export function revokePresentation(id: number): void {
  getDb()
    .prepare("UPDATE presentations SET revoked_at = datetime('now') WHERE id = ? AND revoked_at IS NULL")
    .run(id);
}

/**
 * Public-facing projection of an opportunity for a tokenised presentation.
 *
 * Identifying fields are stripped unless the admin who issued the link ticked
 * "disclose identity" — the redaction happens here, in the data layer, not in
 * the template, so a template change can never leak them.
 */
export type PresentationView = {
  token: string;
  introNote: string | null;
  preparedFor: string | null;
  discloseIdentity: boolean;
  opportunity: {
    reference: string;
    propertyType: string;
    generalLocation: string;
    state: string | null;
    sizeSqm: number | null;
    price: number | null;
    estimatedRental: number | null;
    outgoings: number | null;
    estimatedYield: number | null;
    completionStatus: string | null;
    availability: string;
    /* Only populated when disclose_identity = 1 */
    developer: string | null;
    developmentName: string | null;
    address: string | null;
    lotUnitNumber: string | null;
  };
};

export function loadPresentationByToken(token: string): PresentationView | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.*, i.first_name, i.last_name
         FROM presentations p
         LEFT JOIN investors i ON i.id = p.investor_id
        WHERE p.token = ?
          AND p.revoked_at IS NULL
          AND (p.expires_at IS NULL OR p.expires_at > datetime('now'))`,
    )
    .get(token) as (PresentationRow & { first_name?: string; last_name?: string }) | undefined;
  if (!row) return null;

  const opp = getOpportunity(row.opportunity_id);
  if (!opp) return null;

  const disclose = row.disclose_identity === 1;

  return {
    token: row.token,
    introNote: row.intro_note,
    preparedFor: row.first_name ? `${row.first_name} ${row.last_name ?? ""}`.trim() : null,
    discloseIdentity: disclose,
    opportunity: {
      reference: opp.reference,
      propertyType: opp.property_type,
      // Suburb-level only when identity is withheld; never the street address.
      generalLocation: disclose
        ? [opp.suburb, opp.state].filter(Boolean).join(", ")
        : generalise(opp.suburb, opp.state),
      state: opp.state,
      sizeSqm: opp.size_sqm,
      price: opp.price,
      estimatedRental: opp.estimated_rental,
      outgoings: opp.outgoings,
      estimatedYield: opp.estimated_yield,
      completionStatus: opp.completion_status,
      availability: opp.availability,
      developer: disclose ? opp.developer : null,
      developmentName: disclose ? opp.development_name : null,
      address: disclose ? opp.address : null,
      lotUnitNumber: disclose ? opp.lot_unit_number : null,
    },
  };
}

export function recordPresentationView(token: string): void {
  getDb()
    .prepare(
      "UPDATE presentations SET view_count = view_count + 1, last_viewed_at = datetime('now') WHERE token = ?",
    )
    .run(token);
}

function generalise(suburb: string | null, state: string | null): string {
  if (!suburb) return state ?? "Location provided on request";
  return `${suburb} area${state ? `, ${state}` : ""}`;
}

function parseArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
