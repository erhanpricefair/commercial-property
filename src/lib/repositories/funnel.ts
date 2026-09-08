import "server-only";
import { getDb } from "../db";
import {
  computeFunnelSteps,
  worstFunnelStep,
  completionRate,
  FUNNEL_STEP_LABELS,
  type FunnelStep,
} from "../funnel";

export type { FunnelStep };

/**
 * Partial registrations and funnel counts.
 *
 * Both exist to answer questions the public site otherwise swallows: who
 * almost registered, and where the ones who didn't gave up.
 */

/* ------------------------------------------------------------------ */
/* Partial registrations                                               */
/* ------------------------------------------------------------------ */

export type PartialInput = {
  sessionKey: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobile?: string | null;
  propertyType?: string | null;
  budget?: string | null;
  locationScope?: string | null;
  locationFree?: string | null;
  priorities?: string[];
  financeStatus?: string | null;
  timeframe?: string | null;
  lastStep?: number;
  source?: string | null;
  landingPage?: string | null;
  utmCampaign?: string | null;
  utmSource?: string | null;
};

export type PartialRow = {
  id: number;
  session_key: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  mobile: string | null;
  property_type: string | null;
  budget: string | null;
  location_scope: string | null;
  location_free: string | null;
  priorities: string;
  finance_status: string | null;
  timeframe: string | null;
  last_step: number;
  source: string | null;
  landing_page: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  promoted_investor_id: number | null;
  created_at: string;
  updated_at: string;
};

/** Upsert by session so repeated saves from one visitor stay one row. */
export function savePartial(input: PartialInput): void {
  getDb()
    .prepare(
      `INSERT INTO partial_registrations
         (session_key, email, first_name, last_name, mobile, property_type, budget,
          location_scope, location_free, priorities, finance_status, timeframe,
          last_step, source, landing_page, utm_campaign, utm_source)
       VALUES (@sessionKey, @email, @firstName, @lastName, @mobile, @propertyType, @budget,
               @locationScope, @locationFree, @priorities, @financeStatus, @timeframe,
               @lastStep, @source, @landingPage, @utmCampaign, @utmSource)
       ON CONFLICT(session_key) DO UPDATE SET
         email          = COALESCE(excluded.email, email),
         first_name     = COALESCE(excluded.first_name, first_name),
         last_name      = COALESCE(excluded.last_name, last_name),
         mobile         = COALESCE(excluded.mobile, mobile),
         property_type  = COALESCE(excluded.property_type, property_type),
         budget         = COALESCE(excluded.budget, budget),
         location_scope = COALESCE(excluded.location_scope, location_scope),
         location_free  = COALESCE(excluded.location_free, location_free),
         priorities     = excluded.priorities,
         finance_status = COALESCE(excluded.finance_status, finance_status),
         timeframe      = COALESCE(excluded.timeframe, timeframe),
         last_step      = MAX(excluded.last_step, last_step),
         updated_at     = datetime('now')`,
    )
    .run({
      sessionKey: input.sessionKey,
      email: input.email || null,
      firstName: input.firstName || null,
      lastName: input.lastName || null,
      mobile: input.mobile || null,
      propertyType: input.propertyType || null,
      budget: input.budget || null,
      locationScope: input.locationScope || null,
      locationFree: input.locationFree || null,
      priorities: JSON.stringify(input.priorities ?? []),
      financeStatus: input.financeStatus || null,
      timeframe: input.timeframe || null,
      lastStep: input.lastStep ?? 0,
      source: input.source || null,
      landingPage: input.landingPage || null,
      utmCampaign: input.utmCampaign || null,
      utmSource: input.utmSource || null,
    });
}

/** Called when a session completes, so the partial stops showing as a lead. */
export function promotePartial(sessionKey: string, investorId: number): void {
  getDb()
    .prepare(
      "UPDATE partial_registrations SET promoted_investor_id = ?, updated_at = datetime('now') WHERE session_key = ?",
    )
    .run(investorId, sessionKey);
}

/**
 * Partials worth chasing: an email, and not since completed.
 *
 * Also excludes anyone whose email later registered properly by another route
 * — the same person arriving twice is one lead, not two.
 */
export function listOpenPartials(limit = 100): PartialRow[] {
  return getDb()
    .prepare(
      `SELECT p.* FROM partial_registrations p
        WHERE p.promoted_investor_id IS NULL
          AND p.email IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM investors i WHERE i.email = p.email)
        ORDER BY p.last_step DESC, p.updated_at DESC
        LIMIT ?`,
    )
    .all(limit) as PartialRow[];
}

export function countOpenPartials(): number {
  return (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS c FROM partial_registrations p
          WHERE p.promoted_investor_id IS NULL
            AND p.email IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM investors i WHERE i.email = p.email)`,
      )
      .get() as { c: number }
  ).c;
}

export function deletePartial(id: number): void {
  getDb().prepare("DELETE FROM partial_registrations WHERE id = ?").run(id);
}

/** Housekeeping — partials are half-given information and shouldn't be kept forever. */
export function purgeOldPartials(days = 90): number {
  return getDb()
    .prepare(`DELETE FROM partial_registrations WHERE updated_at < datetime('now', ?)`)
    .run(`-${days} days`).changes;
}

/* ------------------------------------------------------------------ */
/* Funnel counts                                                       */
/* ------------------------------------------------------------------ */

export function recordFunnelEvent(input: {
  event: string;
  step?: number | null;
  source?: string | null;
  landingPage?: string | null;
}): void {
  getDb()
    .prepare("INSERT INTO funnel_events (event, step, source, landing_page) VALUES (?, ?, ?, ?)")
    .run(input.event, input.step ?? null, input.source || null, input.landingPage || null);
}

export type FunnelReport = {
  days: number;
  started: number;
  completed: number;
  completionRate: number;
  steps: FunnelStep[];
  bySource: { source: string; started: number; completed: number; rate: number }[];
  worstStep: FunnelStep | null;
};

/**
 * Where people give up.
 *
 * Counts distinct step-reached events rather than sessions, which slightly
 * overstates absolute volume if someone steps backwards — but the *shape* is
 * what matters here, and the shape is what tells you which question to fix.
 */
export function getFunnelReport(days = 30): FunnelReport {
  const db = getDb();
  const since = `-${days} days`;

  const started = (
    db
      .prepare("SELECT COUNT(*) AS c FROM funnel_events WHERE event = 'form_start' AND created_at >= datetime('now', ?)")
      .get(since) as { c: number }
  ).c;

  const completed = (
    db
      .prepare("SELECT COUNT(*) AS c FROM funnel_events WHERE event = 'form_complete' AND created_at >= datetime('now', ?)")
      .get(since) as { c: number }
  ).c;

  const rows = db
    .prepare(
      `SELECT step, COUNT(*) AS c FROM funnel_events
        WHERE event = 'form_step' AND step IS NOT NULL AND created_at >= datetime('now', ?)
        GROUP BY step ORDER BY step`,
    )
    .all(since) as { step: number; c: number }[];

  const reachedByStep = new Map(rows.map((r) => [r.step, r.c]));
  const steps = computeFunnelSteps(started, reachedByStep, FUNNEL_STEP_LABELS);

  const bySourceRows = db
    .prepare(
      `SELECT COALESCE(source, 'direct') AS source,
              SUM(CASE WHEN event = 'form_start' THEN 1 ELSE 0 END) AS started,
              SUM(CASE WHEN event = 'form_complete' THEN 1 ELSE 0 END) AS completed
         FROM funnel_events
        WHERE created_at >= datetime('now', ?)
        GROUP BY COALESCE(source, 'direct')
        HAVING started > 0
        ORDER BY started DESC`,
    )
    .all(since) as { source: string; started: number; completed: number }[];

  return {
    days,
    started,
    completed,
    completionRate: completionRate(started, completed),
    steps,
    bySource: bySourceRows.map((r) => ({
      ...r,
      rate: r.started > 0 ? Math.round((r.completed / r.started) * 100) : 0,
    })),
    worstStep: worstFunnelStep(steps),
  };
}
