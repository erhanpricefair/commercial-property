/**
 * Seed the database with demonstration data.
 *
 *   npm run db:seed
 *
 * Creates an admin and a handful of example investor registrations so the
 * dashboard has something in it.
 *
 * It deliberately seeds NO opportunity records. An earlier version seeded
 * synthetic placeholder stock, which made matching look like it was working
 * when it was matching against fiction. Coverage is the honest equivalent:
 *
 *   npm run coverage:seed
 */
import { getDb } from "../src/lib/db.ts";
import { hashPassword } from "../src/lib/password.ts";
import { ensureEmailTemplates } from "../src/lib/email/index.ts";
import { createInvestor } from "../src/lib/repositories/investors.ts";
import { recomputeAllMatches } from "../src/lib/repositories/opportunities.ts";
import type { LeadInput } from "../src/lib/validation.ts";

const db = getDb();
ensureEmailTemplates();

/* ---------------- Admin ---------------- */

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com.au";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe-Immediately-2026";

const existingAdmin = db.prepare("SELECT id FROM admin_users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  db.prepare(
    "INSERT INTO admin_users (email, name, password_hash, role) VALUES (?, ?, ?, 'admin')",
  ).run(adminEmail, "Platform Owner", hashPassword(adminPassword));
  console.log(`Created seed admin: ${adminEmail} / ${adminPassword}`);
  console.log("CHANGE THIS PASSWORD before deploying.\n");
} else {
  console.log(`Admin already exists: ${adminEmail}\n`);
}

/* ---------------- Coverage ----------------
   Coverage rather than stock, deliberately. See docs/COVERAGE.md — the short
   version is that a channel partner's stocklist is their property, and the
   platform is designed to run without holding it.

   Run `npm run coverage:seed` for starter coverage bands.
------------------------------------------------------- */

/* ---------------- Investors ---------------- */

const SEED_INVESTORS: LeadInput[] = [
  {
    propertyType: "storage", budget: "300k_500k", locationScope: "melbourne", locationFree: "Northern suburbs",
    priorities: ["rental_income", "entry_price", "long_term"], financeStatus: "pre_approved", timeframe: "immediately",
    firstName: "Amara", lastName: "Okafor", email: "amara.okafor@example.com", mobile: "0412 345 678",
    contactMethod: "phone", message: "Looking to diversify beyond two residential properties.",
    consentMarketing: true, source: "seed", company: "",
  },
  {
    propertyType: "warehouse", budget: "500k_750k", locationScope: "greater_melbourne", locationFree: "",
    priorities: ["capital_growth", "industrial_exposure"], financeStatus: "assessment_underway", timeframe: "1_3_months",
    firstName: "Daniel", lastName: "Petrov", email: "d.petrov@example.com", mobile: "0423 456 789",
    contactMethod: "email", message: "", consentMarketing: true, source: "seed", company: "",
  },
  {
    propertyType: "open", budget: "unsure", locationScope: "open", locationFree: "",
    priorities: ["researching"], financeStatus: "not_yet", timeframe: "researching",
    firstName: "Priya", lastName: "Raman", email: "priya.raman@example.com", mobile: "0434 567 890",
    contactMethod: "email", message: "Just starting to look into commercial.",
    consentMarketing: false, source: "seed", company: "",
  },
  {
    propertyType: "industrial", budget: "1m_plus", locationScope: "anywhere_vic", locationFree: "",
    priorities: ["rental_income", "long_term", "diversification"], financeStatus: "cash_buyer", timeframe: "immediately",
    firstName: "Marcus", lastName: "Ellery", email: "m.ellery@example.com", mobile: "0445 678 901",
    contactMethod: "phone", message: "Selling a residential portfolio, want industrial exposure.",
    consentMarketing: true, source: "seed", company: "",
  },
  {
    propertyType: "small_commercial", budget: "under_300k", locationScope: "regional_vic", locationFree: "Ballarat",
    priorities: ["entry_price", "rental_income"], financeStatus: "not_sure", timeframe: "6_12_months",
    firstName: "Jess", lastName: "Nowak", email: "jess.nowak@example.com", mobile: "0456 789 012",
    contactMethod: "sms", message: "", consentMarketing: false, source: "seed", company: "",
  },
  {
    propertyType: "warehouse", budget: "750k_1m", locationScope: "melbourne", locationFree: "West",
    priorities: ["industrial_exposure", "capital_growth", "location"], financeStatus: "pre_approved", timeframe: "3_6_months",
    firstName: "Hana", lastName: "Sørensen", email: "hana.s@example.com", mobile: "0467 890 123",
    contactMethod: "email", message: "", consentMarketing: true, source: "seed", company: "",
  },
];

let created = 0;
for (const investor of SEED_INVESTORS) {
  const exists = db.prepare("SELECT id FROM investors WHERE email = ?").get(investor.email);
  if (exists) continue;
  createInvestor(investor);
  created++;
}
console.log(`Seeded ${created} investor registration(s).`);

/* ---------------- Matching ---------------- */

const { investors } = recomputeAllMatches();
console.log(`Recomputed stock matches for ${investors} investor(s).`);

console.log("\nSeed complete. Sign in at /admin/login");
console.log("\nNEXT: run `npm run coverage:seed`, then correct the bands in");
console.log("Admin → Coverage. Matching runs on coverage, not on a stocklist.");
