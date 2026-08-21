import crypto from "node:crypto";

/**
 * Password hashing, kept free of any Next.js import so CLI scripts (which have
 * no request context) can create admin accounts without pulling in the runtime.
 *
 * scrypt is memory-hard and ships with Node, so there is no native dependency
 * to compile and no third-party crypto library to keep patched.
 */

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, digest] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(digest, "hex");
  if (expected.length !== derived.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

/** Burn equivalent CPU when a user isn't found, so timing doesn't reveal it. */
export function decoyHash(password: string): void {
  crypto.scryptSync(password, "decoy-salt", SCRYPT_KEYLEN);
}
