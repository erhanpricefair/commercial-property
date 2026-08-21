"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
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
  };
}

export async function createOpportunityAction(formData: FormData) {
  await requireAdmin();
  const id = createOpportunity(readForm(formData));
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin");
  redirect(`/admin/opportunities/${id}`);
}

export async function updateOpportunityAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  updateOpportunity(id, readForm(formData));
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
