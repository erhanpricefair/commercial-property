import "server-only";
import { getDb } from "../db";
import { PIPELINE_ORDER, type LeadStatus } from "../taxonomy";

/** Aggregates for the admin dashboard. Admin-only, like everything here. */

export type DashboardStats = {
  todayLeads: number;
  weekLeads: number;
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  nurtureLeads: number;
  investorsWithMatches: number;
  followUpRequired: number;
  totalOpportunities: number;
  availableOpportunities: number;
  activePresentations: number;
  pipeline: { status: LeadStatus; label: string; count: number }[];
};

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const one = <T>(sql: string, ...params: unknown[]): T =>
    (db.prepare(sql).get(...params) as { v: T }).v;

  const pipelineCounts = db
    .prepare("SELECT status, COUNT(*) AS c FROM investors GROUP BY status")
    .all() as { status: LeadStatus; c: number }[];
  const byStatus = new Map(pipelineCounts.map((r) => [r.status, r.c]));

  return {
    todayLeads: one<number>("SELECT COUNT(*) AS v FROM investors WHERE date(created_at) = date('now')"),
    weekLeads: one<number>("SELECT COUNT(*) AS v FROM investors WHERE created_at >= datetime('now','-7 days')"),
    totalLeads: one<number>("SELECT COUNT(*) AS v FROM investors"),
    hotLeads: one<number>("SELECT COUNT(*) AS v FROM investors WHERE classification = 'HOT' AND status NOT IN ('converted','not_suitable')"),
    warmLeads: one<number>("SELECT COUNT(*) AS v FROM investors WHERE classification = 'WARM' AND status NOT IN ('converted','not_suitable')"),
    nurtureLeads: one<number>("SELECT COUNT(*) AS v FROM investors WHERE classification = 'NURTURE'"),
    investorsWithMatches: one<number>(
      "SELECT COUNT(DISTINCT investor_id) AS v FROM opportunity_matches",
    ),
    followUpRequired: one<number>(
      `SELECT COUNT(*) AS v FROM investors
        WHERE next_followup_at IS NOT NULL
          AND next_followup_at <= datetime('now')
          AND status NOT IN ('converted','not_suitable')`,
    ),
    totalOpportunities: one<number>("SELECT COUNT(*) AS v FROM opportunities"),
    availableOpportunities: one<number>("SELECT COUNT(*) AS v FROM opportunities WHERE availability = 'available'"),
    activePresentations: one<number>(
      `SELECT COUNT(*) AS v FROM presentations
        WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    ),
    pipeline: PIPELINE_ORDER.map((status) => ({
      status,
      label: status,
      count: byStatus.get(status) ?? 0,
    })),
  };
}

export type DashboardInvestor = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  classification: string;
  lead_score: number;
  status: string;
  created_at: string;
  property_type: string | null;
  budget: string | null;
  location_scope: string | null;
  match_count: number;
  next_followup_at: string | null;
};

const DASHBOARD_SELECT = `
  SELECT i.id, i.first_name, i.last_name, i.email, i.classification, i.lead_score,
         i.status, i.created_at, i.next_followup_at,
         p.property_type, p.budget, p.location_scope,
         (SELECT COUNT(*) FROM opportunity_matches m WHERE m.investor_id = i.id) AS match_count
    FROM investors i
    LEFT JOIN investor_preferences p ON p.id = (
      SELECT id FROM investor_preferences WHERE investor_id = i.id ORDER BY id DESC LIMIT 1
    )`;

export function todaysLeads(limit = 10): DashboardInvestor[] {
  return getDb()
    .prepare(`${DASHBOARD_SELECT} WHERE date(i.created_at) = date('now') ORDER BY i.created_at DESC LIMIT ?`)
    .all(limit) as DashboardInvestor[];
}

export function hotLeads(limit = 10): DashboardInvestor[] {
  return getDb()
    .prepare(
      `${DASHBOARD_SELECT}
        WHERE i.classification = 'HOT' AND i.status NOT IN ('converted','not_suitable')
        ORDER BY i.lead_score DESC, i.created_at DESC LIMIT ?`,
    )
    .all(limit) as DashboardInvestor[];
}

export function investorsWithMatches(limit = 10): DashboardInvestor[] {
  return getDb()
    .prepare(
      `${DASHBOARD_SELECT}
        WHERE (SELECT COUNT(*) FROM opportunity_matches m WHERE m.investor_id = i.id) > 0
          AND i.status NOT IN ('converted','not_suitable')
        ORDER BY match_count DESC, i.lead_score DESC LIMIT ?`,
    )
    .all(limit) as DashboardInvestor[];
}

export function followUpQueue(limit = 10): DashboardInvestor[] {
  return getDb()
    .prepare(
      `${DASHBOARD_SELECT}
        WHERE i.next_followup_at IS NOT NULL
          AND i.next_followup_at <= datetime('now')
          AND i.status NOT IN ('converted','not_suitable')
        ORDER BY i.next_followup_at ASC LIMIT ?`,
    )
    .all(limit) as DashboardInvestor[];
}
