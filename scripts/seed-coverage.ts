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
import { createCoverage, listCoverage } from "../src/lib/repositories/coverage.ts";

type Seed = {
  propertyType: string;
  region: string;
  suburbs: string[];
  priceMin: number;
  priceMax: number;
  frequency: string;
  typicalCompletion?: string;
};

/**
 * Melbourne's established industrial and commercial precincts, by region.
 *
 * This is general market knowledge — which suburbs have this kind of stock —
 * not anyone's stocklist. Suburb with no address, no developer and no lot
 * number is exactly what the coverage table is shaped to hold.
 *
 * The price bands are broad starting points. Yours will differ; that is what
 * the VERIFY marker is for.
 */
const SEEDS: Seed[] = [
  {
    propertyType: "storage",
    region: "northern_melbourne",
    suburbs: ["Coburg North", "Campbellfield", "Thomastown", "Preston", "Reservoir"],
    priceMin: 180_000, priceMax: 320_000, frequency: "occasional", typicalCompletion: "completed",
  },
  {
    propertyType: "storage",
    region: "south_east_melbourne",
    suburbs: ["Braeside", "Moorabbin", "Keysborough", "Mordialloc"],
    priceMin: 190_000, priceMax: 340_000, frequency: "occasional", typicalCompletion: "completed",
  },
  {
    propertyType: "storage",
    region: "eastern_melbourne",
    suburbs: ["Bayswater", "Kilsyth", "Croydon"],
    priceMin: 200_000, priceMax: 330_000, frequency: "occasional", typicalCompletion: "completed",
  },
  {
    propertyType: "warehouse",
    region: "western_melbourne",
    suburbs: ["Truganina", "Laverton North", "Derrimut", "Sunshine", "Ravenhall"],
    priceMin: 400_000, priceMax: 900_000, frequency: "regular", typicalCompletion: "completed",
  },
  {
    propertyType: "warehouse",
    region: "northern_melbourne",
    suburbs: ["Epping", "Somerton", "Craigieburn", "Campbellfield"],
    priceMin: 420_000, priceMax: 950_000, frequency: "occasional", typicalCompletion: "completed",
  },
  {
    propertyType: "warehouse",
    region: "south_east_melbourne",
    suburbs: ["Dandenong South", "Hallam", "Clayton", "Notting Hill"],
    priceMin: 450_000, priceMax: 1_000_000, frequency: "occasional", typicalCompletion: "completed",
  },
  {
    propertyType: "industrial",
    region: "western_melbourne",
    suburbs: ["Truganina", "Laverton North", "Altona North"],
    priceMin: 800_000, priceMax: 2_000_000, frequency: "rare", typicalCompletion: "completed",
  },
  {
    propertyType: "industrial",
    region: "south_east_melbourne",
    suburbs: ["Dandenong South", "Keysborough"],
    priceMin: 850_000, priceMax: 2_500_000, frequency: "rare", typicalCompletion: "completed",
  },
  {
    propertyType: "small_commercial",
    region: "northern_melbourne",
    suburbs: ["Preston", "Brunswick", "Coburg North"],
    priceMin: 300_000, priceMax: 600_000, frequency: "occasional", typicalCompletion: "completed",
  },
  {
    propertyType: "small_commercial",
    region: "ballarat",
    suburbs: ["Ballarat", "Wendouree"],
    priceMin: 250_000, priceMax: 500_000, frequency: "rare", typicalCompletion: "completed",
  },
  {
    propertyType: "small_commercial",
    region: "geelong",
    suburbs: ["Geelong", "North Geelong", "Breakwater"],
    priceMin: 280_000, priceMax: 550_000, frequency: "rare", typicalCompletion: "completed",
  },
];

const db = getDb();
const existing = listCoverage();

if (existing.length > 0) {
  console.log(`${existing.length} coverage area(s) already recorded — leaving them alone.`);
  console.log("Delete them in Admin → Coverage first if you want to reseed.");
} else {
  let created = 0;
  const run = db.transaction(() => {
    for (const seed of SEEDS) {
      for (const suburb of seed.suburbs) {
        createCoverage({
          propertyType: seed.propertyType,
          suburb,
          region: seed.region,
          state: "VIC",
          priceMin: seed.priceMin,
          priceMax: seed.priceMax,
          frequency: seed.frequency,
          typicalCompletion: seed.typicalCompletion,
          notes: "VERIFY: confirm this suburb and band against what you can actually source",
        });
        created++;
      }
    }
  });
  run();
  console.log(`Seeded ${created} suburb-level coverage areas across ${SEEDS.length} precincts.\n`);
  console.log("NEXT: open Admin → Coverage and correct every band to what you can actually");
  console.log("source. Every row is marked VERIFY until you do.");
}
