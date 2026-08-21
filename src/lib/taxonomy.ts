/**
 * Shared vocabulary for investor criteria and private opportunities.
 *
 * These option sets are the contract between the public qualification form,
 * the lead scoring engine, the matching engine and the admin filters. Keep the
 * `value` strings stable — they are persisted in the database.
 */

export type Option<T extends string = string> = {
  value: T;
  label: string;
  /** Short helper copy shown under the label on wide screens. */
  hint?: string;
};

/* ------------------------------------------------------------------ */
/* Property type                                                       */
/* ------------------------------------------------------------------ */

export const PROPERTY_TYPES = [
  "warehouse",
  "industrial",
  "storage",
  "small_commercial",
  "open",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_OPTIONS: Option<PropertyType>[] = [
  { value: "warehouse", label: "Warehouse", hint: "Standalone or strata warehouse space" },
  { value: "industrial", label: "Industrial", hint: "Industrial units and light industrial" },
  { value: "storage", label: "Storage", hint: "Smaller storage-style commercial space" },
  { value: "small_commercial", label: "Small commercial property", hint: "Lower-entry commercial" },
  { value: "open", label: "Open to options", hint: "Show me what may suit" },
];

/* ------------------------------------------------------------------ */
/* Budget                                                              */
/* ------------------------------------------------------------------ */

export const BUDGETS = [
  "under_300k",
  "300k_500k",
  "500k_750k",
  "750k_1m",
  "1m_plus",
  "unsure",
] as const;
export type Budget = (typeof BUDGETS)[number];

export const BUDGET_OPTIONS: Option<Budget>[] = [
  { value: "under_300k", label: "Under $300,000" },
  { value: "300k_500k", label: "$300,000 – $500,000" },
  { value: "500k_750k", label: "$500,000 – $750,000" },
  { value: "750k_1m", label: "$750,000 – $1,000,000" },
  { value: "1m_plus", label: "$1M+" },
  { value: "unsure", label: "Not sure yet" },
];

/**
 * Numeric envelope for each budget band, used by the matching engine.
 * `null` max means open-ended. `unsure` intentionally has no range — an
 * investor without a budget cannot be price-matched with confidence.
 */
export const BUDGET_RANGES: Record<Budget, { min: number; max: number | null } | null> = {
  under_300k: { min: 0, max: 300_000 },
  "300k_500k": { min: 300_000, max: 500_000 },
  "500k_750k": { min: 500_000, max: 750_000 },
  "750k_1m": { min: 750_000, max: 1_000_000 },
  "1m_plus": { min: 1_000_000, max: null },
  unsure: null,
};

/* ------------------------------------------------------------------ */
/* Location                                                            */
/* ------------------------------------------------------------------ */

export const LOCATIONS = [
  "melbourne",
  "greater_melbourne",
  "regional_vic",
  "anywhere_vic",
  "australia_wide",
  "open",
] as const;
export type LocationScope = (typeof LOCATIONS)[number];

export const LOCATION_OPTIONS: Option<LocationScope>[] = [
  { value: "melbourne", label: "Melbourne" },
  { value: "greater_melbourne", label: "Greater Melbourne" },
  { value: "regional_vic", label: "Regional Victoria" },
  { value: "anywhere_vic", label: "Anywhere in Victoria" },
  { value: "australia_wide", label: "Australia-wide" },
  { value: "open", label: "Open to options" },
];

/* ------------------------------------------------------------------ */
/* Priorities (multi-select)                                           */
/* ------------------------------------------------------------------ */

export const PRIORITIES = [
  "rental_income",
  "long_term",
  "entry_price",
  "location",
  "industrial_exposure",
  "storage",
  "capital_growth",
  "diversification",
  "researching",
] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_OPTIONS: Option<Priority>[] = [
  { value: "rental_income", label: "Rental income" },
  { value: "long_term", label: "Long-term investment" },
  { value: "entry_price", label: "Entry price" },
  { value: "location", label: "Location" },
  { value: "industrial_exposure", label: "Industrial/warehouse exposure" },
  { value: "storage", label: "Storage" },
  { value: "capital_growth", label: "Potential for capital growth" },
  { value: "diversification", label: "Diversification" },
  { value: "researching", label: "I'm still researching" },
];

/* ------------------------------------------------------------------ */
/* Finance status                                                      */
/* ------------------------------------------------------------------ */

export const FINANCE_STATUSES = [
  "pre_approved",
  "assessment_underway",
  "cash_buyer",
  "not_yet",
  "not_sure",
] as const;
export type FinanceStatus = (typeof FINANCE_STATUSES)[number];

export const FINANCE_OPTIONS: Option<FinanceStatus>[] = [
  { value: "pre_approved", label: "Pre-approved" },
  { value: "assessment_underway", label: "Finance assessment underway" },
  { value: "cash_buyer", label: "Cash buyer" },
  { value: "not_yet", label: "Not yet" },
  { value: "not_sure", label: "Not sure" },
];

/* ------------------------------------------------------------------ */
/* Timeframe                                                           */
/* ------------------------------------------------------------------ */

export const TIMEFRAMES = [
  "immediately",
  "1_3_months",
  "3_6_months",
  "6_12_months",
  "researching",
] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const TIMEFRAME_OPTIONS: Option<Timeframe>[] = [
  { value: "immediately", label: "Immediately" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "6_12_months", label: "6–12 months" },
  { value: "researching", label: "Just researching" },
];

/* ------------------------------------------------------------------ */
/* Contact preference                                                  */
/* ------------------------------------------------------------------ */

export const CONTACT_METHODS = ["email", "phone", "sms"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_METHOD_OPTIONS: Option<ContactMethod>[] = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "sms", label: "SMS" },
];

/* ------------------------------------------------------------------ */
/* Lead classification + pipeline (ADMIN ONLY — never rendered publicly)*/
/* ------------------------------------------------------------------ */

export const LEAD_CLASSIFICATIONS = ["HOT", "WARM", "NURTURE"] as const;
export type LeadClassification = (typeof LEAD_CLASSIFICATIONS)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "opportunity_sent",
  "inspection_discussion",
  "negotiating",
  "converted",
  "nurture",
  "not_suitable",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  opportunity_sent: "Opportunity Sent",
  inspection_discussion: "Inspection/Discussion",
  negotiating: "Negotiating",
  converted: "Converted",
  nurture: "Nurture",
  not_suitable: "Not Suitable",
};

/** Ordered pipeline shown on the admin dashboard funnel. */
export const PIPELINE_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "opportunity_sent",
  "converted",
];

/* ------------------------------------------------------------------ */
/* Private opportunity vocabulary (ADMIN ONLY)                         */
/* ------------------------------------------------------------------ */

export const AU_STATES = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;
export type AuState = (typeof AU_STATES)[number];

export const COMPLETION_STATUSES = [
  "completed",
  "under_construction",
  "off_the_plan",
  "planned",
] as const;
export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];

export const COMPLETION_LABELS: Record<CompletionStatus, string> = {
  completed: "Completed",
  under_construction: "Under construction",
  off_the_plan: "Off the plan",
  planned: "Planned",
};

export const AVAILABILITY_STATUSES = ["available", "on_hold", "under_offer", "sold", "withdrawn"] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  on_hold: "On hold",
  under_offer: "Under offer",
  sold: "Sold",
  withdrawn: "Withdrawn",
};

/* ------------------------------------------------------------------ */
/* Label helpers                                                       */
/* ------------------------------------------------------------------ */

function toLabelMap<T extends string>(options: Option<T>[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

export const LABELS: Record<string, Record<string, string>> = {
  propertyType: toLabelMap(PROPERTY_TYPE_OPTIONS),
  budget: toLabelMap(BUDGET_OPTIONS),
  location: toLabelMap(LOCATION_OPTIONS),
  priority: toLabelMap(PRIORITY_OPTIONS),
  finance: toLabelMap(FINANCE_OPTIONS),
  timeframe: toLabelMap(TIMEFRAME_OPTIONS),
  contactMethod: toLabelMap(CONTACT_METHOD_OPTIONS),
};

export function labelFor(group: keyof typeof LABELS, value: string | null | undefined): string {
  if (!value) return "—";
  return LABELS[group]?.[value] ?? value;
}
