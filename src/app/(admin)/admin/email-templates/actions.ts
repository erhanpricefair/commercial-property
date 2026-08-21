"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateEmailTemplate } from "@/lib/email";

export async function saveTemplateAction(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("key") ?? "");
  if (!key) return;

  updateEmailTemplate(key, {
    name: String(formData.get("name") ?? "").trim() || undefined,
    subject: String(formData.get("subject") ?? "").trim() || undefined,
    body: String(formData.get("body") ?? ""),
    delay_hours: Number(formData.get("delay_hours") ?? 0) || 0,
    is_active: formData.get("is_active") === "on" ? 1 : 0,
  });

  revalidatePath("/admin/email-templates");
}
