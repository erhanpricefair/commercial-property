import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Consent, unsubscribe and one-person-one-lead, exercised through the real
 * intake service and email queue against a throwaway database.
 */

const BASE = {
  propertyType: "warehouse",
  budget: "300k_500k",
  locationScope: "melbourne",
  locationFree: "",
  priorities: ["rental_income"],
  financeStatus: "pre_approved",
  timeframe: "immediately",
  firstName: "Ada",
  lastName: "Test",
  email: "ada@example.com",
  mobile: "0412 345 678",
  contactMethod: "phone",
  message: "",
  consentMarketing: false,
  company: "",
} as const;

describe("consent and de-duplication", () => {
  let intake: typeof import("../src/lib/services/lead-intake.ts");
  let consent: typeof import("../src/lib/repositories/consent.ts");
  let dispatch: typeof import("../src/lib/email/dispatch.ts");
  let db: import("better-sqlite3").Database;

  const queued = (investorId: number) =>
    (
      db
        .prepare("SELECT template_key, status FROM communications WHERE investor_id = ? ORDER BY id")
        .all(investorId) as { template_key: string; status: string }[]
    ).map((r) => `${r.template_key}:${r.status}`);

  before(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "consent-test-"));
    process.env.DATABASE_PATH = path.join(dir, "test.db");
    delete process.env.EMAIL_PROVIDER;
    intake = await import("../src/lib/services/lead-intake.ts");
    consent = await import("../src/lib/repositories/consent.ts");
    dispatch = await import("../src/lib/email/dispatch.ts");
    db = (await import("../src/lib/db.ts")).getDb();
  });

  test("without the consent tick, only the confirmation is queued", () => {
    const { investorId } = intake.registerInvestor({ ...BASE } as never);
    assert.deepEqual(queued(investorId), ["investor_welcome:queued"]);
    assert.equal(consent.mayMarketTo(investorId), false);
  });

  test("registering again is the same person, with new criteria and fresh consent", () => {
    const first = (db.prepare("SELECT id FROM investors").get() as { id: number }).id;
    const { investorId } = intake.registerInvestor({
      ...BASE,
      budget: "500k_750k",
      consentMarketing: true,
      message: "Second visit",
    } as never);

    assert.equal(investorId, first);
    assert.equal((db.prepare("SELECT COUNT(*) AS c FROM investors").get() as { c: number }).c, 1);
    assert.equal(
      (db.prepare("SELECT budget FROM investor_preferences WHERE investor_id = ? ORDER BY id DESC").get(first) as {
        budget: string;
      }).budget,
      "500k_750k",
    );
    assert.equal(consent.mayMarketTo(first), true);
    assert.deepEqual(queued(first), [
      "investor_welcome:queued",
      "investor_welcome:queued",
      "investor_education:queued",
      "investor_invitation:queued",
    ]);
  });

  test("a third registration does not queue the nurture sequence again", () => {
    const { investorId } = intake.registerInvestor({ ...BASE, consentMarketing: true } as never);
    const keys = queued(investorId).filter((k) => k.startsWith("investor_education"));
    assert.equal(keys.length, 1);
  });

  test("unsubscribing cancels queued marketing and is honoured at send time", async () => {
    const investorId = (db.prepare("SELECT id FROM investors").get() as { id: number }).id;
    const token = consent.unsubscribeTokenFor(investorId);
    assert.ok(token.length >= 32);
    assert.equal(consent.unsubscribeByToken("not-a-real-token", "link"), false);
    assert.equal(consent.unsubscribeByToken(token, "one_click"), true);

    assert.equal(consent.mayMarketTo(investorId), false);
    assert.ok(queued(investorId).includes("investor_education:cancelled"));
    assert.ok(queued(investorId).includes("investor_invitation:cancelled"));

    // A marketing email queued by some other path is still stopped at send.
    db.prepare(
      "INSERT INTO communications (investor_id, channel, template_key, subject, body, status) VALUES (?, 'email', 'investor_invitation', 's', 'b', 'queued')",
    ).run(investorId);

    const originalLog = console.log;
    const printed: string[] = [];
    console.log = (...args: unknown[]) => printed.push(args.join(" "));
    try {
      const result = await dispatch.dispatchDueEmails(50);
      assert.equal(result.suppressed, 1);
      // Log mode: the confirmations are processed but must NOT be recorded as sent.
      assert.ok(result.attempted - result.suppressed >= 1, "the transactional confirmations are still processed");
      assert.equal(result.sent, 0);
      assert.ok(queued(investorId).includes("investor_welcome:not_sent"));
    } finally {
      console.log = originalLog;
    }
    const sentBody = printed.join("\n");
    assert.match(sentBody, /Unsubscribe from marketing emails: .*\/unsubscribe\?t=/);
    assert.match(sentBody, /Sent by /);
  });

  test("the footer always identifies the sender and carries the link", () => {
    const footer = dispatch.complianceFooter("https://example.com.au/unsubscribe?t=abc");
    assert.match(footer, /Sent by /);
    assert.match(footer, /unsubscribe\?t=abc/);
  });

  test("unknown template keys are treated as marketing", () => {
    assert.equal(consent.isMarketingTemplate("investor_welcome"), false);
    assert.equal(consent.isMarketingTemplate("guide_delivery"), false);
    assert.equal(consent.isMarketingTemplate("spring_newsletter"), true);
  });
});
