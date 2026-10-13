import "server-only";
import { createInvestor, findInvestorByEmail } from "../repositories/investors";
import { presentationForEnquiry, recomputeMatchesForInvestor } from "../repositories/opportunities";
import { logActivity, queueCommunication } from "../repositories/activity";
import { advanceInvestorStatus, reRegisterInvestor } from "../repositories/investors";
import { grantConsent } from "../repositories/consent";
import { queueRegistrationSequence, baseMergeVars } from "../email";
import { dispatchLeadEvent } from "../integrations";
import { notifyOwnerOfHotLead } from "../alerts";
import { promotePartial } from "../repositories/funnel";
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
  // record it as a fresh set of criteria on the existing person, not as a
  // second lead for someone else to call.
  const existing = findInvestorByEmail(input.email);

  const { investorId, classification } = existing
    ? reRegisterInvestor(existing.id, input)
    : createInvestor(input);

  // A ticked box on this submission is fresh, express consent and outranks an
  // earlier unsubscribe. An unticked box never removes consent given before.
  if (existing && input.consentMarketing) grantConsent(investorId);

  // The same person shouldn't appear as both a completed registration and an
  // unfinished one to chase.
  if (input.sessionKey) {
    try {
      promotePartial(input.sessionKey, investorId);
    } catch {
      /* never fail a registration over bookkeeping */
    }
  }

  logActivity(
    investorId,
    existing ? "investor_reregistered" : "investor_registered",
    existing
      ? "Registered again with updated criteria"
      : "Investor registered via the qualification form",
    {
    source: input.source ?? "website",
    landingPage: input.landingPage ?? null,
    utmCampaign: input.utmCampaign || null,
    utmContent: input.utmContent || null,
    propertyType: input.propertyType,
    budget: input.budget,
    locationScope: input.locationScope,
    timeframe: input.timeframe,
    returning: Boolean(existing),
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

/**
 * Enquiry lodged through a private presentation link.
 *
 * Lives here, not in the route, for the same reason as `registerInvestor`:
 * resolving the token means touching the opportunity repository, and a
 * public route must not hold that import. Returns nothing at all — the caller
 * answers identically whether the token was valid or not, so the endpoint
 * cannot be used to probe which links exist or are still approved.
 */
export function recordPresentationEnquiry(token: string, rawMessage: unknown): void {
  const presentation = presentationForEnquiry(token);
  if (!presentation) return;

  const message = String(rawMessage ?? "").trim().slice(0, 2000);
  const meta = { presentationId: presentation.id, opportunityId: presentation.opportunityId };

  if (presentation.investorId) {
    logActivity(
      presentation.investorId,
      "presentation_enquiry",
      message || "Registered interest from a private presentation",
      meta,
    );
    queueCommunication({
      investorId: presentation.investorId,
      channel: "email",
      direction: "inbound",
      subject: "Enquiry from private opportunity presentation",
      body: message || "(no message)",
      status: "logged",
    });
    advanceInvestorStatus(presentation.investorId, "inspection_discussion");
  } else {
    logActivity(null, "presentation_enquiry_anonymous", message || "Interest registered", meta);
  }
}
