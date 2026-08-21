/**
 * Seed the database with demonstration data.
 *
 *   npm run db:seed
 *
 * IMPORTANT — about the opportunity records below.
 *
 * The brief referred to a supplied commercial stocklist. No stocklist file was
 * present in this repository and none was attached, so the private opportunity
 * records seeded here are SYNTHETIC placeholders. They carry no real developer,
 * no real development name and no real address — the identifying fields are
 * filled with obvious placeholder text so it is impossible to mistake them for
 * live stock.
 *
 * To load a real stocklist, use the CSV importer instead:
 *
 *   npm run stocklist:import -- ./data/stocklist.csv
 *
 * That marks every imported row PRIVATE / INTERNAL, exactly as these are.
 * Nothing seeded here is reachable from any public page.
 */
import { getDb } from "../src/lib/db.ts";
import { hashPassword } from "../src/lib/password.ts";
import { ensureEmailTemplates } from "../src/lib/email/index.ts";
import { createInvestor } from "../src/lib/repositories/investors.ts";
import { computeYield, recomputeAllMatches } from "../src/lib/repositories/opportunities.ts";
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

/* ---------------- PRIVATE opportunities (synthetic) ---------------- */

type SeedOpportunity = {
  reference: string;
  property_type: string;
  suburb: string;
  state: string;
  size_sqm: number;
  price: number;
  estimated_rental: number;
  outgoings: number;
  completion_status: string;
  availability: string;
};

const SEED_OPPORTUNITIES: SeedOpportunity[] = [
  { reference: "SAMPLE-001", property_type: "storage", suburb: "Coburg North", state: "VIC", size_sqm: 42, price: 245000, estimated_rental: 16800, outgoings: 3200, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-002", property_type: "storage", suburb: "Thomastown", state: "VIC", size_sqm: 55, price: 298000, estimated_rental: 20500, outgoings: 3800, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-003", property_type: "small_commercial", suburb: "Preston", state: "VIC", size_sqm: 88, price: 385000, estimated_rental: 26000, outgoings: 5200, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-004", property_type: "warehouse", suburb: "Campbellfield", state: "VIC", size_sqm: 140, price: 465000, estimated_rental: 31500, outgoings: 6100, completion_status: "under_construction", availability: "available" },
  { reference: "SAMPLE-005", property_type: "warehouse", suburb: "Dandenong South", state: "VIC", size_sqm: 210, price: 640000, estimated_rental: 43000, outgoings: 8200, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-006", property_type: "industrial", suburb: "Truganina", state: "VIC", size_sqm: 320, price: 890000, estimated_rental: 58000, outgoings: 11500, completion_status: "off_the_plan", availability: "available" },
  { reference: "SAMPLE-007", property_type: "industrial", suburb: "Laverton North", state: "VIC", size_sqm: 450, price: 1250000, estimated_rental: 82000, outgoings: 15800, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-008", property_type: "small_commercial", suburb: "Ballarat", state: "VIC", size_sqm: 95, price: 320000, estimated_rental: 22000, outgoings: 4600, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-009", property_type: "warehouse", suburb: "Bendigo", state: "VIC", size_sqm: 165, price: 425000, estimated_rental: 28500, outgoings: 5400, completion_status: "completed", availability: "on_hold" },
  { reference: "SAMPLE-010", property_type: "storage", suburb: "Bayswater", state: "VIC", size_sqm: 38, price: 215000, estimated_rental: 14500, outgoings: 2900, completion_status: "completed", availability: "available" },
  { reference: "SAMPLE-011", property_type: "small_commercial", suburb: "Moorabbin", state: "VIC", size_sqm: 110, price: 520000, estimated_rental: 34000, outgoings: 7100, completion_status: "completed", availability: "under_offer" },
  { reference: "SAMPLE-012", property_type: "warehouse", suburb: "Epping", state: "VIC", size_sqm: 185, price: 545000, estimated_rental: 36500, outgoings: 7000, completion_status: "under_construction", availability: "available" },
];

const insertOpportunity = db.prepare(`
  INSERT OR IGNORE INTO opportunities
    (reference, visibility, property_type, suburb, state, size_sqm, price, estimated_rental,
     outgoings, estimated_yield, completion_status, availability, internal_notes,
     source_channel, developer, development_name, address, lot_unit_number)
  VALUES
    (@reference, 'PRIVATE', @property_type, @suburb, @state, @size_sqm, @price, @estimated_rental,
     @outgoings, @estimated_yield, @completion_status, @availability, @internal_notes,
     @source_channel, @developer, @development_name, @address, @lot_unit_number)
`);

const seedOpportunities = db.transaction(() => {
  for (const opportunity of SEED_OPPORTUNITIES) {
    insertOpportunity.run({
      ...opportunity,
      estimated_yield: computeYield(
        opportunity.price,
        opportunity.estimated_rental,
        opportunity.outgoings,
      ),
      internal_notes:
        "SYNTHETIC SEED RECORD — not real stock. Replace via `npm run stocklist:import`.",
      // Placeholder values only. Deliberately not real identities.
      source_channel: "PLACEHOLDER — channel partner",
      developer: "PLACEHOLDER — developer name",
      development_name: "PLACEHOLDER — development name",
      address: "PLACEHOLDER — street address",
      lot_unit_number: "PLACEHOLDER — lot/unit",
    });
  }
});
seedOpportunities();
console.log(`Seeded ${SEED_OPPORTUNITIES.length} PRIVATE opportunity records (synthetic).`);

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

const { investors, matches } = recomputeAllMatches();
console.log(`Computed matches for ${investors} investor(s): ${matches} total.`);

console.log("\nSeed complete. Sign in at /admin/login");
