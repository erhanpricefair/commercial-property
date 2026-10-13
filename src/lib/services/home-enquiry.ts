import "server-only";
import { getDb } from "../db";
import { findInvestorByEmail } from "../repositories/investors";
import { logActivity } from "../repositories/activity";
import { grantConsent } from "../repositories/consent";
import { queueSingleEmail, baseMergeVars } from "../email";
import { dispatchLeadEvent } from "../integrations";
import { sendOwnerAlert } from "../alerts";
import { followUpWindowDays } from "../scoring";
import { SITE } from "../site";
import type { LeadClassification } from "../taxonomy";
import type { HomeEnquiryInput } from "../validation";
import {
  HOME_BUDGET_LABELS,
  HOME_PURPOSE_LABELS,
  HOME_TIMEFRAME_LABELS,
  HOME_TYPE_LABELS,
} from "../content/home-landing";

/**
 * A home-buyer enquiry from the landing page.
 *
 * Lands in the same `investors` table as every other lead, so it appears in
 * the admin list, the call list, the CSV export and the follow-up queue with
 * no extra screens. The buyer's criteria are written into the lead's notes as
 * readable text (the structured criteria columns are the commercial taxonomy).
 *
 * Touches no opportunity data, so the public route can call it directly.
 */

export type HomeEnquiryResult = {
  investorId: number;
  leadCategory: Lowercase<LeadClassification>;
};

/** Timing is the strongest signal on a short form: who to ring first. */
export function classifyHomeEnquiry(input: Pick<HomeEnquiryInput, "timeframe">): {
  classification: LeadClassification;
  score: number;
} {
  switch (input.timeframe) {
    case "asap":
      return { classification: "HOT", score: 80 };
    case "3_6_months":
      return { classification: "WARM", score: 50 };
    default:
      return { classification: "NURTURE", score: 20 };
  }
}

export function summariseHomeEnquiry(input: HomeEnquiryInput): string {
  return [
    `Looking for: ${HOME_TYPE_LABELS[input.homeType]}`,
    `Budget: ${HOME_BUDGET_LABELS[input.budget]}`,
    `Suburbs: ${input.suburbs || "Not specified"}`,
    `Timing: ${HOME_TIMEFRAME_LABELS[input.timeframe]}`,
    `Buying: ${HOME_PURPOSE_LABELS[input.purpose]}`,
  ].join("\n");
}

export function registerHomeEnquiry(input: HomeEnquiryInput): HomeEnquiryResult {
  const db = getDb();
  const { classification, score } = classifyHomeEnquiry(input);
  const summary = summariseHomeEnquiry(input);
  const followUp = `+${followUpWindowDays(classification)} days`;
  const existing = findInvestorByEmail(input.email);

  let investorId: number;
  if (existing) {
    // Same person again: refresh their details on the existing lead rather
    // than creating a second one for someone else to call.
    investorId = existing.id;
    db.prepare(
      `UPDATE investors
          SET first_name = ?, last_name = COALESCE(NULLIF(?, ''), last_name), mobile = ?,
              notes_from_lead = CASE
                WHEN notes_from_lead IS NULL OR notes_from_lead = '' THEN ?
                ELSE notes_from_lead || char(10) || '---' || char(10) || ? END,
              lead_score = MAX(lead_score, ?),
              classification = CASE WHEN ? > lead_score THEN ? ELSE classification END,
              status = CASE WHEN status IN ('nurture','not_suitable') THEN 'new' ELSE status END,
              next_followup_at = CASE
                WHEN next_followup_at IS NULL OR next_followup_at > datetime('now', ?)
                THEN datetime('now', ?) ELSE next_followup_at END,
              updated_at = datetime('now')
        WHERE id = ?`,
    ).run(
      input.firstName,
      input.lastName ?? "",
      input.mobile,
      summary,
      summary,
      score,
      score,
      classification,
      followUp,
      followUp,
      investorId,
    );
    if (input.consentMarketing) grantConsent(investorId);
  } else {
    investorId = Number(
      db
        .prepare(
          `INSERT INTO investors
             (first_name, last_name, email, mobile, contact_method, notes_from_lead,
              lead_score, classification, status, source, source_detail, landing_page,
              utm_source, utm_medium, utm_campaign, utm_content, utm_term, click_id, referrer,
              consent_marketing, next_followup_at)
           VALUES (?, ?, ?, ?, 'phone', ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`,
        )
        .run(
          input.firstName,
          input.lastName ?? "",
          input.email,
          input.mobile,
          summary,
          score,
          classification,
          input.source ?? "home_landing",
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
          followUp,
        ).lastInsertRowid,
    );
  }

  logActivity(
    investorId,
    "home_enquiry",
    existing ? "Sent another home-buyer enquiry" : "Home-buyer enquiry from the landing page",
    {
      returning: Boolean(existing),
      source: input.source ?? "home_landing",
      utmCampaign: input.utmCampaign || null,
      timeframe: input.timeframe,
      budget: input.budget,
    },
  );

  try {
    queueSingleEmail(investorId, "home_enquiry_received", {
      ...baseMergeVars(),
      firstName: input.firstName,
      summary,
    });
  } catch {
    // A template problem must never lose the lead.
  }

  if (classification === "HOT") {
    const name = `${input.firstName} ${input.lastName ?? ""}`.trim();
    void sendOwnerAlert(
      `HOT home buyer: ${name} — ${HOME_BUDGET_LABELS[input.budget]}, ${HOME_TIMEFRAME_LABELS[input.timeframe]}`,
      `${name} just enquired.\n\n${summary}\n\nMobile: ${input.mobile}\nEmail:  ${input.email}\n\nCall now: tel:${input.mobile.replace(/\s+/g, "")}\nOpen in admin: ${SITE.url}/admin/investors/${investorId}`,
    ).catch(() => undefined);
  }

  void dispatchLeadEvent({
    event: "home_enquiry",
    investor: {
      id: investorId,
      firstName: input.firstName,
      lastName: input.lastName ?? "",
      email: input.email,
      mobile: input.mobile,
      contactMethod: "phone",
      message: summary,
      consentMarketing: Boolean(input.consentMarketing),
    },
    internal: { leadScore: score, classification, matchCount: 0 },
    attribution: {
      source: input.source ?? "home_landing",
      sourceDetail: input.sourceDetail ?? null,
      landingPage: input.landingPage ?? null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      utmContent: input.utmContent || null,
      utmTerm: input.utmTerm || null,
      clickId: input.clickId || null,
    },
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  return { investorId, leadCategory: classification.toLowerCase() as Lowercase<LeadClassification> };
}
