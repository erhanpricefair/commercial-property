/**
 * Seed starter coverage areas.
 *
 *   npm run coverage:seed
 *
 * Suburb-level bands across Melbourne's established industrial and commercial
 * precincts — the kind of thing anyone active in the market would know. They
 * contain no developer, no development, no address and no lot number, because
 * the table has no columns for those.
 *
 * They are a STARTING POINT, not a substitute for your own knowledge. Open
 * Admin → Coverage and correct every row to match what you can actually
 * source, then mark each one confirmed. Coverage you haven't verified is a
 * guess, and a guess will have you calling investors you can't help.
 */
import { getDb } from "../src/lib/db.ts";
import { listCoverage, seedStarterCoverage } from "../src/lib/repositories/coverage.ts";

getDb();
const existing = listCoverage();

if (existing.length > 0) {
  console.log(`${existing.length} coverage area(s) already recorded — leaving them alone.`);
  console.log("Delete them in Admin -> Coverage first if you want to reseed.");
} else {
  const { created } = seedStarterCoverage();
  console.log(`Seeded ${created} suburb-level coverage areas.\n`);
  console.log("NEXT: open Admin -> Coverage and correct every band to what you can actually");
  console.log("source. Every row is marked VERIFY until you do.");
}

console.log("\nYou can also do this from the admin: Coverage -> Add starter areas.");
