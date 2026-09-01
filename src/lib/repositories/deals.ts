import "server-only";
import { getDb } from "../db";
import { commissionFor, forecastRevenue, progressToTarget, type Deal, type DealStage } from "../revenue";

/** ADMIN ONLY. Commission figures never leave the authenticated admin tier. */

export type DealRow = {
  id: number;
  investor_id: number;
  opportunity_id: number | null;
  stage: string;
  price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  expected_settlement: string | null;
  commission_paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DealWithContext = DealRow & {
  investor_name: string;
  investor_email: string;
  reference: string | null;
  completion_status: string | null;
  suburb: string | null;
};

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

const DEFAULTS = {
  commission_rate: "4",
  revenue_target: "100000",
  target_date: "",
  /** Registrations → paid deals. Overwritten by observed data once there is any. */
  assumed_conversion_rate: "0.03",
} as const;

export type SettingKey = keyof typeof DEFAULTS;

export function getSetting(key: SettingKey): string {
  const row = getDb().prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? DEFAULTS[key];
}

export function getSettings(): Record<SettingKey, string> {
  return Object.fromEntries(
    (Object.keys(DEFAULTS) as SettingKey[]).map((key) => [key, getSetting(key)]),
  ) as Record<SettingKey, string>;
}

export function setSetting(key: SettingKey, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    )
    .run(key, value);
}

/* ------------------------------------------------------------------ */
/* Deals                                                               */
/* ------------------------------------------------------------------ */

export function createDeal(input: {
  investorId: number;
  opportunityId?: number | null;
  stage: DealStage;
  price: number | null;
  commissionRate: number;
  expectedSettlement?: string | null;
  notes?: string | null;
}): number {
  const commission = commissionFor(input.price, input.commissionRate);
  const result = getDb()
    .prepare(
      `INSERT INTO deals
         (investor_id, opportunity_id, stage, price, commission_rate, commission_amount,
          expected_settlement, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.investorId,
      input.opportunityId ?? null,
      input.stage,
      input.price,
      input.commissionRate,
      commission,
      input.expectedSettlement || null,
      input.notes || null,
    );
  return Number(result.lastInsertRowid);
}

export function updateDeal(
  id: number,
  input: {
    stage?: DealStage;
    price?: number | null;
    commissionRate?: number;
    expectedSettlement?: string | null;
    commissionPaidAt?: string | null;
    notes?: string | null;
  },
): void {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as DealRow | undefined;
  if (!existing) return;

  const price = input.price === undefined ? existing.price : input.price;
  const rate = input.commissionRate ?? existing.commission_rate ?? 0;

  db.prepare(
    `UPDATE deals
        SET stage = COALESCE(?, stage),
            price = ?,
            commission_rate = ?,
            commission_amount = ?,
            expected_settlement = ?,
            commission_paid_at = ?,
            notes = ?,
            updated_at = datetime('now')
      WHERE id = ?`,
  ).run(
    input.stage ?? null,
    price,
    rate,
    commissionFor(price, rate),
    input.expectedSettlement === undefined ? existing.expected_settlement : input.expectedSettlement || null,
    input.commissionPaidAt === undefined ? existing.commission_paid_at : input.commissionPaidAt || null,
    input.notes === undefined ? existing.notes : input.notes || null,
    id,
  );
}

export function deleteDeal(id: number): void {
  getDb().prepare("DELETE FROM deals WHERE id = ?").run(id);
}

export function listDealsForInvestor(investorId: number): DealWithContext[] {
  return getDb()
    .prepare(
      `SELECT d.*, i.first_name || ' ' || i.last_name AS investor_name, i.email AS investor_email,
              o.reference, o.completion_status, o.suburb
         FROM deals d
         JOIN investors i ON i.id = d.investor_id
         LEFT JOIN opportunities o ON o.id = d.opportunity_id
        WHERE d.investor_id = ?
        ORDER BY d.created_at DESC`,
    )
    .all(investorId) as DealWithContext[];
}

export function listDeals(): DealWithContext[] {
  return getDb()
    .prepare(
      `SELECT d.*, i.first_name || ' ' || i.last_name AS investor_name, i.email AS investor_email,
              o.reference, o.completion_status, o.suburb
         FROM deals d
         JOIN investors i ON i.id = d.investor_id
         LEFT JOIN opportunities o ON o.id = d.opportunity_id
        ORDER BY
          CASE d.stage WHEN 'lost' THEN 1 ELSE 0 END,
          d.commission_amount DESC`,
    )
    .all() as DealWithContext[];
}

/* ------------------------------------------------------------------ */
/* Revenue view                                                        */
/* ------------------------------------------------------------------ */

export type RevenueSnapshot = ReturnType<typeof getRevenueSnapshot>;

export function getRevenueSnapshot() {
  const db = getDb();
  const settings = getSettings();
  const target = Number(settings.revenue_target) || 0;
  const rate = Number(settings.commission_rate) || 0;

  const deals = db
    .prepare("SELECT stage, commission_amount, expected_settlement, commission_paid_at FROM deals")
    .all() as {
    stage: string;
    commission_amount: number | null;
    expected_settlement: string | null;
    commission_paid_at: string | null;
  }[];

  const forecast = forecastRevenue(
    deals.map<Deal>((d) => ({
      stage: d.stage,
      commissionAmount: d.commission_amount,
      expectedSettlement: d.expected_settlement,
      commissionPaidAt: d.commission_paid_at,
    })),
  );

  // Average commission: use real deals where they exist, otherwise derive it
  // from the available stock, so the "deals still needed" figure is grounded
  // in what can actually be sold rather than a guess.
  const dealAverage = db
    .prepare("SELECT AVG(commission_amount) AS v FROM deals WHERE commission_amount > 0")
    .get() as { v: number | null };
  const stockAverage = db
    .prepare("SELECT AVG(price) AS v FROM opportunities WHERE availability = 'available' AND price > 0")
    .get() as { v: number | null };

  const averageCommission =
    dealAverage.v && dealAverage.v > 0
      ? Math.round(dealAverage.v)
      : Math.round((stockAverage.v ?? 0) * (rate / 100));

  /**
   * Observed conversion: won deals per registration.
   *
   * Only trusted once there is enough history to mean anything. One deal
   * against six leads is not a 17% conversion rate, it is noise — and a
   * forecast built on noise is worse than one built on a stated assumption,
   * because it looks authoritative. Below the threshold we keep using the
   * assumption and say so.
   */
  const MIN_LEADS_FOR_OBSERVED = 40;
  const MIN_DEALS_FOR_OBSERVED = 3;

  const totalLeads = (db.prepare("SELECT COUNT(*) AS c FROM investors").get() as { c: number }).c;
  const wonDeals = (
    db
      .prepare("SELECT COUNT(*) AS c FROM deals WHERE stage IN ('committed','settled')")
      .get() as { c: number }
  ).c;

  const hasEnoughHistory =
    totalLeads >= MIN_LEADS_FOR_OBSERVED && wonDeals >= MIN_DEALS_FOR_OBSERVED;
  const observedConversion = hasEnoughHistory ? wonDeals / totalLeads : null;
  const conversionRate = observedConversion ?? (Number(settings.assumed_conversion_rate) || null);

  const progress = progressToTarget(forecast, { target, averageCommission, conversionRate });

  // Commission that could be realised quickly — completed stock only.
  const fastStock = db
    .prepare(
      `SELECT COUNT(*) AS c, COALESCE(SUM(price), 0) AS total
         FROM opportunities
        WHERE availability = 'available' AND completion_status = 'completed'`,
    )
    .get() as { c: number; total: number };

  return {
    settings,
    forecast,
    progress,
    averageCommission,
    conversionRate,
    observedConversion,
    totalLeads,
    fastStock: {
      count: fastStock.c,
      potentialCommission: Math.round(fastStock.total * (rate / 100)),
    },
  };
}
