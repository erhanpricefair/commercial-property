import "server-only";
import { getDb } from "../db";

export type ActivityRow = {
  id: number;
  investor_id: number | null;
  event_type: string;
  detail: string | null;
  metadata: string;
  created_at: string;
};

export function logActivity(
  investorId: number | null,
  eventType: string,
  detail?: string | null,
  metadata: Record<string, unknown> = {},
): void {
  getDb()
    .prepare(
      "INSERT INTO lead_activity (investor_id, event_type, detail, metadata) VALUES (?, ?, ?, ?)",
    )
    .run(investorId, eventType, detail ?? null, JSON.stringify(metadata));
}

export function listActivity(investorId: number, limit = 100): ActivityRow[] {
  return getDb()
    .prepare("SELECT * FROM lead_activity WHERE investor_id = ? ORDER BY created_at DESC, id DESC LIMIT ?")
    .all(investorId, limit) as ActivityRow[];
}

/* ---------------- Notes ---------------- */

export type NoteRow = {
  id: number;
  investor_id: number;
  author_id: number | null;
  body: string;
  created_at: string;
  author_name: string | null;
};

export function addNote(investorId: number, body: string, authorId: number | null): void {
  getDb()
    .prepare("INSERT INTO notes (investor_id, author_id, body) VALUES (?, ?, ?)")
    .run(investorId, authorId, body);
}

export function listNotes(investorId: number): NoteRow[] {
  return getDb()
    .prepare(
      `SELECT n.*, u.name AS author_name
         FROM notes n LEFT JOIN admin_users u ON u.id = n.author_id
        WHERE n.investor_id = ?
        ORDER BY n.created_at DESC, n.id DESC`,
    )
    .all(investorId) as NoteRow[];
}

export function deleteNote(id: number): void {
  getDb().prepare("DELETE FROM notes WHERE id = ?").run(id);
}

/* ---------------- Communications ---------------- */

export type CommunicationRow = {
  id: number;
  investor_id: number;
  channel: string;
  direction: string;
  template_key: string | null;
  subject: string | null;
  body: string | null;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  error: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
};

export function queueCommunication(input: {
  investorId: number;
  channel: string;
  direction?: "outbound" | "inbound";
  templateKey?: string | null;
  subject?: string | null;
  body?: string | null;
  scheduledFor?: string | null;
  status?: string;
  provider?: string | null;
}): number {
  const result = getDb()
    .prepare(
      `INSERT INTO communications
         (investor_id, channel, direction, template_key, subject, body, scheduled_for, status, provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.investorId,
      input.channel,
      input.direction ?? "outbound",
      input.templateKey ?? null,
      input.subject ?? null,
      input.body ?? null,
      input.scheduledFor ?? null,
      input.status ?? "queued",
      input.provider ?? null,
    );
  return Number(result.lastInsertRowid);
}

export function markCommunication(
  id: number,
  status: string,
  fields: { provider?: string; providerRef?: string; error?: string } = {},
): void {
  getDb()
    .prepare(
      `UPDATE communications
          SET status = ?, provider = COALESCE(?, provider), provider_ref = COALESCE(?, provider_ref),
              error = ?, sent_at = CASE WHEN ? = 'sent' THEN datetime('now') ELSE sent_at END
        WHERE id = ?`,
    )
    .run(status, fields.provider ?? null, fields.providerRef ?? null, fields.error ?? null, status, id);
}

export function listCommunications(investorId: number): CommunicationRow[] {
  return getDb()
    .prepare("SELECT * FROM communications WHERE investor_id = ? ORDER BY created_at DESC, id DESC")
    .all(investorId) as CommunicationRow[];
}

/** Messages whose scheduled send time has arrived. Drained by the dispatcher. */
export function dueCommunications(limit = 50): CommunicationRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM communications
        WHERE status = 'queued'
          AND (scheduled_for IS NULL OR scheduled_for <= datetime('now'))
        ORDER BY id ASC LIMIT ?`,
    )
    .all(limit) as CommunicationRow[];
}
