/**
 * Create or update the database schema.
 *   npm run db:migrate
 */
import { getDb } from "../src/lib/db.ts";

const db = getDb();
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
  .all() as { name: string }[];

console.log(`Schema ready. ${tables.length} tables:`);
for (const table of tables) console.log(`  - ${table.name}`);
