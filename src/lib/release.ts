/**
 * Builder / channel-partner release approval.
 *
 * A specific property belongs to the builder or partner who supplied it until
 * they clear it for release. The platform used to let any admin issue a
 * private link to any opportunity, including the address and developer, with
 * nothing recording that anyone had agreed. This module is the rule that
 * replaces that: pure, no DB access, so it can be asserted directly and called
 * identically when a link is created, when it is viewed, and when an enquiry
 * is made through it.
 *
 * The check runs at VIEW time as well as at creation, deliberately. Approval
 * is something a builder can withdraw, an approval can lapse, and stock sells.
 * A link issued last month must stop working the moment any of those happen,
 * without anyone remembering to revoke it.
 */
import { melbourneDate } from "./time";

export const RELEASE_LEVELS = ["none", "summary", "full", "withdrawn"] as const;
export type ReleaseLevel = (typeof RELEASE_LEVELS)[number];

export const RELEASE_LABELS: Record<ReleaseLevel, string> = {
  none: "Not approved for release",
  summary: "Approved — summary only (no address, developer or development name)",
  full: "Approved — full details may be disclosed",
  withdrawn: "Approval withdrawn",
};

/** Availability states in which a property may still be presented. */
export const PRESENTABLE_AVAILABILITY = ["available", "on_hold", "under_offer"] as const;

export type ReleaseFields = {
  release_approval?: string | null;
  release_approved_by?: string | null;
  release_approval_ref?: string | null;
  /** YYYY-MM-DD, inclusive. Null means no stated expiry. */
  release_approval_expires?: string | null;
  availability?: string | null;
};

export type ReleaseDecision = {
  /** A private summary link may exist and be viewed. */
  canShare: boolean;
  /** Address, lot, development name and developer may be shown. */
  canDisclose: boolean;
  /** Why not, in words an admin can act on. Null when canShare is true. */
  reason: string | null;
};

export function isReleaseLevel(value: unknown): value is ReleaseLevel {
  return typeof value === "string" && (RELEASE_LEVELS as readonly string[]).includes(value);
}

export function releaseDecision(fields: ReleaseFields, now: Date = new Date()): ReleaseDecision {
  const deny = (reason: string): ReleaseDecision => ({ canShare: false, canDisclose: false, reason });

  const level = isReleaseLevel(fields.release_approval) ? fields.release_approval : "none";
  if (level === "withdrawn") return deny("The builder / partner has withdrawn release approval.");
  if (level === "none") {
    return deny("No release approval is recorded from the builder / channel partner.");
  }

  // An approval nobody can trace is not an approval. Both who gave it and the
  // evidence (an email, a signed authority) must be on the record.
  if (!fields.release_approved_by?.trim()) {
    return deny("Record who at the builder / partner approved the release.");
  }
  if (!fields.release_approval_ref?.trim()) {
    return deny("Record the evidence of approval (e.g. the email or written authority).");
  }

  const expires = fields.release_approval_expires?.trim();
  if (expires) {
    // Inclusive of the expiry day, in Melbourne, which is where the approval
    // was given. Compared as YYYY-MM-DD strings.
    if (melbourneDate(now) > expires.slice(0, 10)) {
      return deny(`Release approval expired on ${expires.slice(0, 10)}.`);
    }
  }

  const availability = fields.availability ?? "available";
  if (!(PRESENTABLE_AVAILABILITY as readonly string[]).includes(availability)) {
    return deny(`The property is marked ${availability.replace(/_/g, " ")}.`);
  }

  return { canShare: true, canDisclose: level === "full", reason: null };
}

export { melbourneDate };

export class ReleaseNotApprovedError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(reason);
    this.reason = reason;
    this.name = "ReleaseNotApprovedError";
  }
}
