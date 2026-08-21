/**
 * Create an admin user.
 *   npm run admin:create -- you@example.com "Your Name" [password]
 *
 * With no password argument a strong one is generated and printed once.
 * There is no public sign-up route — this script is the only way in.
 */
import crypto from "node:crypto";
import { getDb } from "../src/lib/db.ts";
import { hashPassword } from "../src/lib/password.ts";

const [email, name, providedPassword] = process.argv.slice(2);

if (!email || !name) {
  console.error('Usage: npm run admin:create -- <email> "<name>" [password]');
  process.exit(1);
}

if (providedPassword && providedPassword.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const password = providedPassword ?? crypto.randomBytes(15).toString("base64url");
const db = getDb();

const existing = db
  .prepare("SELECT id FROM admin_users WHERE email = ?")
  .get(email.toLowerCase()) as { id: number } | undefined;

if (existing) {
  db.prepare("UPDATE admin_users SET password_hash = ?, name = ?, is_active = 1 WHERE id = ?").run(
    hashPassword(password),
    name,
    existing.id,
  );
  console.log(`Updated admin: ${email}`);
} else {
  db.prepare(
    "INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')",
  ).run(email.toLowerCase(), name, hashPassword(password));
  console.log(`Created admin: ${email}`);
}

if (!providedPassword) {
  console.log(`\nPassword (shown once — store it in your password manager):\n\n  ${password}\n`);
}
