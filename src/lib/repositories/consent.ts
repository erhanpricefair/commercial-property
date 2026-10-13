import "server-only";
import crypto from "node:crypto";
import { getDb, nowIso } from "../db";
import { logActivity } from "./activity";

/**
 * Marketing consent and unsubscribe.
 *
 * Two kinds of email leave this platform:
 *
 *   - TRANSACTIONAL — a direct response to something the person just did:
 *     confirming a registration, delivering a guide they asked for. Sent
 *     regardless of the marketing tick-box.
 *   - MARKETING — anything else: the nurture sequence, an invitation to talk,
 *     any template an admin sends by hand. Only sent to someone who ticked
 *     the consent box and has not unsubscribed.
 *
 * Unknown template keys are treated as marketing. A new template someone adds
 * in the admin has to be opted in to the transactional list deliberately,
 * rather than slipping past consent by default.
 *
 * Whether any particular message is a "commercial electronic message" under
 * the Spam Act 2003 is a legal question; this split is the conservative
 * reading, and the classification should be confirmed by a legal adviser.
 */

export const TRANSACTIONAL_TEMPLATES = new Set(["investor_welcome", "guide_delivery"]);

export function isMarketingTemplate(key: string | null | undefined): boolean {
  // Logged and inbound rows have no template; they are never sent.
  if (!key) return false;
  return !TRANSACTIONAL_TEMPLATES.has(key);
}

export type ConsentState = {
  consentMarketing: boolean;
  unsubscribedAt: string | null;
};

export function consentFor(investorId: number): ConsentState | null {
  const row = getDb()
    .prepare("SELECT consent_marketing, unsubscribed_at FROM investors WHERE id = ?")
    .get(investorId) as { consent_marketing: number; unsubscribed_at: string | null } | undefined;
  if (!row) return null;
  return { consentMarketing: row.consent_marketing === 1, unsubscribedAt: row.unsubscribed_at };
}

/** May this investor be sent a marketing message right now? */
export function mayMarketTo(investorId: number): boolean {
  const state = consentFor(investorId);
  return Boolean(state && state.consentMarketing && !state.unsubscribedAt);
}

/** The investor's unsubscribe token, created on first use. */
export function unsubscribeTokenFor(investorId: number): string {
  const db = getDb();
  const row = db.prepare("SELECT unsubscribe_token FROM investors WHERE id = ?").get(investorId) as
    | { unsubscribe_token: string | null }
    | undefined;
  if (row?.unsubscribe_token) return row.unsubscribe_token;
  const token = crypto.randomBytes(24).toString("base64url");
  db.prepare("UPDATE investors SET unsubscribe_token = ? WHERE id = ? AND unsubscribe_token IS NULL").run(
    token,
    investorId,
  );
  // Re-read in case a concurrent call won.
  return (
    db.prepare("SELECT unsubscribe_token FROM investors WHERE id = ?").get(investorId) as {
      unsubscribe_token: string;
    }
  ).unsubscribe_token;
}

/**
 * Withdraw marketing consent for everyone sharing the token-holder's email
 * address, and cancel marketing email already queued for them.
 *
 * Keyed on email rather than one row: the same person may have arrived through
 * the guide, the contact form and the registration form, and "stop emailing
 * me" means all of them. Idempotent, and says nothing about whether the token
 * was valid — the caller answers the same way either way.
 */
export function unsubscribeByToken(token: string, via: "link" | "one_click"): boolean {
  if (!token || token.length > 128) return false;
  const db = getDb();
  const owner = db.prepare("SELECT id, email FROM investors WHERE unsubscribe_token = ?").get(token) as
    | { id: number; email: string }
    | undefined;
  if (!owner) return false;
  withdrawConsentForEmail(owner.email, via === "link" ? "Unsubscribed via email link" : "Unsubscribed (one-click)");
  return true;
}

/** Same effect, recorded by an admin — e.g. the person asked on the phone. */
export function withdrawConsentForEmail(email: string, detail: string, by?: string): number {
  const db = getDb();
  const ids = (
    db.prepare("SELECT id FROM investors WHERE email = ?").all(email.toLowerCase()) as { id: number }[]
  ).map((r) => r.id);
  if (!ids.length) return 0;

  const now = nowIso();
  const run = db.transaction(() => {
    for (const id of ids) {
      const already = (
        db.prepare("SELECT unsubscribed_at FROM investors WHERE id = ?").get(id) as {
          unsubscribed_at: string | null;
        }
      ).unsubscribed_at;
      db.prepare(
        `UPDATE investors
            SET consent_marketing = 0,
                unsubscribed_at = COALESCE(unsubscribed_at, ?),
                updated_at = datetime('now')
          WHERE id = ?`,
      ).run(now, id);

      const queued = db
        .prepare("SELECT id, template_key FROM communications WHERE investor_id = ? AND status = 'queued'")
        .all(id) as { id: number; template_key: string | null }[];
      for (const message of queued) {
        if (isMarketingTemplate(message.template_key)) {
          db.prepare(
            "UPDATE communications SET status = 'cancelled', error = 'Recipient unsubscribed' WHERE id = ?",
          ).run(message.id);
        }
      }

      if (!already) logActivity(id, "unsubscribed", detail, by ? { by } : {});
    }
  });
  run();
  return ids.length;
}

/**
 * Fresh, express consent — the person ticked the box on a new submission.
 * Clears an earlier unsubscribe, because the newer instruction wins.
 */
export function grantConsent(investorId: number): void {
  getDb()
    .prepare(
      "UPDATE investors SET consent_marketing = 1, unsubscribed_at = NULL, updated_at = datetime('now') WHERE id = ?",
    )
    .run(investorId);
}
