/**
 * Seed starter coverage areas.
 *
 *   npm run coverage:seed
 *
 * These are broad, market-level bands for Melbourne and regional Victoria —
 * the kind of thing anyone active in the market would know. They contain no
 * developer, no development, no address and no lot number, because the table
 * has no columns for those.
 *
 * They are a STARTING POINT, not a substitute for your own knowledge. Open
 * Admin → Coverage and correct every row to match what you can actually
 * source, then mark each one confirmed. Coverage you haven't verified is a
 * guess, and a guess will have you calling investors you can't help.
 */
import { getDb } from "../src/lib/db.ts";
import { createCoverage, listCoverage } from "../src/lib/repositories/coverage.ts";

type Seed = {
  propertyType: string;
  suburb?: string;
  region: string;
  priceMin: number;
  priceMax: number;
  frequency: string;
  typicalCompletion?: string;
  notes: string;
};

const SEEDS: Seed[] = [
  { propertyType: "storage", region: "Northern Melbourne", priceMin: 180_000, priceMax: 320_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY: adjust band to what you actually see" },
  { propertyType: "storage", region: "Eastern Melbourne", priceMin: 200_000, priceMax: 340_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "storage", region: "South East Melbourne", priceMin: 190_000, priceMax: 330_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "small_commercial", region: "Northern Melbourne", priceMin: 300_000, priceMax: 600_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "small_commercial", region: "Regional Victoria", priceMin: 250_000, priceMax: 500_000, frequency: "rare", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "warehouse", region: "Western Melbourne", priceMin: 400_000, priceMax: 900_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "warehouse", region: "Northern Melbourne", priceMin: 420_000, priceMax: 950_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "warehouse", region: "South East Melbourne", priceMin: 450_000, priceMax: 1_000_000, frequency: "occasional", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "industrial", region: "Western Melbourne", priceMin: 800_000, priceMax: 2_000_000, frequency: "rare", typicalCompletion: "completed", notes: "VERIFY" },
  { propertyType: "industrial", region: "South East Melbourne", priceMin: 850_000, priceMax: 2_500_000, frequency: "rare", typicalCompletion: "completed", notes: "VERIFY" },
];

const db = getDb();
const existing = listCoverage();

if (existing.length > 0) {
  console.log(`${existing.length} coverage area(s) already recorded — leaving them alone.`);
  console.log("Delete them in Admin → Coverage first if you want to reseed.");
} else {
  const run = db.transaction(() => {
    for (const seed of SEEDS) createCoverage(seed);
  });
  run();
  console.log(`Seeded ${SEEDS.length} starter coverage areas.\n`);
  console.log("NEXT: open Admin → Coverage and correct every band to what you can actually");
  console.log("source. Every row is marked VERIFY until you do.");
}
