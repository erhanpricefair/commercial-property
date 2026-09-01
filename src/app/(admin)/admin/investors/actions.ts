"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateInvestorStatus, updateInvestorFields, rescoreInvestor, getInvestor } from "@/lib/repositories/investors";
import { addNote, deleteNote, logActivity, queueCommunication } from "@/lib/repositories/activity";
import { recomputeMatchesForInvestor, createPresentation, revokePresentation } from "@/lib/repositories/opportunities";
import { getEmailTemplate, baseMergeVars } from "@/lib/email";
import { renderTemplate } from "@/lib/email/templates";
import { labelFor, type LeadStatus } from "@/lib/taxonomy";
import { createDeal, updateDeal, deleteDeal, getSetting } from "@/lib/repositories/deals";
import type { DealStage } from "@/lib/revenue";

/**
 * Server actions for the admin investor workspace.
 *
 * Every action begins with `requireAdmin()`, which throws if there is no valid
 * session — the mutation cannot proceed without one. This is independent of the
 * middleware cookie check.
 */

export async function setStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const status = String(formData.get("status")) as LeadStatus;
  if (!investorId || !status) return;

  updateInvestorStatus(investorId, status);
  logActivity(investorId, "status_changed", `Status set to ${status}`, { by: admin.email });
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
}

export async function setFollowUpAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const date = String(formData.get("nextFollowUp") ?? "").trim();
  if (!investorId) return;

  updateInvestorFields(investorId, { next_followup_at: date || null });
  logActivity(investorId, "followup_scheduled", date ? `Follow-up set for ${date}` : "Follow-up cleared", {
    by: admin.email,
  });
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
}

export async function logContactAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const channel = String(formData.get("channel") ?? "phone");
  const summary = String(formData.get("summary") ?? "").trim();
  if (!investorId) return;

  updateInvestorFields(investorId, { last_contact_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
  queueCommunication({
    investorId,
    channel,
    subject: `${channel} contact logged`,
    body: summary || null,
    status: "logged",
  });
  logActivity(investorId, "contact_logged", summary || `Contact logged via ${channel}`, {
    by: admin.email,
    channel,
  });
  revalidatePath(`/admin/investors/${investorId}`);
}

export async function addNoteAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!investorId || !body) return;

  addNote(investorId, body, admin.id);
  logActivity(investorId, "note_added", "Note added", { by: admin.email });
  revalidatePath(`/admin/investors/${investorId}`);
}

export async function deleteNoteAction(formData: FormData) {
  await requireAdmin();
  const noteId = Number(formData.get("noteId"));
  const investorId = Number(formData.get("investorId"));
  if (!noteId) return;

  deleteNote(noteId);
  revalidatePath(`/admin/investors/${investorId}`);
}

export async function recomputeMatchesAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  if (!investorId) return;

  rescoreInvestor(investorId);
  const count = recomputeMatchesForInvestor(investorId);
  logActivity(investorId, "matches_recomputed", `${count} potential match(es)`, { by: admin.email });
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
}

export async function createPresentationAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId")) || null;
  const opportunityId = Number(formData.get("opportunityId"));
  if (!opportunityId) return;

  const presentation = createPresentation({
    opportunityId,
    investorId,
    discloseIdentity: formData.get("discloseIdentity") === "on",
    introNote: String(formData.get("introNote") ?? "").trim() || null,
    createdBy: admin.id,
    expiresInDays: Number(formData.get("expiresInDays")) || null,
  });

  if (investorId) {
    logActivity(investorId, "presentation_created", `Private link issued for opportunity #${opportunityId}`, {
      by: admin.email,
      presentationId: presentation.id,
    });
    updateInvestorStatus(investorId, "opportunity_sent");
    revalidatePath(`/admin/investors/${investorId}`);
  }
  revalidatePath("/admin/presentations");
  revalidatePath("/admin");
}

export async function revokePresentationAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("presentationId"));
  if (!id) return;
  revokePresentation(id);
  revalidatePath("/admin/presentations");
}

/** Queue one of the editable templates to this investor. */
export async function queueTemplateAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const key = String(formData.get("templateKey") ?? "");
  if (!investorId || !key) return;

  const investor = getInvestor(investorId);
  const template = getEmailTemplate(key);
  if (!investor || !template) return;

  const prefs = investor.preferences;
  const vars = {
    ...baseMergeVars(),
    firstName: investor.first_name,
    lastName: investor.last_name,
    propertyType: labelFor("propertyType", prefs?.property_type),
    budget: labelFor("budget", prefs?.budget),
    location: prefs?.location_free
      ? `${labelFor("location", prefs.location_scope)} (${prefs.location_free})`
      : labelFor("location", prefs?.location_scope),
    timeframe: labelFor("timeframe", prefs?.timeframe),
  };

  queueCommunication({
    investorId,
    channel: "email",
    templateKey: key,
    subject: renderTemplate(template.subject, vars),
    body: renderTemplate(template.body, vars),
  });
  logActivity(investorId, "email_queued", `Queued template: ${template.name}`, { by: admin.email });
  revalidatePath(`/admin/investors/${investorId}`);
}

/* ------------------------------------------------------------------ */
/* Deals                                                               */
/* ------------------------------------------------------------------ */

export async function createDealAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  if (!investorId) return;

  const price = Number(String(formData.get("price") ?? "").replace(/[^0-9.]/g, "")) || null;
  const rate =
    Number(String(formData.get("commissionRate") ?? "").replace(/[^0-9.]/g, "")) ||
    Number(getSetting("commission_rate"));

  createDeal({
    investorId,
    opportunityId: Number(formData.get("opportunityId")) || null,
    stage: (String(formData.get("stage") || "opportunity_sent") as DealStage),
    price,
    commissionRate: rate,
    expectedSettlement: String(formData.get("expectedSettlement") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  logActivity(investorId, "deal_created", "Deal recorded", { by: admin.email });
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/deals");
}

export async function updateDealAction(formData: FormData) {
  const admin = await requireAdmin();
  const dealId = Number(formData.get("dealId"));
  const investorId = Number(formData.get("investorId"));
  if (!dealId) return;

  const stage = String(formData.get("stage") || "") as DealStage;
  const markPaid = formData.get("markPaid") === "on";

  updateDeal(dealId, {
    stage: stage || undefined,
    commissionPaidAt: markPaid ? new Date().toISOString().slice(0, 10) : null,
  });

  logActivity(investorId || null, "deal_updated", `Deal moved to ${stage}`, { by: admin.email });
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/deals");
}

export async function deleteDealAction(formData: FormData) {
  await requireAdmin();
  const dealId = Number(formData.get("dealId"));
  const investorId = Number(formData.get("investorId"));
  if (!dealId) return;
  deleteDeal(dealId);
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/deals");
}
