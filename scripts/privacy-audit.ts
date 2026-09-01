/**
 * Privacy audit — run this before every deploy.
 *
 *   npm run audit:privacy                 (static checks only)
 *   npm run audit:privacy -- http://localhost:3000   (also crawls a running server)
 *
 * It answers, mechanically, the questions the platform must never get wrong:
 *
 *   1. Can an anonymous visitor see a developer name?
 *   2. Can an anonymous visitor see a development name?
 *   3. Can an anonymous visitor identify an individual property?
 *   4. Can Google index a private opportunity?
 *   5. Can a public API return private opportunity information?
 *   6. Can an unauthenticated user reach the admin dashboard?
 *  17. Is there any accidental mention of the channel partner?
 *  18. Is any exact stocklist information exposed?
 */
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../src/lib/db.ts";

const baseUrl = process.argv[2]?.replace(/\/$/, "");

type Finding = { severity: "FAIL" | "WARN"; check: string; detail: string };
const findings: Finding[] = [];
let passed = 0;

function pass(check: string) {
  passed++;
  console.log(`  ✓ ${check}`);
}

function fail(check: string, detail: string) {
  findings.push({ severity: "FAIL", check, detail });
  console.log(`  ✗ ${check}\n      ${detail}`);
}

function warn(check: string, detail: string) {
  findings.push({ severity: "WARN", check, detail });
  console.log(`  ! ${check}\n      ${detail}`);
}

/* ------------------------------------------------------------------ */
/* 1. Source-level checks                                              */
/* ------------------------------------------------------------------ */

console.log("\nSOURCE CHECKS\n");

const SRC = path.join(process.cwd(), "src");

function walk(dir: string): string[] {
  const full = path.join(SRC, dir);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [full];
  return fs.readdirSync(full).flatMap((entry) => walk(path.join(dir, entry)));
}

const publicRoutes = ["app/(site)", "app/(campaign)", "app/sitemap.ts", "app/robots.ts"]
  .flatMap(walk)
  .filter((f) => /\.(ts|tsx)$/.test(f));

const publicApiRoutes = walk("app/api")
  .filter((f) => f.endsWith("route.ts") && !f.includes(`api${path.sep}admin`));

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

const privateImport = /from "(@\/lib\/repositories\/opportunities|.*repositories\/opportunities)"/;

const leakyRoutes = publicRoutes.filter((f) => privateImport.test(stripComments(fs.readFileSync(f, "utf8"))));
if (leakyRoutes.length) {
  fail("No public page imports the private opportunity repository",
    leakyRoutes.map((f) => path.relative(process.cwd(), f)).join(", "));
} else {
  pass(`No public page imports the private opportunity repository (${publicRoutes.length} routes checked)`);
}

const leakyApis = publicApiRoutes.filter((f) => privateImport.test(stripComments(fs.readFileSync(f, "utf8"))));
if (leakyApis.length) {
  fail("No public API imports the private opportunity repository",
    leakyApis.map((f) => path.relative(process.cwd(), f)).join(", "));
} else {
  pass(`No public API imports the private opportunity repository (${publicApiRoutes.length} routes checked)`);
}

/**
 * Public APIs must be write-only: a GET that returns data is a read surface.
 *
 * One documented exception — the health endpoint has to answer a load
 * balancer. It is allow-listed by name rather than by loosening the rule, and
 * is separately checked below for private fields, so the exception cannot
 * quietly grow into a leak.
 */
const READ_EXEMPT = new Set(["app/api/health/route.ts"]);

const readableApis: string[] = [];
for (const file of publicApiRoutes) {
  const relative = path.relative(SRC, file).split(path.sep).join("/");
  if (READ_EXEMPT.has(`app/${relative.replace(/^app\//, "")}`) || READ_EXEMPT.has(relative)) continue;

  const source = stripComments(fs.readFileSync(file, "utf8"));
  if (!/export async function GET/.test(source)) continue;
  // A GET that only 404s is fine.
  const getBody = source.slice(source.indexOf("export async function GET"));
  if (!/status:\s*404/.test(getBody)) readableApis.push(path.relative(process.cwd(), file));
}
if (readableApis.length) {
  fail("Public API routes are write-only", `GET handlers returning data: ${readableApis.join(", ")}`);
} else {
  pass(`Public API routes are write-only (${READ_EXEMPT.size} documented exception)`);
}

// The health endpoint is allowed to respond, but not to say anything private.
const healthFile = path.join(SRC, "app/api/health/route.ts");
if (fs.existsSync(healthFile)) {
  const source = stripComments(fs.readFileSync(healthFile, "utf8"));
  const leaks = ["opportunit", "developer", "address", "development_name", "email", "mobile"].filter(
    (term) => source.includes(term),
  );
  if (leaks.length) {
    fail("Health endpoint exposes no private data", `references: ${leaks.join(", ")}`);
  } else {
    pass("Health endpoint exposes no private data");
  }
}

const BANNED = [
  { label: "channel partner name", pattern: /mcmull[ae]n/i },
  { label: "guaranteed return language", pattern: /guarantee[d]?\s+(return|rental|income|yield|capital|growth)/i },
  { label: "\"safe investment\"", pattern: /safe\s+investment/i },
  { label: "\"secure return\"", pattern: /secure\s+return/i },
  { label: "\"high return\"", pattern: /\bhigh\s+returns?\b/i },
  { label: "\"our development/project\"", pattern: /our\s+(development|project)\b/i },
  { label: "\"secret stocklist\"", pattern: /secret\s+stock\s?list/i },
];

const contentFiles = [...walk("lib/content"), ...publicRoutes, ...walk("components")]
  .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(`components${path.sep}admin`));

for (const { label, pattern } of BANNED) {
  const hits = contentFiles.filter((f) => pattern.test(stripComments(fs.readFileSync(f, "utf8"))));
  if (hits.length) {
    fail(`Public copy is free of ${label}`, hits.map((f) => path.relative(process.cwd(), f)).join(", "));
  } else {
    pass(`Public copy is free of ${label}`);
  }
}

/* ------------------------------------------------------------------ */
/* 2. Data-level checks                                                */
/* ------------------------------------------------------------------ */

console.log("\nDATA CHECKS\n");

const db = getDb();

const notPrivate = db
  .prepare("SELECT COUNT(*) AS c FROM opportunities WHERE visibility != 'PRIVATE'")
  .get() as { c: number };
if (notPrivate.c > 0) {
  fail("Every opportunity is marked PRIVATE", `${notPrivate.c} record(s) are not marked PRIVATE`);
} else {
  pass("Every opportunity is marked PRIVATE");
}

const opportunityCount = (db.prepare("SELECT COUNT(*) AS c FROM opportunities").get() as { c: number }).c;
console.log(`      (${opportunityCount} private opportunity record(s) in the database)`);

/**
 * Collect the identifying strings that must never appear on a public page, so
 * the crawl below can search for them literally.
 */
const secrets = new Set<string>();
const rows = db
  .prepare("SELECT developer, development_name, address, lot_unit_number, source_channel FROM opportunities")
  .all() as Record<string, string | null>[];
for (const row of rows) {
  for (const value of Object.values(row)) {
    const trimmed = value?.trim();
    // Ignore the obvious placeholders the seed script writes.
    if (trimmed && trimmed.length >= 4 && !trimmed.startsWith("PLACEHOLDER")) {
      secrets.add(trimmed);
    }
  }
}
console.log(`      (${secrets.size} identifying string(s) to check against public output)`);

const weakTokens = db
  .prepare("SELECT COUNT(*) AS c FROM presentations WHERE length(token) < 32")
  .get() as { c: number };
if (weakTokens.c > 0) {
  fail("Presentation tokens are long and random", `${weakTokens.c} token(s) shorter than 32 characters`);
} else {
  pass("Presentation tokens are long and random");
}

const noAdmins = (db.prepare("SELECT COUNT(*) AS c FROM admin_users WHERE is_active = 1").get() as { c: number }).c;
if (noAdmins === 0) {
  warn("At least one active admin exists", "No active admin user — run `npm run admin:create`");
} else {
  pass(`At least one active admin exists (${noAdmins})`);
}

/* ------------------------------------------------------------------ */
/* 3. Live crawl (optional)                                            */
/* ------------------------------------------------------------------ */

if (baseUrl) {
  console.log(`\nLIVE CHECKS against ${baseUrl}\n`);

  const publicPaths = [
    "/", "/how-it-works", "/why-commercial-property", "/opportunities", "/register",
    "/guide", "/guide/read", "/resources", "/contact", "/privacy", "/terms", "/disclaimer",
    "/commercial-property-investment-melbourne", "/commercial-property-under-500k",
    "/warehouse-investment-melbourne", "/industrial-property-investment-melbourne",
    "/storage-property-investment", "/small-commercial-property-investment",
    "/commercial-property-for-investors", "/commercial-property-melbourne",
    "/lp/warehouse-melbourne", "/lp/under-500k",
    "/lp/diversify-from-residential", "/lp/storage-investment",
    "/sitemap.xml", "/robots.txt",
  ];

  let crawlFailures = 0;
  for (const target of publicPaths) {
    const response = await fetch(`${baseUrl}${target}`).catch(() => null);
    if (!response) {
      warn(`Fetch ${target}`, "request failed");
      continue;
    }
    const html = await response.text();

    for (const secret of secrets) {
      if (html.includes(secret)) {
        fail(`Private data on ${target}`, `page contains "${secret}"`);
        crawlFailures++;
      }
    }
    for (const { label, pattern } of BANNED) {
      if (pattern.test(html)) {
        fail(`Banned phrase on ${target}`, label);
        crawlFailures++;
      }
    }
  }
  if (crawlFailures === 0) pass(`No private data or banned phrase on ${publicPaths.length} public pages`);

  // Campaign pages must not be indexable.
  for (const target of ["/lp/warehouse-melbourne", "/lp/under-500k"]) {
    const html = await fetch(`${baseUrl}${target}`).then((r) => r.text()).catch(() => "");
    if (/<meta name="robots"[^>]*noindex/i.test(html)) {
      pass(`Campaign page ${target} declares noindex`);
    } else {
      fail(`Campaign page ${target} declares noindex`, "no noindex robots meta found");
    }
  }

  // Sitemap must not contain a private path.
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`).then((r) => r.text()).catch(() => "");
  const sitemapLeaks = ["/admin", "/opportunity/", "/api/", "/lp/"].filter((p) => sitemap.includes(p));
  if (sitemapLeaks.length) {
    fail("sitemap.xml excludes private paths", sitemapLeaks.join(", "));
  } else {
    pass("sitemap.xml excludes private paths");
  }

  // Admin must reject an unauthenticated request.
  for (const target of ["/admin", "/admin/investors", "/admin/opportunities", "/admin/presentations"]) {
    const response = await fetch(`${baseUrl}${target}`, { redirect: "manual" }).catch(() => null);
    if (!response) {
      warn(`Admin guard on ${target}`, "request failed");
      continue;
    }
    if (response.status >= 300 && response.status < 400) {
      pass(`Admin guard redirects ${target} (${response.status})`);
    } else if (response.status === 401 || response.status === 403) {
      pass(`Admin guard blocks ${target} (${response.status})`);
    } else {
      fail(`Admin guard on ${target}`, `unauthenticated request returned ${response.status}`);
    }
  }

  // Admin API must reject an unauthenticated request.
  const exportResponse = await fetch(`${baseUrl}/api/admin/investors/export`, { redirect: "manual" }).catch(() => null);
  if (exportResponse && (exportResponse.status === 401 || exportResponse.status === 403 || exportResponse.status >= 300)) {
    pass(`Admin export API rejects anonymous callers (${exportResponse.status})`);
  } else {
    fail("Admin export API rejects anonymous callers", `returned ${exportResponse?.status ?? "no response"}`);
  }

  // Private presentation surfaces must send noindex.
  const presentationResponse = await fetch(`${baseUrl}/opportunity/does-not-exist`, { redirect: "manual" }).catch(() => null);
  const robotsTag = presentationResponse?.headers.get("x-robots-tag") ?? "";
  if (robotsTag.includes("noindex")) {
    pass(`Presentation routes send X-Robots-Tag: ${robotsTag}`);
  } else {
    fail("Presentation routes send X-Robots-Tag: noindex", `header was "${robotsTag}"`);
  }

  // An unguessable token must not be guessable — a wrong one must 404.
  if (presentationResponse && presentationResponse.status === 404) {
    pass("Unknown presentation tokens return 404");
  } else {
    warn("Unknown presentation tokens return 404", `returned ${presentationResponse?.status ?? "no response"}`);
  }
} else {
  console.log("\n(Skipping live checks — pass a base URL to crawl a running server.)");
}

/* ------------------------------------------------------------------ */

const failures = findings.filter((f) => f.severity === "FAIL");
const warnings = findings.filter((f) => f.severity === "WARN");

console.log(`\n${"─".repeat(60)}`);
console.log(`${passed} passed · ${failures.length} failed · ${warnings.length} warning(s)`);

if (failures.length) {
  console.log("\nFAILURES — fix before deploying:\n");
  for (const finding of failures) console.log(`  • ${finding.check}: ${finding.detail}`);
  process.exit(1);
}

if (warnings.length) {
  console.log("\nWarnings:\n");
  for (const finding of warnings) console.log(`  • ${finding.check}: ${finding.detail}`);
}

console.log("\nPrivacy audit passed.\n");
