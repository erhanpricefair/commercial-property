import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Data access is deliberately funnelled through this single module so that the
 * private opportunity tables can never be reached from a public code path by
 * accident — every read of `opportunities` lives in a repository that is only
 * imported by admin-guarded server code.
 *
 * SQLite is the default because it needs no external service to run. The
 * schema is plain SQL and portable: to move to Postgres, swap this driver and
 * the repository implementations; nothing else in the app talks to the DB.
 */

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "platform.db");

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (instance) return instance;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  instance = db;
  return db;
}

/** Schema is created idempotently on first connection. */
export function migrate(db: Database.Database): void {
  db.exec(`
    /* ---------------- Admin users + sessions ---------------- */

    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'admin',
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id            TEXT PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at    TEXT NOT NULL,
      user_agent    TEXT,
      ip            TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);

    /* ---------------- Investors (leads) ---------------- */

    CREATE TABLE IF NOT EXISTS investors (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      email           TEXT NOT NULL,
      mobile          TEXT NOT NULL,
      contact_method  TEXT NOT NULL DEFAULT 'email',
      notes_from_lead TEXT,
      lead_score      INTEGER NOT NULL DEFAULT 0,
      classification  TEXT NOT NULL DEFAULT 'NURTURE',
      status          TEXT NOT NULL DEFAULT 'new',
      source          TEXT,
      source_detail   TEXT,
      landing_page    TEXT,
      consent_marketing INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
      last_contact_at TEXT,
      next_followup_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_investors_email ON investors(email);
    CREATE INDEX IF NOT EXISTS idx_investors_status ON investors(status);
    CREATE INDEX IF NOT EXISTS idx_investors_classification ON investors(classification);
    CREATE INDEX IF NOT EXISTS idx_investors_created ON investors(created_at);
    CREATE INDEX IF NOT EXISTS idx_investors_score ON investors(lead_score);

    /* ---------------- Investor criteria ---------------- */

    CREATE TABLE IF NOT EXISTS investor_preferences (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id     INTEGER NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
      property_type   TEXT NOT NULL,
      budget          TEXT NOT NULL,
      location_scope  TEXT NOT NULL,
      location_free   TEXT,
      priorities      TEXT NOT NULL DEFAULT '[]',   -- JSON array
      finance_status  TEXT NOT NULL,
      timeframe       TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_prefs_investor ON investor_preferences(investor_id);
    CREATE INDEX IF NOT EXISTS idx_prefs_type ON investor_preferences(property_type);
    CREATE INDEX IF NOT EXISTS idx_prefs_budget ON investor_preferences(budget);
    CREATE INDEX IF NOT EXISTS idx_prefs_location ON investor_preferences(location_scope);

    /* ---------------- PRIVATE opportunity database ----------------
       Every row here is PRIVATE / INTERNAL. No public route, API handler,
       sitemap entry, feed or schema block may read from this table.
       Access is limited to admin-authenticated server code and to
       tokenised presentations that an admin explicitly issues.
    ---------------------------------------------------------------- */

    CREATE TABLE IF NOT EXISTS opportunities (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      reference           TEXT NOT NULL UNIQUE,      -- internal opportunity ID
      visibility          TEXT NOT NULL DEFAULT 'PRIVATE',
      property_type       TEXT NOT NULL,
      suburb              TEXT,
      state               TEXT,
      size_sqm            INTEGER,
      price               INTEGER,
      estimated_rental    INTEGER,
      outgoings           INTEGER,
      estimated_yield     REAL,
      completion_status   TEXT,
      availability        TEXT NOT NULL DEFAULT 'available',
      internal_notes      TEXT,
      source_channel      TEXT,                      -- channel partner (PRIVATE)
      developer           TEXT,                      -- PRIVATE
      development_name    TEXT,                      -- PRIVATE
      address             TEXT,                      -- PRIVATE
      lot_unit_number     TEXT,                      -- PRIVATE
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_opps_type ON opportunities(property_type);
    CREATE INDEX IF NOT EXISTS idx_opps_price ON opportunities(price);
    CREATE INDEX IF NOT EXISTS idx_opps_state ON opportunities(state);
    CREATE INDEX IF NOT EXISTS idx_opps_availability ON opportunities(availability);

    /* ---------------- Matching ---------------- */

    CREATE TABLE IF NOT EXISTS opportunity_matches (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id     INTEGER NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
      opportunity_id  INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      match_score     INTEGER NOT NULL DEFAULT 0,
      reasons         TEXT NOT NULL DEFAULT '[]',   -- JSON array
      computed_at     TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (investor_id, opportunity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_matches_investor ON opportunity_matches(investor_id);
    CREATE INDEX IF NOT EXISTS idx_matches_score ON opportunity_matches(match_score);

    /* ---------------- Private presentations (tokenised links) ------- */

    CREATE TABLE IF NOT EXISTS presentations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      token           TEXT NOT NULL UNIQUE,
      investor_id     INTEGER REFERENCES investors(id) ON DELETE SET NULL,
      opportunity_id  INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
      /* Author decides, per link, whether the identifying fields are released */
      disclose_identity INTEGER NOT NULL DEFAULT 0,
      intro_note      TEXT,
      created_by      INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at      TEXT,
      revoked_at      TEXT,
      view_count      INTEGER NOT NULL DEFAULT 0,
      last_viewed_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_presentations_investor ON presentations(investor_id);
    CREATE INDEX IF NOT EXISTS idx_presentations_opp ON presentations(opportunity_id);

    /* ---------------- Activity, notes, communications ---------------- */

    CREATE TABLE IF NOT EXISTS lead_activity (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id   INTEGER REFERENCES investors(id) ON DELETE CASCADE,
      event_type    TEXT NOT NULL,
      detail        TEXT,
      metadata      TEXT NOT NULL DEFAULT '{}',     -- JSON
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_activity_investor ON lead_activity(investor_id);
    CREATE INDEX IF NOT EXISTS idx_activity_type ON lead_activity(event_type);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON lead_activity(created_at);

    CREATE TABLE IF NOT EXISTS notes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id   INTEGER NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
      author_id     INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
      body          TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notes_investor ON notes(investor_id);

    CREATE TABLE IF NOT EXISTS communications (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      investor_id   INTEGER NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
      channel       TEXT NOT NULL,                  -- email | sms | phone | other
      direction     TEXT NOT NULL DEFAULT 'outbound',
      template_key  TEXT,
      subject       TEXT,
      body          TEXT,
      status        TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed | logged
      provider      TEXT,
      provider_ref  TEXT,
      error         TEXT,
      scheduled_for TEXT,
      sent_at       TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_comms_investor ON communications(investor_id);
    CREATE INDEX IF NOT EXISTS idx_comms_status ON communications(status);
    CREATE INDEX IF NOT EXISTS idx_comms_scheduled ON communications(scheduled_for);

    /* ---------------- Editable email templates ---------------- */

    CREATE TABLE IF NOT EXISTS email_templates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      key           TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      subject       TEXT NOT NULL,
      body          TEXT NOT NULL,
      delay_hours   INTEGER NOT NULL DEFAULT 0,
      is_active     INTEGER NOT NULL DEFAULT 1,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    /* ---------------- Outbound integration queue ----------------
       Provider-agnostic. Each row is one delivery attempt to whatever
       destination is configured (webhook, Zapier, Make, HubSpot, Sheets).
    ------------------------------------------------------------- */

    CREATE TABLE IF NOT EXISTS integration_events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type    TEXT NOT NULL,
      payload       TEXT NOT NULL,                  -- JSON
      destination   TEXT,
      status        TEXT NOT NULL DEFAULT 'pending',
      attempts      INTEGER NOT NULL DEFAULT 0,
      last_error    TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      delivered_at  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_integration_status ON integration_events(status);
  `);
}

/** Test/CLI helper: build an in-memory database with the full schema. */
export function createInMemoryDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function nowIso(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}
