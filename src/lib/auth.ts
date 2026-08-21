import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { decoyHash, hashPassword, verifyPassword } from "./password";

export { hashPassword, verifyPassword };

/**
 * Admin authentication.
 *
 * Passwords are hashed with scrypt (no native dependency, memory-hard) and
 * sessions are opaque random tokens stored server-side, so a stolen cookie can
 * be revoked by deleting the row. There is no public sign-up: admin accounts
 * are created by the `admin:create` script.
 */

export const SESSION_COOKIE = "cp_admin_session";
const SESSION_TTL_HOURS = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12);

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type AdminRow = AdminUser & { password_hash: string; is_active: number };

/**
 * Verify credentials and open a session. Returns null on any failure — the
 * caller must not distinguish "no such user" from "wrong password".
 */
export function login(
  email: string,
  password: string,
  meta: { userAgent?: string; ip?: string } = {},
): { token: string; user: AdminUser; expiresAt: Date } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, email, name, role, password_hash, is_active FROM admin_users WHERE email = ?")
    .get(email.trim().toLowerCase()) as AdminRow | undefined;

  if (!row || row.is_active !== 1) {
    // Equalise timing between "unknown user" and "wrong password".
    decoyHash(password);
    return null;
  }
  if (!verifyPassword(password, row.password_hash)) return null;

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);

  db.prepare(
    `INSERT INTO admin_sessions (id, user_id, expires_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(token, row.id, expiresAt.toISOString(), meta.userAgent ?? null, meta.ip ?? null);

  db.prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);

  return { token, user: { id: row.id, email: row.email, name: row.name, role: row.role }, expiresAt };
}

export function resolveSession(token: string | undefined | null): AdminUser | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role
         FROM admin_sessions s
         JOIN admin_users u ON u.id = s.user_id
        WHERE s.id = ?
          AND u.is_active = 1
          AND s.expires_at > datetime('now')`,
    )
    .get(token) as AdminUser | undefined;
  return row ?? null;
}

export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  getDb().prepare("DELETE FROM admin_sessions WHERE id = ?").run(token);
}

/** Housekeeping — safe to call on any admin request. */
export function purgeExpiredSessions(): void {
  getDb().prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')").run();
}

/** Current admin for a server component / route handler, or null. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const store = await cookies();
  return resolveSession(store.get(SESSION_COOKIE)?.value);
}

/**
 * Guard for every admin-only server component and route handler.
 * Throws rather than returning null so a forgotten check cannot silently
 * render private data.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Admin authentication required");
    this.name = "UnauthorizedError";
  }
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}
