import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Pipeline moves and lead ownership, against a throwaway database. */
describe("CRM workflow", () => {
  let investors: typeof import("../src/lib/repositories/investors.ts");
  let db: import("better-sqlite3").Database;
  let id: number;
  let agentA: number;
  let agentB: number;

  before(async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "crm-test-"));
    process.env.DATABASE_PATH = path.join(dir, "test.db");
    investors = await import("../src/lib/repositories/investors.ts");
    db = (await import("../src/lib/db.ts")).getDb();
    const add = db.prepare("INSERT INTO admin_users (email, name, password_hash) VALUES (?, ?, 'x')");
    agentA = Number(add.run("a@example.com", "Agent A").lastInsertRowid);
    agentB = Number(add.run("b@example.com", "Agent B").lastInsertRowid);
    id = Number(
      db
        .prepare("INSERT INTO investors (first_name, last_name, email, mobile) VALUES ('I', 'N', 'i@example.com', '0400000000')")
        .run().lastInsertRowid,
    );
  });

  const status = () => (db.prepare("SELECT status FROM investors WHERE id = ?").get(id) as { status: string }).status;

  test("automatic moves only go forward", () => {
    investors.updateInvestorStatus(id, "negotiating");
    assert.equal(investors.advanceInvestorStatus(id, "opportunity_sent"), false);
    assert.equal(status(), "negotiating");
  });

  test("automatic moves never reopen a converted client", () => {
    investors.updateInvestorStatus(id, "converted");
    assert.equal(investors.advanceInvestorStatus(id, "inspection_discussion"), false);
    assert.equal(status(), "converted");
  });

  test("the first agent to call claims an unowned lead; the second doesn't take it", () => {
    assert.equal(investors.claimIfUnassigned(id, agentA), true);
    assert.equal(investors.claimIfUnassigned(id, agentB), false);
    const owner = (db.prepare("SELECT assigned_to FROM investors WHERE id = ?").get(id) as { assigned_to: number })
      .assigned_to;
    assert.equal(owner, agentA);
  });

  test("assignment refuses an unknown admin and supports unassigning", () => {
    assert.equal(investors.assignInvestor(id, 9999), false);
    assert.equal(investors.assignInvestor(id, null), true);
    assert.equal(investors.listInvestors({ owner: "unassigned" }).total, 1);
    assert.equal(investors.listInvestors({ owner: agentA }).total, 0);
  });
});
