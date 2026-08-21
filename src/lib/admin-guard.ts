import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin, type AdminUser } from "./auth";

/**
 * Page-level guard.
 *
 * Every admin server component calls this before reading anything private.
 * It is independent of `middleware.ts`: the middleware only checks that a
 * cookie exists, while this validates the session against the database. Both
 * layers must pass, and this one is the authoritative check.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
