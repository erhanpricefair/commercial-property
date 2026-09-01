"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateInvestorStatus, updateInvestorFields } from "@/lib/repositories/investors";
import { logActivity } from "@/lib/repositories/activity";
import type { LeadStatus } from "@/lib/taxonomy";

/**
 * One-tap outcomes for the call console.
 *
 * Designed to be usable with a thumb, between calls, without opening the full
 * investor record — the friction of logging an outcome is what stops people
 * doing it, and an unlogged call is a call you'll make twice.
 */
export async function logCallOutcomeAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const outcome = String(formData.get("outcome") ?? "");
  if (!investorId || !outcome) return;

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");

  const OUTCOMES: Record<string, { status?: LeadStatus; followUpDays: number | null; detail: string }> = {
    reached: { status: "contacted", followUpDays: 3, detail: "Spoke with investor" },
    qualified: { status: "qualified", followUpDays: 2, detail: "Qualified on a call" },
    no_answer: { followUpDays: 1, detail: "No answer" },
    callback: { followUpDays: 1, detail: "Call back requested" },
    not_suitable: { status: "not_suitable", followUpDays: null, detail: "Not suitable" },
    nurture: { status: "nurture", followUpDays: 30, detail: "Moved to nurture" },
  };

  const result = OUTCOMES[outcome];
  if (!result) return;

  if (result.status) updateInvestorStatus(investorId, result.status);

  updateInvestorFields(investorId, {
    last_contact_at: now,
    next_followup_at:
      result.followUpDays === null
        ? null
        : new Date(Date.now() + result.followUpDays * 86400_000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
  });

  logActivity(investorId, "call_logged", result.detail, { by: admin.email, outcome });

  revalidatePath("/admin/today");
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
}
