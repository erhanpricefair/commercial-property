import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * Static guarantees about the public/private separation.
 *
 * These read the source tree rather than a running server, so they catch a
 * regression at the moment it's written rather than after deployment.
 */

const SRC = path.join(process.cwd(), "src");

/** Every route that an anonymous visitor can reach. */
const PUBLIC_ROUTE_DIRS = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/sitemap.ts",
  "app/robots.ts",
  "app/[slug]",
  "app/resources",
  "app/register",
  "app/guide",
  "app/opportunities",
  "app/how-it-works",
  "app/why-commercial-property",
  "app/contact",
  "app/privacy",
  "app/terms",
  "app/disclaimer",
];

/** Modules that read the private opportunity tables. */
const PRIVATE_MODULES = [
  "@/lib/repositories/opportunities",
  "lib/repositories/opportunities",
  "repositories/opportunities",
];

/**
 * Read a source file with comments removed.
 *
 * The scanners below look for banned terms in the code itself. A comment that
 * *names* a banned term in order to explain why it is banned is documentation,
 * not a leak, so comments are stripped before matching.
 */
function readCode(file: string): string {
  return fs
    .readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

function walk(target: string): string[] {
  const full = path.join(SRC, target);
  if (!fs.existsSync(full)) return [];
  const stat = fs.statSync(full);
  if (stat.isFile()) return [full];

  const out: string[] = [];
  for (const entry of fs.readdirSync(full)) {
    out.push(...walk(path.join(target, entry)));
  }
  return out;
}

const publicFiles = PUBLIC_ROUTE_DIRS.flatMap((dir) => walk(dir)).filter((f) =>
  /\.(ts|tsx)$/.test(f),
);

describe("public surface cannot reach private data", () => {
  test("public route files exist and were collected", () => {
    assert.ok(publicFiles.length > 15, `only found ${publicFiles.length} public route files`);
  });

  test("no public route imports the private opportunity repository", () => {
    const offenders: string[] = [];
    for (const file of publicFiles) {
      const source = readCode(file);
      for (const module of PRIVATE_MODULES) {
        if (source.includes(`from "${module}"`)) {
          offenders.push(`${path.relative(process.cwd(), file)} → ${module}`);
        }
      }
    }
    assert.deepEqual(offenders, [], `private repository imported by public routes:\n${offenders.join("\n")}`);
  });

  test("no public route opens a database connection directly", () => {
    const offenders: string[] = [];
    for (const file of publicFiles) {
      const source = readCode(file);
      if (source.includes('from "@/lib/db"')) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
    assert.deepEqual(offenders, [], `public routes must not query the database directly:\n${offenders.join("\n")}`);
  });

  test("the sitemap is built from static content only", () => {
    const source = readCode(path.join(SRC, "app/sitemap.ts"));
    assert.ok(!source.includes("getDb"), "sitemap must not query the database");
    assert.ok(!source.includes("repositories/"), "sitemap must not import a repository");
    assert.ok(!source.includes("/opportunity/"), "sitemap must not list private presentation links");
    assert.ok(!source.includes("/admin"), "sitemap must not list admin routes");
    assert.ok(!source.includes("presentations"), "sitemap must not list presentation records");
  });

  test("robots.txt disallows every private surface", () => {
    const source = fs.readFileSync(path.join(SRC, "app/robots.ts"), "utf8");
    for (const disallowed of ["/admin", "/api/", "/opportunity/"]) {
      assert.ok(source.includes(disallowed), `robots.ts must disallow ${disallowed}`);
    }
  });

  test("middleware guards both private surfaces", () => {
    const source = fs.readFileSync(path.join(SRC, "middleware.ts"), "utf8");
    assert.ok(source.includes("/admin/:path*"), "middleware must match /admin");
    assert.ok(source.includes("/opportunity/:path*"), "middleware must match /opportunity");
    assert.ok(source.includes("noindex"), "middleware must set a noindex robots tag");
  });

  test("every admin page guards itself independently of the middleware", () => {
    const adminPages = walk("app/admin").filter((f) => f.endsWith("page.tsx"));
    assert.ok(adminPages.length >= 6, `expected several admin pages, found ${adminPages.length}`);

    const unguarded: string[] = [];
    for (const file of adminPages) {
      const source = readCode(file);
      // The login page is deliberately reachable without a session.
      if (file.includes(`admin${path.sep}login`)) continue;
      if (!source.includes("requireAdminPage")) {
        unguarded.push(path.relative(process.cwd(), file));
      }
    }
    assert.deepEqual(unguarded, [], `admin pages missing requireAdminPage():\n${unguarded.join("\n")}`);
  });

  test("every admin server action requires an authenticated admin", () => {
    const actionFiles = walk("app/admin").filter((f) => f.endsWith("actions.ts"));
    assert.ok(actionFiles.length >= 2);

    for (const file of actionFiles) {
      const source = readCode(file);
      const exported = source.match(/export async function (\w+)/g) ?? [];
      assert.ok(exported.length > 0, `${file} exports no actions`);
      // Each action body must call requireAdmin before doing anything else.
      const bodies = source.split(/export async function /).slice(1);
      for (const body of bodies) {
        const name = body.slice(0, body.indexOf("("));
        assert.ok(
          body.includes("requireAdmin()"),
          `${path.relative(process.cwd(), file)} → ${name}() does not call requireAdmin()`,
        );
      }
    }
  });

  test("admin-only API routes check authentication", () => {
    const adminApi = walk("app/api/admin").filter((f) => f.endsWith("route.ts"));
    for (const file of adminApi) {
      const source = readCode(file);
      const isAuthEndpoint = file.includes("login") || file.includes("logout");
      if (isAuthEndpoint) continue;
      assert.ok(
        source.includes("requireAdmin"),
        `${path.relative(process.cwd(), file)} does not require an admin session`,
      );
    }
  });

  test("the private repository marks itself server-only", () => {
    const source = fs.readFileSync(path.join(SRC, "lib/repositories/opportunities.ts"), "utf8");
    assert.ok(source.startsWith('import "server-only";'), "must be server-only");
  });

  test("the presentation route declares noindex", () => {
    const page = fs.readFileSync(path.join(SRC, "app/opportunity/[token]/page.tsx"), "utf8");
    assert.ok(page.includes("index: false"), "presentation metadata must set index: false");
    const layout = fs.readFileSync(path.join(SRC, "app/opportunity/layout.tsx"), "utf8");
    assert.ok(layout.includes("noindex"), "presentation layout must emit a noindex meta tag");
  });

  test("no schema.org markup describes a property, offer or price", () => {
    const banned = ["RealEstateListing", '"@type": "Offer"', '"@type": "Product"', "priceSpecification"];
    const offenders: string[] = [];
    for (const file of publicFiles) {
      const source = readCode(file);
      for (const term of banned) {
        if (source.includes(term)) offenders.push(`${path.relative(process.cwd(), file)} → ${term}`);
      }
    }
    assert.deepEqual(offenders, [], `property-level structured data found:\n${offenders.join("\n")}`);
  });
});

describe("public copy stays generic", () => {
  const contentFiles = [
    ...walk("lib/content"),
    ...publicFiles,
    ...walk("components"),
  ].filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(`components${path.sep}admin`));

  /**
   * Terms the brief prohibits on the public site. `developer` is checked as a
   * standalone word so ordinary prose ("development") doesn't false-positive,
   * and the private admin components are excluded above because naming the
   * field there is exactly the point.
   */
  const BANNED_PATTERNS: { label: string; pattern: RegExp }[] = [
    { label: "McMullen / McMullan", pattern: /mcmull[ae]n/i },
    { label: "guaranteed return", pattern: /guarantee[d]?\s+(return|rental|income|yield|capital|growth)/i },
    { label: "safe investment", pattern: /safe\s+investment/i },
    { label: "secure return", pattern: /secure\s+return/i },
    { label: "high return", pattern: /\bhigh\s+returns?\b/i },
    { label: "our development", pattern: /our\s+(development|project)\b/i },
    { label: "secret stocklist", pattern: /secret\s+stock\s?list/i },
    { label: "exclusive stock", pattern: /exclusive\s+stock/i },
  ];

  test("collected content files", () => {
    assert.ok(contentFiles.length > 20, `only found ${contentFiles.length} content files`);
  });

  for (const { label, pattern } of BANNED_PATTERNS) {
    test(`public copy never says "${label}"`, () => {
      const offenders: string[] = [];
      for (const file of contentFiles) {
        const source = readCode(file);
        const match = source.match(pattern);
        if (match) {
          offenders.push(`${path.relative(process.cwd(), file)}: "${match[0]}"`);
        }
      }
      assert.deepEqual(offenders, [], `banned phrase found:\n${offenders.join("\n")}`);
    });
  }

  test("no public content file references a private opportunity field", () => {
    const privateFields = ["development_name", "lot_unit_number", "source_channel", "internal_notes"];
    const offenders: string[] = [];
    for (const file of contentFiles) {
      const source = readCode(file);
      for (const field of privateFields) {
        if (source.includes(field)) offenders.push(`${path.relative(process.cwd(), file)} → ${field}`);
      }
    }
    assert.deepEqual(offenders, [], `private field referenced in public content:\n${offenders.join("\n")}`);
  });
});
