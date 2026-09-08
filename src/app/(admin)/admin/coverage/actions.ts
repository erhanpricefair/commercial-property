"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createCoverage,
  updateCoverage,
  deleteCoverage,
  confirmCoverage,
  seedStarterCoverage,
} from "@/lib/repositories/coverage";

function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function str(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

/**
 * Add coverage for one or many suburbs at once.
 *
 * Coverage is usually the same asset type and price band across several
 * suburbs in a precinct, so entering them one at a time is needless work.
 * Paste or type a comma- or newline-separated list and this creates one row
 * per suburb; leave it blank to record the area as a whole.
 */
export async function createCoverageAction(formData: FormData) {
  await requireAdmin();
  const propertyType = String(formData.get("propertyType") ?? "").trim();
  if (!propertyType) return;

  const suburbs = String(formData.get("suburbs") ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    // Same suburb twice in one paste shouldn't make two rows.
    .filter((s, i, all) => all.findIndex((o) => o.toLowerCase() === s.toLowerCase()) === i)
    .slice(0, 60);

  const base = {
    propertyType,
    region: str(formData, "region"),
    state: String(formData.get("state") ?? "VIC"),
    priceMin: num(formData, "priceMin"),
    priceMax: num(formData, "priceMax"),
    sizeMinSqm: num(formData, "sizeMinSqm"),
    sizeMaxSqm: num(formData, "sizeMaxSqm"),
    typicalCompletion: str(formData, "typicalCompletion"),
    frequency: String(formData.get("frequency") ?? "occasional"),
    notes: str(formData, "notes"),
  };

  if (suburbs.length === 0) {
    createCoverage({ ...base, suburb: null });
  } else {
    for (const suburb of suburbs) createCoverage({ ...base, suburb });
  }

  revalidatePath("/admin/coverage");
  revalidatePath("/admin");
}

export async function updateCoverageAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  updateCoverage(id, {
    propertyType: String(formData.get("propertyType") ?? "").trim() || undefined,
    suburb: str(formData, "suburb"),
    region: str(formData, "region"),
    state: String(formData.get("state") ?? "VIC"),
    priceMin: num(formData, "priceMin"),
    priceMax: num(formData, "priceMax"),
    frequency: String(formData.get("frequency") ?? "occasional"),
    notes: str(formData, "notes"),
    isActive: formData.get("isActive") === "on",
  });

  revalidatePath("/admin/coverage");
  revalidatePath("/admin");
}

export async function confirmCoverageAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  confirmCoverage(id);
  revalidatePath("/admin/coverage");
}

export async function deleteCoverageAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  deleteCoverage(id);
  revalidatePath("/admin/coverage");
  revalidatePath("/admin");
}

/** Adds the starter bands from the admin, so this needs no terminal. */
export async function seedStarterCoverageAction() {
  await requireAdmin();
  seedStarterCoverage();
  revalidatePath("/admin/coverage");
  revalidatePath("/admin");
}
