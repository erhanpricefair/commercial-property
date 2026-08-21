import "server-only";
import { getDb } from "../db";
import { queueCommunication } from "../repositories/activity";
import { EMAIL_TEMPLATE_SEEDS, renderTemplate } from "./templates";
import { SITE } from "../site";

export type EmailTemplateRow = {
  id: number;
  key: string;
  name: string;
  subject: string;
  body: string;
  delay_hours: number;
  is_active: number;
  updated_at: string;
};

/** Idempotent — inserts any seed template that isn't in the table yet. */
export function ensureEmailTemplates(): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO email_templates (key, name, subject, body, delay_hours)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const run = db.transaction(() => {
    for (const t of EMAIL_TEMPLATE_SEEDS) {
      insert.run(t.key, t.name, t.subject, t.body, t.delayHours);
    }
  });
  run();
}

export function listEmailTemplates(): EmailTemplateRow[] {
  ensureEmailTemplates();
  return getDb().prepare("SELECT * FROM email_templates ORDER BY delay_hours, id").all() as EmailTemplateRow[];
}

export function getEmailTemplate(key: string): EmailTemplateRow | null {
  ensureEmailTemplates();
  return (
    (getDb().prepare("SELECT * FROM email_templates WHERE key = ?").get(key) as
      | EmailTemplateRow
      | undefined) ?? null
  );
}

export function updateEmailTemplate(
  key: string,
  fields: { name?: string; subject?: string; body?: string; delay_hours?: number; is_active?: number },
): void {
  const db = getDb();
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!entries.length) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(", ");
  db.prepare(`UPDATE email_templates SET ${sets}, updated_at = datetime('now') WHERE key = ?`).run(
    ...entries.map(([, v]) => v),
    key,
  );
}

export type MergeVars = Record<string, string | null | undefined>;

/**
 * Queue the whole registration sequence. Nothing is sent inline — messages are
 * written to `communications` with a scheduled time and drained by whatever
 * provider is configured (see `src/lib/integrations`). That keeps the request
 * fast and makes the platform provider-agnostic.
 */
export function queueRegistrationSequence(investorId: number, vars: MergeVars): void {
  ensureEmailTemplates();
  const templates = getDb()
    .prepare(
      `SELECT * FROM email_templates
        WHERE key IN ('investor_welcome','investor_education','investor_invitation')
          AND is_active = 1
        ORDER BY delay_hours`,
    )
    .all() as EmailTemplateRow[];

  for (const t of templates) {
    queueCommunication({
      investorId,
      channel: "email",
      templateKey: t.key,
      subject: renderTemplate(t.subject, vars),
      body: renderTemplate(t.body, vars),
      scheduledFor: scheduledFor(t.delay_hours),
    });
  }
}

export function queueSingleEmail(investorId: number, key: string, vars: MergeVars): boolean {
  const t = getEmailTemplate(key);
  if (!t || t.is_active !== 1) return false;
  queueCommunication({
    investorId,
    channel: "email",
    templateKey: t.key,
    subject: renderTemplate(t.subject, vars),
    body: renderTemplate(t.body, vars),
    scheduledFor: scheduledFor(t.delay_hours),
  });
  return true;
}

export function baseMergeVars(): MergeVars {
  return { siteName: SITE.name, siteUrl: SITE.url };
}

function scheduledFor(delayHours: number): string {
  return new Date(Date.now() + delayHours * 3600_000).toISOString().replace("T", " ").slice(0, 19);
}
