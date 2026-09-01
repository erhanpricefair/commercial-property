import "server-only";
import { SITE } from "./site";
import { labelFor } from "./taxonomy";
import type { LeadInput } from "./validation";

/**
 * Instant owner alert on a high-value registration.
 *
 * This is deliberately NOT queued through `communications` like the investor
 * follow-up sequence. That queue is drained by a scheduled job, which is fine
 * for a nurture email and useless for a HOT lead — the whole value of the
 * alert is that it arrives while the investor is still at their desk.
 *
 * Speed of first contact is the single largest controllable factor in whether
 * a lead converts. An alert that arrives an hour late has lost most of its
 * worth, so this sends inline, on a short timeout, and never blocks or fails
 * the registration if the provider is down.
 */

export type HotLeadAlert = {
  investorId: number;
  input: LeadInput;
  classification: string;
  matchCount: number;
};

export async function notifyOwnerOfHotLead(alert: HotLeadAlert): Promise<void> {
  const recipients = (process.env.OWNER_ALERT_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  const webhook = process.env.OWNER_ALERT_WEBHOOK;
  if (!recipients.length && !webhook) return;

  const { input, matchCount, classification, investorId } = alert;
  const name = `${input.firstName} ${input.lastName}`.trim();
  const adminUrl = `${SITE.url}/admin/investors/${investorId}`;

  const summary = [
    `${labelFor("propertyType", input.propertyType)} · ${labelFor("budget", input.budget)}`,
    `${labelFor("location", input.locationScope)}${input.locationFree ? ` (${input.locationFree})` : ""}`,
    `${labelFor("finance", input.financeStatus)} · ${labelFor("timeframe", input.timeframe)}`,
  ].join("\n");

  const subject = `${classification} lead: ${name} — ${labelFor("budget", input.budget)}, ${labelFor("timeframe", input.timeframe)}`;

  const body = `${name} just registered.

${summary}

Prefers ${labelFor("contactMethod", input.contactMethod)}
Mobile: ${input.mobile}
Email:  ${input.email}
${input.message ? `\nThey said: "${input.message}"\n` : ""}
Potential matches: ${matchCount}

Call now: tel:${input.mobile.replace(/\s+/g, "")}
Open in admin: ${adminUrl}

— Sent immediately because this lead scored ${classification}.`;

  await Promise.all([
    ...recipients.map((to) => sendAlertEmail(to, subject, body)),
    webhook ? postWebhook(webhook, { subject, body, alert: { ...alert, input: undefined } }) : null,
  ].filter(Boolean) as Promise<void>[]).catch(() => undefined);
}

/**
 * Sends through whichever provider is configured, reusing the same env vars as
 * the follow-up dispatcher so there is only one thing to set up.
 */
async function sendAlertEmail(to: string, subject: string, body: string): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER ?? "log").toLowerCase();
  const from = process.env.EMAIL_FROM ?? `${SITE.name} <no-reply@example.com.au>`;

  try {
    switch (provider) {
      case "resend":
        await post("https://api.resend.com/emails", {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        }, { from, to: [to], subject, text: body });
        return;
      case "postmark":
        await post("https://api.postmarkapp.com/email", {
          "X-Postmark-Server-Token": process.env.POSTMARK_TOKEN ?? "",
          Accept: "application/json",
        }, {
          From: from,
          To: to,
          Subject: subject,
          TextBody: body,
          MessageStream: process.env.POSTMARK_STREAM ?? "outbound",
        });
        return;
      case "smtp2go":
        await post("https://api.smtp2go.com/v3/email/send", {}, {
          api_key: process.env.SMTP2GO_API_KEY,
          sender: from,
          to: [to],
          subject,
          text_body: body,
        });
        return;
      case "webhook":
        if (process.env.EMAIL_WEBHOOK_URL) {
          await post(process.env.EMAIL_WEBHOOK_URL, {}, { from, to, subject, body });
        }
        return;
      default:
        console.log(`\n=== HOT LEAD ALERT (EMAIL_PROVIDER not set) ===\nTo: ${to}\n${subject}\n\n${body}\n`);
    }
  } catch {
    // An alert that fails must never surface to the visitor or lose the lead.
  }
}

async function postWebhook(url: string, payload: unknown): Promise<void> {
  try {
    await post(url, {}, payload);
  } catch {
    /* ignore */
  }
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const controller = new AbortController();
  // Short: the visitor is waiting on the response behind this.
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  } finally {
    clearTimeout(timeout);
  }
}
