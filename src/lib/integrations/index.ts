import "server-only";
import { getDb } from "../db";

/**
 * Outbound integration layer.
 *
 * The platform is deliberately not coupled to any one CRM, ESP or automation
 * tool. A lead event is written to `integration_events`, then dispatched to
 * whichever destinations are configured by environment variable:
 *
 *   LEAD_WEBHOOK_URL        generic JSON POST (Zapier / Make / n8n / anything)
 *   LEAD_WEBHOOK_SECRET     optional, sent as X-Signature (HMAC-SHA256 of body)
 *   HUBSPOT_ACCESS_TOKEN    creates/updates a HubSpot contact
 *   GOOGLE_SHEETS_WEBHOOK   Apps Script web-app URL for a Sheets row
 *   SLACK_WEBHOOK_URL       internal notification for HOT leads
 *
 * Add a provider by adding a function to `DESTINATIONS` — no other file needs
 * to change. Nothing here is permitted to send private opportunity data; the
 * payload builders below only accept investor-side fields.
 */

export type IntegrationPayload = {
  event: string;
  investor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    contactMethod: string;
    message?: string | null;
    consentMarketing: boolean;
  };
  criteria?: {
    propertyType: string;
    budget: string;
    locationScope: string;
    locationFree?: string | null;
    priorities: string[];
    financeStatus: string;
    timeframe: string;
  };
  /** Internal qualification. Sent to the owner's own CRM only. */
  internal?: {
    leadScore: number;
    classification: string;
    matchCount: number;
  };
  attribution?: {
    source?: string | null;
    sourceDetail?: string | null;
    landingPage?: string | null;
  };
  occurredAt: string;
};

type Destination = {
  name: string;
  enabled: () => boolean;
  send: (payload: IntegrationPayload) => Promise<void>;
};

const DESTINATIONS: Destination[] = [
  {
    name: "webhook",
    enabled: () => Boolean(process.env.LEAD_WEBHOOK_URL),
    send: async (payload) => {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.LEAD_WEBHOOK_SECRET;
      if (secret) {
        const { createHmac } = await import("node:crypto");
        headers["X-Signature"] = createHmac("sha256", secret).update(body).digest("hex");
      }
      await postJson(process.env.LEAD_WEBHOOK_URL!, body, headers);
    },
  },
  {
    name: "hubspot",
    enabled: () => Boolean(process.env.HUBSPOT_ACCESS_TOKEN),
    send: async (payload) => {
      const properties: Record<string, string> = {
        email: payload.investor.email,
        firstname: payload.investor.firstName,
        lastname: payload.investor.lastName,
        phone: payload.investor.mobile,
      };
      if (payload.criteria) {
        properties.commercial_property_type = payload.criteria.propertyType;
        properties.commercial_budget = payload.criteria.budget;
        properties.commercial_location = payload.criteria.locationScope;
        properties.commercial_timeframe = payload.criteria.timeframe;
        properties.commercial_finance_status = payload.criteria.financeStatus;
      }
      if (payload.internal) properties.commercial_lead_grade = payload.internal.classification;

      await postJson(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        JSON.stringify({ properties }),
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        },
      );
    },
  },
  {
    name: "google_sheets",
    enabled: () => Boolean(process.env.GOOGLE_SHEETS_WEBHOOK),
    send: async (payload) => {
      await postJson(process.env.GOOGLE_SHEETS_WEBHOOK!, JSON.stringify(payload), {
        "Content-Type": "application/json",
      });
    },
  },
  {
    name: "slack",
    enabled: () => Boolean(process.env.SLACK_WEBHOOK_URL),
    send: async (payload) => {
      if (payload.internal?.classification !== "HOT") return;
      const c = payload.criteria;
      const text = [
        `*New HOT investor lead*`,
        `${payload.investor.firstName} ${payload.investor.lastName} — ${payload.investor.email}`,
        c ? `${c.propertyType} · ${c.budget} · ${c.locationScope} · ${c.timeframe}` : "",
        payload.internal ? `Potential matches: ${payload.internal.matchCount}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      await postJson(process.env.SLACK_WEBHOOK_URL!, JSON.stringify({ text }), {
        "Content-Type": "application/json",
      });
    },
  },
];

/**
 * Record the event, then attempt delivery to every configured destination.
 * Delivery failures are recorded but never surfaced to the visitor — a CRM
 * outage must not cost us the lead, which is already safely in our own DB.
 */
export async function dispatchLeadEvent(payload: IntegrationPayload): Promise<void> {
  const db = getDb();
  const active = DESTINATIONS.filter((d) => d.enabled());

  if (!active.length) {
    db.prepare(
      "INSERT INTO integration_events (event_type, payload, destination, status) VALUES (?, ?, ?, 'skipped')",
    ).run(payload.event, JSON.stringify(payload), "none-configured");
    return;
  }

  await Promise.all(
    active.map(async (destination) => {
      const id = Number(
        db
          .prepare(
            "INSERT INTO integration_events (event_type, payload, destination) VALUES (?, ?, ?)",
          )
          .run(payload.event, JSON.stringify(payload), destination.name).lastInsertRowid,
      );
      try {
        await destination.send(payload);
        db.prepare(
          "UPDATE integration_events SET status = 'delivered', attempts = attempts + 1, delivered_at = datetime('now') WHERE id = ?",
        ).run(id);
      } catch (error) {
        db.prepare(
          "UPDATE integration_events SET status = 'failed', attempts = attempts + 1, last_error = ? WHERE id = ?",
        ).run(error instanceof Error ? error.message : String(error), id);
      }
    }),
  );
}

async function postJson(url: string, body: string, headers: Record<string, string>): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { method: "POST", body, headers, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function listIntegrationEvents(limit = 50) {
  return getDb()
    .prepare("SELECT * FROM integration_events ORDER BY id DESC LIMIT ?")
    .all(limit) as {
    id: number;
    event_type: string;
    destination: string | null;
    status: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    delivered_at: string | null;
  }[];
}

/** Which destinations are wired up — surfaced on the admin settings page. */
export function integrationStatus(): { name: string; configured: boolean }[] {
  return DESTINATIONS.map((d) => ({ name: d.name, configured: d.enabled() }));
}
