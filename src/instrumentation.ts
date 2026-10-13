/**
 * Runs once when the Next.js server starts. Starts the background email
 * dispatcher and housekeeping (see src/lib/jobs.ts).
 *
 * The import must stay inside the literal `NEXT_RUNTIME === "nodejs"` test:
 * Next replaces it at build time, which is what keeps the database driver out
 * of the edge (middleware) bundle.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.BACKGROUND_JOBS === "off") return;
    const { startBackgroundJobs } = await import("./lib/jobs");
    startBackgroundJobs();
  }
}
