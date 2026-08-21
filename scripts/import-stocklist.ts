/**
 * Import a commercial stocklist CSV into the PRIVATE opportunity database.
 *
 *   npm run stocklist:import -- ./data/stocklist.csv
 *
 * Every imported row is marked PRIVATE / INTERNAL and is only ever readable by
 * an authenticated admin, or through a tokenised presentation link that an
 * admin explicitly issues.
 *
 * Recognised column headers (case-insensitive, spaces and underscores ignored):
 *   reference / id / opportunity id      → internal opportunity ID
 *   type / property type                 → warehouse | industrial | storage | small commercial
 *   suburb, state
 *   size / sqm / area                    → size in square metres
 *   price
 *   rental / rent / estimated rental     → annual rental
 *   outgoings
 *   yield / estimated yield              → calculated if omitted
 *   completion / completion status
 *   availability / status
 *   developer                            (PRIVATE)
 *   development / development name       (PRIVATE)
 *   address                              (PRIVATE)
 *   lot / unit / lot unit number         (PRIVATE)
 *   source / channel                     (PRIVATE)
 *   notes / internal notes               (PRIVATE)
 *
 * Unknown columns are appended to internal notes rather than discarded.
 */
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/lib/db.ts";
import { computeYield, recomputeAllMatches } from "../src/lib/repositories/opportunities.ts";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run stocklist:import -- <path-to-csv>");
  process.exit(1);
}

const resolved = path.resolve(file);
if (!fs.existsSync(resolved)) {
  console.error(`File not found: ${resolved}`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(resolved, "utf8"));
if (rows.length < 2) {
  console.error("CSV appears to be empty.");
  process.exit(1);
}

const headers = rows[0].map(normaliseHeader);
const db = getDb();

const upsert = db.prepare(`
  INSERT INTO opportunities
    (reference, visibility, property_type, suburb, state, size_sqm, price, estimated_rental,
     outgoings, estimated_yield, completion_status, availability, internal_notes,
     source_channel, developer, development_name, address, lot_unit_number)
  VALUES
    (@reference, 'PRIVATE', @property_type, @suburb, @state, @size_sqm, @price, @estimated_rental,
     @outgoings, @estimated_yield, @completion_status, @availability, @internal_notes,
     @source_channel, @developer, @development_name, @address, @lot_unit_number)
  ON CONFLICT(reference) DO UPDATE SET
    property_type = excluded.property_type,
    suburb = excluded.suburb,
    state = excluded.state,
    size_sqm = excluded.size_sqm,
    price = excluded.price,
    estimated_rental = excluded.estimated_rental,
    outgoings = excluded.outgoings,
    estimated_yield = excluded.estimated_yield,
    completion_status = excluded.completion_status,
    availability = excluded.availability,
    internal_notes = excluded.internal_notes,
    source_channel = excluded.source_channel,
    developer = excluded.developer,
    development_name = excluded.development_name,
    address = excluded.address,
    lot_unit_number = excluded.lot_unit_number,
    updated_at = datetime('now')
`);

let imported = 0;
let skipped = 0;

const run = db.transaction(() => {
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.every((c) => !c.trim())) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim();
    });

    const reference =
      pick(record, ["reference", "id", "opportunityid", "ref", "code"]) || `IMP-${i}`;
    const price = num(pick(record, ["price", "askingprice", "salesprice"]));
    const rental = num(pick(record, ["rental", "rent", "estimatedrental", "annualrent", "income"]));
    const outgoings = num(pick(record, ["outgoings", "outgoing"]));
    const explicitYield = num(pick(record, ["yield", "estimatedyield", "netyield", "grossyield"]));

    const known = new Set([
      "reference", "id", "opportunityid", "ref", "code", "type", "propertytype", "suburb", "state",
      "size", "sqm", "area", "sizesqm", "price", "askingprice", "salesprice", "rental", "rent",
      "estimatedrental", "annualrent", "income", "outgoings", "outgoing", "yield", "estimatedyield",
      "netyield", "grossyield", "completion", "completionstatus", "availability", "status",
      "developer", "development", "developmentname", "project", "address", "lot", "unit",
      "lotunitnumber", "lotnumber", "unitnumber", "source", "channel", "sourcechannel", "notes",
      "internalnotes", "comments",
    ]);
    const extras = headers
      .filter((h) => !known.has(h) && record[h])
      .map((h) => `${h}: ${record[h]}`);

    const baseNotes = pick(record, ["notes", "internalnotes", "comments"]);
    const internalNotes = [baseNotes, ...extras].filter(Boolean).join("\n") || null;

    try {
      upsert.run({
        reference,
        property_type: mapType(pick(record, ["type", "propertytype"])),
        suburb: pick(record, ["suburb"]) || null,
        state: (pick(record, ["state"]) || "VIC").toUpperCase(),
        size_sqm: num(pick(record, ["size", "sqm", "area", "sizesqm"])),
        price,
        estimated_rental: rental,
        outgoings,
        estimated_yield: explicitYield ?? computeYield(price, rental, outgoings),
        completion_status: mapCompletion(pick(record, ["completion", "completionstatus"])),
        availability: mapAvailability(pick(record, ["availability", "status"])),
        internal_notes: internalNotes,
        source_channel: pick(record, ["source", "channel", "sourcechannel"]) || null,
        developer: pick(record, ["developer"]) || null,
        development_name: pick(record, ["development", "developmentname", "project"]) || null,
        address: pick(record, ["address"]) || null,
        lot_unit_number:
          pick(record, ["lot", "unit", "lotunitnumber", "lotnumber", "unitnumber"]) || null,
      });
      imported++;
    } catch (error) {
      skipped++;
      console.warn(`Row ${i + 1} skipped: ${error instanceof Error ? error.message : error}`);
    }
  }
});

run();

const { investors, matches } = recomputeAllMatches();

console.log(`\nImported ${imported} opportunity record(s) as PRIVATE / INTERNAL.`);
if (skipped) console.log(`Skipped ${skipped} row(s).`);
console.log(`Recomputed matches for ${investors} investor(s): ${matches} match(es) total.`);
console.log("\nThese records are visible only to authenticated admins.");

/* ---------------- helpers ---------------- */

function normaliseHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (record[key]) return record[key];
  }
  return "";
}

function num(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapType(value: string): string {
  const v = value.toLowerCase();
  if (v.includes("storage")) return "storage";
  if (v.includes("warehouse") || v.includes("shed")) return "warehouse";
  if (v.includes("industrial") || v.includes("factory")) return "industrial";
  if (v.includes("office") || v.includes("retail") || v.includes("shop") || v.includes("commercial"))
    return "small_commercial";
  return "small_commercial";
}

function mapCompletion(value: string): string | null {
  const v = value.toLowerCase();
  if (!v) return null;
  if (v.includes("complete") || v.includes("built")) return "completed";
  if (v.includes("construction") || v.includes("building")) return "under_construction";
  if (v.includes("plan") && v.includes("off")) return "off_the_plan";
  if (v.includes("plan")) return "planned";
  return null;
}

function mapAvailability(value: string): string {
  const v = value.toLowerCase();
  if (!v) return "available";
  if (v.includes("sold") || v.includes("settled")) return "sold";
  if (v.includes("offer") || v.includes("contract")) return "under_offer";
  if (v.includes("hold") || v.includes("reserved")) return "on_hold";
  if (v.includes("withdraw")) return "withdrawn";
  return "available";
}

/** RFC 4180-ish CSV parser: handles quoted fields, embedded commas and newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const source = text.replace(/^﻿/, "");

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
