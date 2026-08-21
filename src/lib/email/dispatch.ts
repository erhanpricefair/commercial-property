import "server-only";
import { dueCommunications, markCommunication } from "../repositories/activity";
import { getDb } from "../db";
import { SITE } from "../site";

/**
 * Drains the queued email in `communications` through whichever provider is
 * configured. Provider-agnostic by design: add a case here and nothing else in
 * the platform changes.
 *
 *   EMAIL_PROVIDER=resend    RESEND_API_KEY, EMAIL_FROM
 *   EMAIL_PROVIDER=postmark  POSTMARK_TOKEN, EMAIL_FROM
 *   EMAIL_PROVIDER=smtp2go   SMTP2GO_API_KEY, EMAIL_FROM
 *   EMAIL_PROVIDER=webhook   EMAIL_WEBHOOK_URL   (send it yourself)
 *   EMAIL_PROVIDER=log       write to stdout only (default — nothing is sent)
 *
 * Run it from cron, a scheduled function, or `npm run email:dispatch`.
 */

export type DispatchResult = { attempted: number; sent: number; failed: number };

export async function dispatchDueEmails(limit = 25): Promise<DispatchResult> {
  const provider = (process.env.EMAIL_PROVIDER ?? "log").toLowerCase();
  const from = process.env.EMAIL_FROM ?? `${SITE.name} <no-reply@example.com.au>`;
  const queue = dueCommunications(limit).filter((c) => c.channel === "email");

  const result: DispatchResult = { attempted: queue.length, sent: 0, failed: 0 };

  for (const message of queue) {
    const to = recipientFor(message.investor_id);
    if (!to) {
      markCommunication(message.id, "failed", { error: "No recipient address" });
      result.failed++;
      continue;
    }

    try {
      await send(provider, {
        from,
        to,
        subject: message.subject ?? "",
        body: message.body ?? "",
      });
      markCommunication(message.id, "sent", { provider });
      result.sent++;
    } catch (error) {
      markCommunication(message.id, "failed", {
        provider,
        error: error instanceof Error ? error.message : String(error),
      });
      result.failed++;
    }
  }

  return result;
}

type Message = { from: string; to: string; subject: string; body: string };

async function send(provider: string, message: Message): Promise<void> {
  switch (provider) {
    case "resend":
      await post("https://api.resend.com/emails", {
        Authorization: `Bearer ${required("RESEND_API_KEY")}`,
      }, {
        from: message.from,
        to: [message.to],
        subject: message.subject,
        text: message.body,
      });
      return;

    case "postmark":
      await post("https://api.postmarkapp.com/email", {
        "X-Postmark-Server-Token": required("POSTMARK_TOKEN"),
        Accept: "application/json",
      }, {
        From: message.from,
        To: message.to,
        Subject: message.subject,
        TextBody: message.body,
        MessageStream: process.env.POSTMARK_STREAM ?? "outbound",
      });
      return;

    case "smtp2go":
      await post("https://api.smtp2go.com/v3/email/send", {}, {
        api_key: required("SMTP2GO_API_KEY"),
        sender: message.from,
        to: [message.to],
        subject: message.subject,
        text_body: message.body,
      });
      return;

    case "webhook":
      await post(required("EMAIL_WEBHOOK_URL"), {}, message);
      return;

    case "log":
    default:
      console.log(
        `\n--- EMAIL (not sent: EMAIL_PROVIDER is "${provider}") ---\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.body}\n---\n`,
      );
      return;
  }
}

function recipientFor(investorId: number): string | null {
  const row = getDb()
    .prepare("SELECT email FROM investors WHERE id = ?")
    .get(investorId) as { email: string } | undefined;
  return row?.email ?? null;
}

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`${response.status} ${response.statusText} ${detail.slice(0, 200)}`.trim());
    }
  } finally {
    clearTimeout(timeout);
  }
}
