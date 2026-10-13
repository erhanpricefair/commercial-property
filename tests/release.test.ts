import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { releaseDecision, melbourneDate } from "../src/lib/release.ts";

/**
 * Builder / channel-partner release approval.
 *
 * The rule is asserted twice: as a pure function, and through the real
 * repository against a throwaway database, because the protection only counts
 * if it holds where links are actually created and opened.
 */

const APPROVED = {
  release_approval: "summary",
  release_approved_by: "J. Citizen, Builder Pty Ltd",
  release_approval_ref: "Email 12/10/2026",
  release_approval_expires: null,
  availability: "available",
};

describe("release decision", () => {
  test("nothing is shareable without a recorded approval", () => {
    assert.equal(releaseDecision({}).canShare, false);
    assert.equal(releaseDecision({ ...APPROVED, release_approval: "none" }).canShare, false);
    assert.equal(releaseDecision({ ...APPROVED, release_approval: "withdrawn" }).canShare, false);
    assert.equal(releaseDecision({ ...APPROVED, release_approval: "nonsense" }).canShare, false);
  });

  test("an approval must say who gave it and what the evidence is", () => {
    assert.equal(releaseDecision({ ...APPROVED, release_approved_by: " " }).canShare, false);
    assert.equal(releaseDecision({ ...APPROVED, release_approval_ref: null }).canShare, false);
  });

  test("summary approval shares without identity; full approval allows disclosure", () => {
    const summary = releaseDecision(APPROVED);
    assert.equal(summary.canShare, true);
    assert.equal(summary.canDisclose, false);
    const full = releaseDecision({ ...APPROVED, release_approval: "full" });
    assert.equal(full.canShare, true);
    assert.equal(full.canDisclose, true);
  });

  test("approval lapses after its expiry date (inclusive of the day, Melbourne time)", () => {
    // 2026-10-13 23:30 UTC is 2026-10-14 10:30 in Melbourne.
    const now = new Date("2026-10-13T23:30:00Z");
    assert.equal(melbourneDate(now), "2026-10-14");
    assert.equal(releaseDecision({ ...APPROVED, release_approval_expires: "2026-10-14" }, now).canShare, true);
    assert.equal(releaseDecision({ ...APPROVED, release_approval_expires: "2026-10-13" }, now).canShare, false);
  });

  test("sold or withdrawn stock can't be presented, whatever the approval says", () => {
    for (const availability of ["sold", "withdrawn"]) {
      assert.equal(releaseDecision({ ...APPROVED, release_approval: "full", availability }).canShare, false);
    }
    assert.equal(releaseDecision({ ...APPROVED, availability: "under_offer" }).canShare, true);
  });
});

describe("release approval in the repository", () => {
  let repo: typeof import("../src/lib/repositories/opportunities.ts");
  let db: import("better-sqlite3").Database;
  let oppId: number;

  before(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-test-"));
    process.env.DATABASE_PATH = path.join(dir, "test.db");
    repo = await import("../src/lib/repositories/opportunities.ts");
    db = (await import("../src/lib/db.ts")).getDb();
    oppId = repo.createOpportunity({
      reference: "OPP-T1",
      property_type: "warehouse",
      suburb: "Dandenong South",
      state: "VIC",
      size_sqm: 200,
      price: 450000,
      estimated_rental: null,
      outgoings: null,
      estimated_yield: null,
      completion_status: "completed",
      availability: "available",
      internal_notes: null,
      source_channel: "Partner X",
      developer: "Builder Pty Ltd",
      development_name: "Example Estate",
      address: "1 Example Rd",
      lot_unit_number: "Lot 4",
    });
  });

  test("new stock defaults to not approved, and a link is refused", () => {
    assert.equal(repo.getOpportunity(oppId)?.release_approval, "none");
    assert.throws(() => repo.createPresentation({ opportunityId: oppId }), /release approval/i);
  });

  test("summary approval allows a link but refuses identity disclosure", () => {
    repo.updateOpportunity(oppId, {
      release_approval: "summary",
      release_approved_by: "J. Citizen",
      release_approval_ref: "Email 12/10",
    });
    assert.throws(() => repo.createPresentation({ opportunityId: oppId, discloseIdentity: true }), /summary only/i);
    const link = repo.createPresentation({ opportunityId: oppId, expiresInDays: 30 });
    const view = repo.loadPresentationByToken(link.token);
    assert.ok(view);
    assert.equal(view.opportunity.address, null);
    assert.equal(view.opportunity.developer, null);
  });

  test("a full-disclosure link hides identity again if approval is downgraded", () => {
    repo.updateOpportunity(oppId, { release_approval: "full" });
    const link = repo.createPresentation({ opportunityId: oppId, discloseIdentity: true });
    assert.equal(repo.loadPresentationByToken(link.token)?.opportunity.address, "1 Example Rd");

    repo.updateOpportunity(oppId, { release_approval: "summary" });
    const view = repo.loadPresentationByToken(link.token);
    assert.ok(view);
    assert.equal(view.discloseIdentity, false);
    assert.equal(view.opportunity.address, null);
    assert.equal(view.opportunity.developmentName, null);
  });

  test("withdrawing approval or selling the property takes existing links down", () => {
    repo.updateOpportunity(oppId, { release_approval: "full", availability: "available" });
    const link = repo.createPresentation({ opportunityId: oppId });
    assert.ok(repo.loadPresentationByToken(link.token));
    assert.ok(repo.presentationForEnquiry(link.token));

    repo.updateOpportunity(oppId, { release_approval: "withdrawn" });
    assert.equal(repo.loadPresentationByToken(link.token), null);
    assert.equal(repo.presentationForEnquiry(link.token), null);

    repo.updateOpportunity(oppId, { release_approval: "full", availability: "sold" });
    assert.equal(repo.loadPresentationByToken(link.token), null);
  });

  test("a link expires at its expiry time, not at the end of that UTC day", () => {
    repo.updateOpportunity(oppId, { release_approval: "full", availability: "available" });
    const link = repo.createPresentation({ opportunityId: oppId, expiresInDays: 1 });
    // Stored the way SQLite writes times, so the text comparison is sound.
    assert.match(link.expires_at ?? "", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    // A row written by the old code: ISO format, one minute in the past.
    const past = new Date(Date.now() - 60_000).toISOString();
    db.prepare("UPDATE presentations SET expires_at = ? WHERE id = ?").run(past, link.id);
    assert.equal(repo.loadPresentationByToken(link.token), null);
  });
});
