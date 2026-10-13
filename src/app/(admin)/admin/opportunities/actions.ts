"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/repositories/activity";
import { isReleaseLevel } from "@/lib/release";
import { nowIso } from "@/lib/db";
import {
  getOpportunity,
  computeYield,
  createOpportunity,
  deleteOpportunity,
  updateOpportunity,
  recomputeAllMatches,
  type OpportunityInput,
} from "@/lib/repositories/opportunities";

/**
 * PRIVATE opportunity mutations. Admin session required on every call.
 *
 * There is no public counterpart to any of these — the opportunity table has
 * no public write path and no public read path.
 */

function readForm(formData: FormData): OpportunityInput {
  const num = (key: string): number | null => {
    const raw = String(formData.get(key) ?? "").replace(/[^0-9.-]/g, "");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  };
  const str = (key: string): string | null => {
    const value = String(formData.get(key) ?? "").trim();
    return value || null;
  };

  const price = num("price");
  const rental = num("estimated_rental");
  const outgoings = num("outgoings");
  const explicitYield = String(formData.get("estimated_yield") ?? "").trim();

  return {
    reference: str("reference") ?? `OPP-${Date.now()}`,
    visibility: "PRIVATE",
    property_type: String(formData.get("property_type") ?? "warehouse"),
    suburb: str("suburb"),
    state: str("state"),
    size_sqm: num("size_sqm"),
    price,
    estimated_rental: rental,
    outgoings,
    estimated_yield: explicitYield ? Number(explicitYield) : computeYield(price, rental, outgoings),
    completion_status: str("completion_status"),
    availability: String(formData.get("availability") ?? "available"),
    internal_notes: str("internal_notes"),
    source_channel: str("source_channel"),
    developer: str("developer"),
    development_name: str("development_name"),
    address: str("address"),
    lot_unit_number: str("lot_unit_number"),
    release_approval: isReleaseLevel(formData.get("release_approval"))
      ? String(formData.get("release_approval"))
      : "none",
    release_approved_by: str("release_approved_by"),
    release_approval_ref: str("release_approval_ref"),
    release_approval_expires: /^\d{4}-\d{2}-\d{2}$/.test(String(formData.get("release_approval_expires") ?? ""))
      ? String(formData.get("release_approval_expires"))
      : null,
  };
}

/**
 * Stamp who recorded an approval change, and keep a trail of it. The audit
 * trail is what answers "who said we could send this?" months later.
 */
function stampRelease(
  input: OpportunityInput,
  previous: OpportunityInput | null,
  admin: { id: number; email: string },
  reference: string,
): OpportunityInput {
  const changed =
    !previous ||
    previous.release_approval !== input.release_approval ||
    (previous.release_approved_by ?? null) !== (input.release_approved_by ?? null) ||
    (previous.release_approval_ref ?? null) !== (input.release_approval_ref ?? null) ||
    (previous.release_approval_expires ?? null) !== (input.release_approval_expires ?? null);
  if (!changed) return input;
  if (previous || input.release_approval !== "none") {
    logActivity(null, "release_approval_changed", `${reference}: release approval set to ${input.release_approval}`, {
      by: admin.email,
      from: previous?.release_approval ?? null,
      to: input.release_approval,
      approvedBy: input.release_approved_by ?? null,
      evidence: input.release_approval_ref ?? null,
      expires: input.release_approval_expires ?? null,
    });
  }
  return { ...input, release_recorded_at: nowIso(), release_recorded_by: admin.id };
}

export async function createOpportunityAction(formData: FormData) {
  const admin = await requireAdmin();
  const input = readForm(formData);
  const id = createOpportunity(stampRelease(input, null, admin, input.reference));
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin");
  redirect(`/admin/opportunities/${id}`);
}

export async function updateOpportunityAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const previous = getOpportunity(id);
  if (!previous) return;
  const input = readForm(formData);
  updateOpportunity(id, stampRelease(input, previous, admin, input.reference));
  revalidatePath(`/admin/opportunities/${id}`);
  revalidatePath("/admin/opportunities");
}

export async function deleteOpportunityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  deleteOpportunity(id);
  revalidatePath("/admin/opportunities");
  redirect("/admin/opportunities");
}

/** Re-run matching for every investor — use after a bulk import. */
export async function recomputeAllMatchesAction() {
  await requireAdmin();
  recomputeAllMatches();
  revalidatePath("/admin");
  revalidatePath("/admin/opportunities");
}
