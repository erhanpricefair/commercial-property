/**
 * ESM resolver hooks so the CLI scripts can import the app's TypeScript
 * modules directly.
 *
 * Application code uses bundler-style specifiers — extensionless relative
 * imports and the `@/*` alias — because that is what Next.js and the
 * TypeScript config expect. Node's ESM resolver requires explicit extensions,
 * so this hook bridges the two rather than forcing the app to carry `.ts`
 * suffixes everywhere for the benefit of a handful of scripts.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const SRC = pathToFileURL(path.join(process.cwd(), "src") + path.sep).href;

export async function resolve(specifier, context, nextResolve) {
  // `@/foo` → <cwd>/src/foo
  if (specifier.startsWith("@/")) {
    return attempt(SRC + specifier.slice(2), context, nextResolve);
  }

  if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/")) {
    return attempt(specifier, context, nextResolve);
  }

  return nextResolve(specifier, context);
}

async function attempt(specifier, context, nextResolve) {
  const candidates = /\.[cm]?[jt]sx?$/.test(specifier)
    ? [specifier]
    : [`${specifier}.ts`, `${specifier}.tsx`, `${specifier}/index.ts`, specifier];

  let lastError;
  for (const candidate of candidates) {
    try {
      return await nextResolve(candidate, context);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
