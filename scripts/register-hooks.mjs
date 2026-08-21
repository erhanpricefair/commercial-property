/**
 * Registers the TypeScript/alias resolver hooks.
 * Loaded via `node --import ./scripts/register-hooks.mjs ...`.
 */
import { register } from "node:module";

register("./ts-hooks.mjs", import.meta.url);
