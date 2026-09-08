/**
 * Starter coverage bands.
 *
 * Melbourne's established industrial and commercial precincts, by region —
 * general market knowledge about which suburbs carry which kind of stock, not
 * anyone's stocklist. Suburb with no address, no developer, no lot number.
 *
 * Every seeded row is marked VERIFY. It is scaffolding so the platform is
 * usable in five minutes, not a substitute for knowing your own patch.
 */

export type StarterCoverage = {
  propertyType: string;
  region: string;
  suburbs: string[];
  priceMin: number;
  priceMax: number;
  frequency: string;
  typicalCompletion: string;
};

export const STARTER_COVERAGE: StarterCoverage[] = [
  { propertyType: "storage", region: "northern_melbourne", suburbs: ["Coburg North", "Campbellfield", "Thomastown", "Preston", "Reservoir"], priceMin: 180_000, priceMax: 320_000, frequency: "occasional", typicalCompletion: "completed" },
  { propertyType: "storage", region: "south_east_melbourne", suburbs: ["Braeside", "Moorabbin", "Keysborough", "Mordialloc"], priceMin: 190_000, priceMax: 340_000, frequency: "occasional", typicalCompletion: "completed" },
  { propertyType: "storage", region: "eastern_melbourne", suburbs: ["Bayswater", "Kilsyth", "Croydon"], priceMin: 200_000, priceMax: 330_000, frequency: "occasional", typicalCompletion: "completed" },
  { propertyType: "warehouse", region: "western_melbourne", suburbs: ["Truganina", "Laverton North", "Derrimut", "Sunshine", "Ravenhall"], priceMin: 400_000, priceMax: 900_000, frequency: "regular", typicalCompletion: "completed" },
  { propertyType: "warehouse", region: "northern_melbourne", suburbs: ["Epping", "Somerton", "Craigieburn", "Campbellfield"], priceMin: 420_000, priceMax: 950_000, frequency: "occasional", typicalCompletion: "completed" },
  { propertyType: "warehouse", region: "south_east_melbourne", suburbs: ["Dandenong South", "Hallam", "Clayton", "Notting Hill"], priceMin: 450_000, priceMax: 1_000_000, frequency: "occasional", typicalCompletion: "completed" },
  { propertyType: "industrial", region: "western_melbourne", suburbs: ["Truganina", "Laverton North", "Altona North"], priceMin: 800_000, priceMax: 2_000_000, frequency: "rare", typicalCompletion: "completed" },
  { propertyType: "industrial", region: "south_east_melbourne", suburbs: ["Dandenong South", "Keysborough"], priceMin: 850_000, priceMax: 2_500_000, frequency: "rare", typicalCompletion: "completed" },
  { propertyType: "small_commercial", region: "northern_melbourne", suburbs: ["Preston", "Brunswick", "Coburg North"], priceMin: 300_000, priceMax: 600_000, frequency: "occasional", typicalCompletion: "completed" },
  { propertyType: "small_commercial", region: "ballarat", suburbs: ["Ballarat", "Wendouree"], priceMin: 250_000, priceMax: 500_000, frequency: "rare", typicalCompletion: "completed" },
  { propertyType: "small_commercial", region: "geelong", suburbs: ["Geelong", "North Geelong", "Breakwater"], priceMin: 280_000, priceMax: 550_000, frequency: "rare", typicalCompletion: "completed" },
];

export const STARTER_COVERAGE_COUNT = STARTER_COVERAGE.reduce(
  (total, row) => total + row.suburbs.length,
  0,
);
