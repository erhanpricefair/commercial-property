import "server-only";
import { getDb } from "../db";
import { scoreLead, followUpWindowDays, type ScoringInput } from "../scoring";
import type { LeadClassification, LeadStatus } from "../taxonomy";
import type { LeadInput } from "../validation";

export type InvestorRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  contact_method: string;
  notes_from_lead: string | null;
  lead_score: number;
  classification: LeadClassification;
  status: LeadStatus;
  source: string | null;
  source_detail: string | null;
  landing_page: string | null;
  consent_marketing: number;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  click_id: string | null;
  referrer: string | null;
  created_at: string;
  updated_at: string;
  last_contact_at: string | null;
  next_followup_at: string | null;
};

export type PreferenceRow = {
  id: number;
  investor_id: number;
  property_type: string;
  budget: string;
  location_scope: string;
  location_free: string | null;
  priorities: string;
  finance_status: string;
  timeframe: string;
  created_at: string;
  updated_at: string;
};

export type InvestorWithPreferences = InvestorRow & {
  preferences: (Omit<PreferenceRow, "priorities"> & { priorities: string[] }) | null;
};

/**
 * Create an investor plus their criteria, score the lead and set the initial
 * follow-up window — all in one transaction so a lead is never half-recorded.
 */
export function createInvestor(input: LeadInput): {
  investorId: number;
  score: number;
  classification: LeadClassification;
} {
  const db = getDb();

  const scoringInput: ScoringInput = {
    propertyType: input.propertyType,
    budget: input.budget,
    locationScope: input.locationScope,
    locationFree: input.locationFree || null,
    priorities: input.priorities,
    financeStatus: input.financeStatus,
    timeframe: input.timeframe,
  };
  const { score, classification } = scoreLead(scoringInput);
  const followUpDays = followUpWindowDays(classification);

  const run = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO investors
           (first_name, last_name, email, mobile, contact_method, notes_from_lead,
            lead_score, classification, status, source, source_detail, landing_page,
            utm_source, utm_medium, utm_campaign, utm_content, utm_term, click_id, referrer,
            consent_marketing, next_followup_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`,
      )
      .run(
        input.firstName,
        input.lastName,
        input.email,
        input.mobile,
        input.contactMethod,
        input.message || null,
        score,
        classification,
        input.source ?? "website",
        input.sourceDetail ?? null,
        input.landingPage ?? null,
        input.utmSource || null,
        input.utmMedium || null,
        input.utmCampaign || null,
        input.utmContent || null,
        input.utmTerm || null,
        input.clickId || null,
        input.referrer || null,
        input.consentMarketing ? 1 : 0,
        `+${followUpDays} days`,
      );

    const investorId = Number(result.lastInsertRowid);

    db.prepare(
      `INSERT INTO investor_preferences
         (investor_id, property_type, budget, location_scope, location_free,
          priorities, finance_status, timeframe)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      investorId,
      input.propertyType,
      input.budget,
      input.locationScope,
      input.locationFree || null,
      JSON.stringify(input.priorities),
      input.financeStatus,
      input.timeframe,
    );

    return investorId;
  });

  const investorId = run();
  return { investorId, score, classification };
}

export function getInvestor(id: number): InvestorWithPreferences | null {
  const db = getDb();
  const investor = db.prepare("SELECT * FROM investors WHERE id = ?").get(id) as
    | InvestorRow
    | undefined;
  if (!investor) return null;

  const prefs = db
    .prepare("SELECT * FROM investor_preferences WHERE investor_id = ? ORDER BY id DESC LIMIT 1")
    .get(id) as PreferenceRow | undefined;

  return {
    ...investor,
    preferences: prefs ? { ...prefs, priorities: safeParseArray(prefs.priorities) } : null,
  };
}

export type InvestorFilters = {
  status?: string;
  classification?: string;
  propertyType?: string;
  budget?: string;
  locationScope?: string;
  search?: string;
  campaign?: string;
  utmSource?: string;
  from?: string;
  to?: string;
  needsFollowUp?: boolean;
  sort?: "recent" | "score" | "name";
  limit?: number;
  offset?: number;
};

export type InvestorListItem = InvestorRow & {
  property_type: string | null;
  budget: string | null;
  location_scope: string | null;
  location_free: string | null;
  timeframe: string | null;
  finance_status: string | null;
  match_count: number;
};

export function listInvestors(filters: InvestorFilters = {}): {
  rows: InvestorListItem[];
  total: number;
} {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    where.push("i.status = ?");
    params.push(filters.status);
  }
  if (filters.classification) {
    where.push("i.classification = ?");
    params.push(filters.classification);
  }
  if (filters.propertyType) {
    where.push("p.property_type = ?");
    params.push(filters.propertyType);
  }
  if (filters.budget) {
    where.push("p.budget = ?");
    params.push(filters.budget);
  }
  if (filters.locationScope) {
    where.push("p.location_scope = ?");
    params.push(filters.locationScope);
  }
  if (filters.search) {
    where.push(
      "(i.first_name LIKE ? OR i.last_name LIKE ? OR i.email LIKE ? OR i.mobile LIKE ? OR p.location_free LIKE ?)",
    );
    const like = `%${filters.search}%`;
    params.push(like, like, like, like, like);
  }
  if (filters.campaign) {
    where.push("i.utm_campaign = ?");
    params.push(filters.campaign);
  }
  if (filters.utmSource) {
    where.push("i.utm_source = ?");
    params.push(filters.utmSource);
  }
  if (filters.from) {
    where.push("date(i.created_at) >= date(?)");
    params.push(filters.from);
  }
  if (filters.to) {
    where.push("date(i.created_at) <= date(?)");
    params.push(filters.to);
  }
  if (filters.needsFollowUp) {
    where.push(
      "i.next_followup_at IS NOT NULL AND i.next_followup_at <= datetime('now') AND i.status NOT IN ('converted','not_suitable')",
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSql =
    filters.sort === "score"
      ? "ORDER BY i.lead_score DESC, i.created_at DESC"
      : filters.sort === "name"
        ? "ORDER BY i.last_name COLLATE NOCASE, i.first_name COLLATE NOCASE"
        : "ORDER BY i.created_at DESC";

  const limit = Math.min(filters.limit ?? 50, 200);
  const offset = filters.offset ?? 0;

  const base = `
    FROM investors i
    LEFT JOIN investor_preferences p ON p.id = (
      SELECT id FROM investor_preferences WHERE investor_id = i.id ORDER BY id DESC LIMIT 1
    )
    ${whereSql}`;

  const total = (
    db.prepare(`SELECT COUNT(*) AS c ${base}`).get(...params) as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT i.*, p.property_type, p.budget, p.location_scope, p.location_free,
              p.timeframe, p.finance_status,
              (SELECT COUNT(*) FROM opportunity_matches m WHERE m.investor_id = i.id) AS match_count
       ${base}
       ${orderSql}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as InvestorListItem[];

  return { rows, total };
}

export function updateInvestorStatus(id: number, status: LeadStatus): void {
  getDb()
    .prepare(
      `UPDATE investors
          SET status = ?,
              updated_at = datetime('now'),
              last_contact_at = CASE WHEN ? IN ('new') THEN last_contact_at ELSE datetime('now') END
        WHERE id = ?`,
    )
    .run(status, status, id);
}

export function updateInvestorFields(
  id: number,
  fields: { next_followup_at?: string | null; last_contact_at?: string | null },
): void {
  const db = getDb();
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    sets.push(`${key} = ?`);
    params.push(value);
  }
  if (!sets.length) return;
  sets.push("updated_at = datetime('now')");
  params.push(id);
  db.prepare(`UPDATE investors SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

/** Recompute score + classification, e.g. after criteria are edited in admin. */
export function rescoreInvestor(id: number): void {
  const investor = getInvestor(id);
  if (!investor?.preferences) return;
  const p = investor.preferences;
  const { score, classification } = scoreLead({
    propertyType: p.property_type as ScoringInput["propertyType"],
    budget: p.budget as ScoringInput["budget"],
    locationScope: p.location_scope as ScoringInput["locationScope"],
    locationFree: p.location_free,
    priorities: p.priorities as ScoringInput["priorities"],
    financeStatus: p.finance_status as ScoringInput["financeStatus"],
    timeframe: p.timeframe as ScoringInput["timeframe"],
  });
  getDb()
    .prepare(
      "UPDATE investors SET lead_score = ?, classification = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .run(score, classification, id);
}

export function findInvestorByEmail(email: string): InvestorRow | null {
  return (
    (getDb()
      .prepare("SELECT * FROM investors WHERE email = ? ORDER BY id DESC LIMIT 1")
      .get(email.toLowerCase()) as InvestorRow | undefined) ?? null
  );
}

function safeParseArray(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
