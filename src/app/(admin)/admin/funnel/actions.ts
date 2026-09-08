"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { deletePartial, purgeOldPartials } from "@/lib/repositories/funnel";

export async function deletePartialAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  deletePartial(id);
  revalidatePath("/admin/funnel");
  revalidatePath("/admin");
}

export async function purgePartialsAction() {
  await requireAdmin();
  purgeOldPartials(90);
  revalidatePath("/admin/funnel");
}
