"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/repositories/deals";

export async function saveRevenueSettingsAction(formData: FormData) {
  await requireAdmin();

  const target = String(formData.get("revenue_target") ?? "").replace(/[^0-9]/g, "");
  const rate = String(formData.get("commission_rate") ?? "").replace(/[^0-9.]/g, "");
  const date = String(formData.get("target_date") ?? "").trim();
  const conversion = String(formData.get("assumed_conversion_rate") ?? "").replace(/[^0-9.]/g, "");

  if (target) setSetting("revenue_target", target);
  if (rate) setSetting("commission_rate", rate);
  setSetting("target_date", date);
  if (conversion) setSetting("assumed_conversion_rate", conversion);

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
