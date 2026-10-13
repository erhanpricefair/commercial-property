"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ReleaseNotApprovedError } from "@/lib/release";
import { requireAdmin } from "@/lib/auth";
import {
  updateInvestorStatus,
  advanceInvestorStatus,
  updateInvestorFields,
  rescoreInvestor,
  getInvestor,
  assignInvestor,
} from "@/lib/repositories/investors";
import { addNote, deleteNote, logActivity, queueCommunication } from "@/lib/repositories/activity";
import { recomputeMatchesForInvestor, createPresentation, revokePresentation } from "@/lib/repositories/opportunities";
import { getEmailTemplate, baseMergeVars } from "@/lib/email";
import { isMarketingTemplate, mayMarketTo, withdrawConsentForEmail } from "@/lib/repositories/consent";
import { renderTemplate } from "@/lib/email/templates";
import { LEAD_STATUSES, labelFor, type LeadStatus } from "@/lib/taxonomy";
import { createDeal, updateDeal, deleteDeal, getSetting } from "@/lib/repositories/deals";
import { DEAL_STAGES, type DealStage } from "@/lib/revenue";

const CONTACT_CHANNELS = ["phone", "email", "sms", "meeting", "other"] as const;

function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

function isDealStage(value: string): value is DealStage {
  return (DEAL_STAGES as readonly string[]).includes(value);
}

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
  const status = String(formData.get("status") ?? "");
  // A forged form post must not be able to write an arbitrary pipeline value.
  if (!investorId || !isLeadStatus(status)) return;

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
  const rawChannel = String(formData.get("channel") ?? "phone");
  const channel = (CONTACT_CHANNELS as readonly string[]).includes(rawChannel) ? rawChannel : "other";
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
  const returnTo = safeAdminPath(formData.get("returnTo"));
  if (!opportunityId) return;

  // Previously an unknown investor ID hit the foreign key and showed a server
  // error; and a refused link failed with no message at all.
  if (investorId && !getInvestor(investorId)) {
    redirect(withParam(returnTo, "linkError", `No investor with ID ${investorId}.`));
  }

  let presentationId: number;
  try {
    presentationId = createPresentation({
      opportunityId,
      investorId,
      discloseIdentity: formData.get("discloseIdentity") === "on",
      introNote: String(formData.get("introNote") ?? "").trim() || null,
      createdBy: admin.id,
      expiresInDays: Math.min(365, Math.max(1, Number(formData.get("expiresInDays")) || 30)),
    }).id;
  } catch (error) {
    if (error instanceof ReleaseNotApprovedError) {
      redirect(withParam(returnTo, "linkError", error.reason));
    }
    throw error;
  }

  if (investorId) {
    logActivity(investorId, "presentation_created", `Private link issued for opportunity #${opportunityId}`, {
      by: admin.email,
      presentationId,
    });
    advanceInvestorStatus(investorId, "opportunity_sent");
    revalidatePath(`/admin/investors/${investorId}`);
  }
  revalidatePath("/admin/presentations");
  revalidatePath("/admin");
  // Land on the list with the new link highlighted and ready to copy —
  // previously the button gave no visible result from the opportunity page.
  redirect(`/admin/presentations?created=${presentationId}`);
}

function safeAdminPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? "");
  return /^\/admin(\/[A-Za-z0-9/_-]*)?$/.test(path) ? path : "/admin/presentations";
}

function withParam(path: string, key: string, value: string): string {
  return `${path}?${new URLSearchParams({ [key]: value }).toString()}`;
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

  // The same rule the automatic sequence follows; an admin can't send a
  // marketing template by hand to someone who hasn't agreed to it.
  if (template.is_active !== 1) {
    redirect(`/admin/investors/${investorId}?${new URLSearchParams({ emailError: "That template is switched off." })}`);
  }
  if (isMarketingTemplate(template.key) && !mayMarketTo(investorId)) {
    redirect(
      `/admin/investors/${investorId}?${new URLSearchParams({
        emailError: "This investor hasn't consented to marketing email, or has unsubscribed. Contact them directly instead.",
      })}`,
    );
  }

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
    stage: isDealStage(String(formData.get("stage"))) ? (String(formData.get("stage")) as DealStage) : "opportunity_sent",
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

  const rawStage = String(formData.get("stage") || "");
  const stage = isDealStage(rawStage) ? rawStage : undefined;
  const markPaid = formData.get("markPaid") === "on";

  // Keep the original paid date when the box stays ticked. Re-stamping it with
  // today on every save moved banked commission between months in the revenue
  // view, and unticking is the only thing that should clear it.
  updateDeal(dealId, {
    stage,
    commissionPaidAt: markPaid ? undefined : null,
    markPaidIfUnpaid: markPaid ? new Date().toISOString().slice(0, 10) : undefined,
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

/** Opt-out received outside the email link — by phone, reply, or in person. */
export async function recordUnsubscribeAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const investor = investorId ? getInvestor(investorId) : null;
  if (!investor) return;
  withdrawConsentForEmail(investor.email, "Opt-out recorded by admin", admin.email);
  revalidatePath(`/admin/investors/${investorId}`);
}

export async function assignInvestorAction(formData: FormData) {
  const admin = await requireAdmin();
  const investorId = Number(formData.get("investorId"));
  const raw = String(formData.get("assignTo") ?? "");
  const adminId = raw === "" ? null : Number(raw);
  if (!investorId || (adminId !== null && !Number.isInteger(adminId))) return;
  if (!assignInvestor(investorId, adminId)) return;
  logActivity(investorId, "assigned", adminId === null ? "Unassigned" : `Assigned to admin #${adminId}`, {
    by: admin.email,
    assignedTo: adminId,
  });
  revalidatePath(`/admin/investors/${investorId}`);
  revalidatePath("/admin/investors");
  revalidatePath("/admin/today");
}
