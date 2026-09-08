"use server";

import { redirect } from "next/navigation";
import { completeSetup, needsSetup } from "@/lib/setup";
import { checkRateLimit } from "@/lib/rate-limit";

export type SetupState = { error?: string };

export async function completeSetupAction(
  _prev: SetupState,
  formData: FormData,
): Promise<SetupState> {
  if (!needsSetup()) redirect("/admin/login");

  // Slows down anyone trying to brute-force a setup key.
  if (!checkRateLimit("admin-setup", { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return { error: "Too many attempts. Please wait a few minutes." };
  }

  const result = completeSetup({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    token: String(formData.get("token") ?? ""),
  });

  if (!result.ok) return { error: result.error };
  redirect("/admin/login?setup=done");
}
