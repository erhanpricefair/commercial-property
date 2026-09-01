import "server-only";
import { createInvestor, findInvestorByEmail } from "../repositories/investors";
import { recomputeMatchesForInvestor } from "../repositories/opportunities";
import { logActivity } from "../repositories/activity";
import { queueRegistrationSequence, baseMergeVars } from "../email";
import { dispatchLeadEvent } from "../integrations";
import { notifyOwnerOfHotLead } from "../alerts";
import { labelFor, type LeadClassification } from "../taxonomy";
import type { LeadInput } from "../validation";

/**
 * The one place a public request turns into a lead.
 *
 * This exists so the public route handler never imports the private
 * opportunity repository. Matching has to run at intake — the admin dashboard
 * should be useful the moment the owner opens it — but the route that serves
 * an anonymous visitor has no business holding a reference to a module that
 * can read stock. So the coupling lives here, behind a function whose return
 * type deliberately carries no opportunity data at all.
 *
 * `scripts/privacy-audit.ts` enforces the rule; this module is how the code
 * satisfies it honestly rather than by suppressing the check.
 */

export type IntakeResult = {
  investorId: number;
  /** Coarse bucket for ad-platform reporting. Never the numeric score. */
  leadCategory: Lowercase<LeadClassification>;
};

export function registerInvestor(input: LeadInput): IntakeResult {
  // A repeat registration from the same email is a real signal, not an error —
  // record it as a fresh set of criteria and note the duplication internally.
  const existing = findInvestorByEmail(input.email);

  const { investorId, classification } = createInvestor(input);

  logActivity(investorId, "investor_registered", "Investor registered via the qualification form", {
    source: input.source ?? "website",
    landingPage: input.landingPage ?? null,
    utmCampaign: input.utmCampaign || null,
    utmContent: input.utmContent || null,
    propertyType: input.propertyType,
    budget: input.budget,
    locationScope: input.locationScope,
    timeframe: input.timeframe,
    duplicateOf: existing?.id ?? null,
  });

  // Matching is a convenience for the admin, never a reason to fail the lead.
  // The count stays local: it is passed to the owner's own CRM and to activity,
  // and is never returned to the caller.
  let matchCount = 0;
  try {
    matchCount = recomputeMatchesForInvestor(investorId);
  } catch {
    /* ignore */
  }

  const mergeVars = {
    ...baseMergeVars(),
    firstName: input.firstName,
    lastName: input.lastName,
    propertyType: labelFor("propertyType", input.propertyType),
    budget: labelFor("budget", input.budget),
    location: input.locationFree
      ? `${labelFor("location", input.locationScope)} (${input.locationFree})`
      : labelFor("location", input.locationScope),
    timeframe: labelFor("timeframe", input.timeframe),
  };

  try {
    queueRegistrationSequence(investorId, mergeVars);
  } catch {
    // A template problem must not lose the registration.
  }

  // A HOT lead is worth interrupting someone for. Fired immediately rather
  // than queued, because first-contact speed is the largest controllable
  // factor in whether this registration becomes a sale.
  if (classification === "HOT") {
    void notifyOwnerOfHotLead({ investorId, input, classification, matchCount }).catch(
      () => undefined,
    );
  }

  // Fire-and-forget: the visitor should never wait on a third-party CRM.
  void dispatchLeadEvent({
    event: "investor_registered",
    investor: {
      id: investorId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      mobile: input.mobile,
      contactMethod: input.contactMethod,
      message: input.message || null,
      consentMarketing: Boolean(input.consentMarketing),
    },
    criteria: {
      propertyType: input.propertyType,
      budget: input.budget,
      locationScope: input.locationScope,
      locationFree: input.locationFree || null,
      priorities: input.priorities,
      financeStatus: input.financeStatus,
      timeframe: input.timeframe,
    },
    internal: { leadScore: 0, classification, matchCount },
    attribution: {
      source: input.source ?? "website",
      sourceDetail: input.sourceDetail ?? null,
      landingPage: input.landingPage ?? null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      utmContent: input.utmContent || null,
      utmTerm: input.utmTerm || null,
      clickId: input.clickId || null,
    },
    occurredAt: new Date().toISOString(),
  }).catch(() => undefined);

  return {
    investorId,
    leadCategory: classification.toLowerCase() as Lowercase<LeadClassification>,
  };
}
