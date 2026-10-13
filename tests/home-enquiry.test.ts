import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** The home-buyer landing page's intake, against a throwaway database. */
const BASE = {
  homeType: "house",
  budget: "800k_1m",
  suburbs: "Brunswick, Coburg",
  timeframe: "asap",
  purpose: "live_in",
  firstName: "Hana",
  lastName: "Buyer",
  email: "hana@example.com",
  mobile: "0412 345 678",
  consentMarketing: false,
  company: "",
} as const;

describe("home-buyer enquiry", () => {
  let service: typeof import("../src/lib/services/home-enquiry.ts");
  let db: import("better-sqlite3").Database;

  before(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "home-test-"));
    process.env.DATABASE_PATH = path.join(dir, "test.db");
    service = await import("../src/lib/services/home-enquiry.ts");
    db = (await import("../src/lib/db.ts")).getDb();
  });

  test("timing decides who gets rung first", () => {
    assert.equal(service.classifyHomeEnquiry({ timeframe: "asap" }).classification, "HOT");
    assert.equal(service.classifyHomeEnquiry({ timeframe: "3_6_months" }).classification, "WARM");
    assert.equal(service.classifyHomeEnquiry({ timeframe: "just_looking" }).classification, "NURTURE");
  });

  test("an enquiry becomes a lead with readable criteria and a confirmation email", () => {
    const { investorId, leadCategory } = service.registerHomeEnquiry({ ...BASE } as never);
    assert.equal(leadCategory, "hot");
    const row = db.prepare("SELECT source, notes_from_lead, consent_marketing FROM investors WHERE id = ?").get(investorId) as {
      source: string;
      notes_from_lead: string;
      consent_marketing: number;
    };
    assert.equal(row.source, "home_landing");
    assert.match(row.notes_from_lead, /Budget: \$800,000 – \$1M/);
    assert.match(row.notes_from_lead, /Suburbs: Brunswick, Coburg/);
    assert.equal(row.consent_marketing, 0);
    const queued = db.prepare("SELECT template_key FROM communications WHERE investor_id = ?").all(investorId) as {
      template_key: string;
    }[];
    assert.deepEqual(queued.map((q) => q.template_key), ["home_enquiry_received"]);
  });

  test("the same person enquiring again is one lead, not two", () => {
    const again = service.registerHomeEnquiry({
      ...BASE,
      email: "HANA@example.com",
      budget: "1m_1_5m",
      timeframe: "just_looking",
      consentMarketing: true,
    } as never);
    assert.equal((db.prepare("SELECT COUNT(*) AS c FROM investors").get() as { c: number }).c, 1);
    const row = db.prepare("SELECT notes_from_lead, classification, consent_marketing FROM investors WHERE id = ?").get(
      again.investorId,
    ) as { notes_from_lead: string; classification: string; consent_marketing: number };
    assert.match(row.notes_from_lead, /\$1M – \$1\.5M/);
    // A later, cooler enquiry doesn't demote a hot lead.
    assert.equal(row.classification, "HOT");
    assert.equal(row.consent_marketing, 1);
  });
});
