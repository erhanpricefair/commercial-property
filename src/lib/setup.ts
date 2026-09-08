import "server-only";
import crypto from "node:crypto";
import { getDb } from "./db";
import { hashPassword } from "./password";

/**
 * First-run setup.
 *
 * Creating the first admin account used to require a terminal, which is a
 * silly thing to demand of the person who owns the business. This lets it
 * happen in a browser instead — but only ever when the platform has no admin
 * accounts at all.
 *
 * Security model, stated plainly:
 *
 *   - The check is server-side and runs on every request to the setup page and
 *     its action, so the page cannot be used once an account exists.
 *   - If ADMIN_SETUP_TOKEN is set, it must be supplied. That closes the window
 *     completely and is the recommended configuration.
 *   - If it is NOT set, setup is open until the first account is created.
 *     Between deploying and completing setup, anyone who guessed the URL could
 *     claim the account. In practice the window is a few minutes on a domain
 *     nobody has been told about — but it is a real window, and the page says
 *     so rather than pretending otherwise.
 */

export function needsSetup(): boolean {
  const { c } = getDb()
    .prepare("SELECT COUNT(*) AS c FROM admin_users WHERE is_active = 1")
    .get() as { c: number };
  return c === 0;
}

export function setupTokenRequired(): boolean {
  return Boolean(process.env.ADMIN_SETUP_TOKEN);
}

export type SetupResult =
  | { ok: true }
  | { ok: false; error: string };

export function completeSetup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  token?: string;
}): SetupResult {
  // Re-check inside the action: the page render and the submission are
  // separate requests, and an account could have been created in between.
  if (!needsSetup()) {
    return { ok: false, error: "An administrator account already exists. Sign in instead." };
  }

  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (expected) {
    const supplied = input.token ?? "";
    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, error: "That setup key doesn't match." };
    }
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (input.password.length < 12) {
    return { ok: false, error: "Use a password of at least 12 characters." };
  }
  if (input.password !== input.confirmPassword) {
    return { ok: false, error: "The two passwords don't match." };
  }

  getDb()
    .prepare("INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')")
    .run(email, name, hashPassword(input.password));

  return { ok: true };
}
