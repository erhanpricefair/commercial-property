"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createCoverage,
  updateCoverage,
  deleteCoverage,
  confirmCoverage,
} from "@/lib/repositories/coverage";

function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").replace(/[^0-9]/g, "");
  return raw ? Number(raw) : null;
}

function str(formData: FormData, key: string): string | null {
  return String(formData.get(key) ?? "").trim() || null;
}

export async function createCoverageAction(formData: FormData) {
  await requireAdmin();
  const propertyType = String(formData.get("propertyType") ?? "").trim();
  if (!propertyType) return;

  createCoverage({
    propertyType,
    suburb: str(formData, "suburb"),
    region: str(formData, "region"),
    state: String(formData.get("state") ?? "VIC"),
    priceMin: num(formData, "priceMin"),
    priceMax: num(formData, "priceMax"),
    sizeMinSqm: num(formData, "sizeMinSqm"),
    sizeMaxSqm: num(formData, "sizeMaxSqm"),
    typicalCompletion: str(formData, "typicalCompletion"),
    frequency: String(formData.get("frequency") ?? "occasional"),
    notes: str(formData, "notes"),
  });

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
