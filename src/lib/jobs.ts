import "server-only";
import { dispatchDueEmails } from "./email/dispatch";
import { purgeOldPartials } from "./repositories/funnel";
import { purgeExpiredSessions } from "./auth";

/**
 * Background housekeeping, run inside the web server process.
 *
 * Queued email used to depend on someone scheduling `npm run email:dispatch`
 * — and the production image is a standalone Next build in which that script
 * can't run — so in practice confirmations and guide links were queued and
 * never sent. The privacy policy also promises unfinished registrations are
 * removed after 90 days, which only happened if someone pressed a button.
 *
 * One machine, one SQLite file (see fly.toml): an in-process timer is the
 * simplest thing that is actually reliable here. If the app is ever scaled to
 * several machines, move this to a single scheduled machine instead.
 */

let started = false;
let running = false;

export function startBackgroundJobs(): void {
  if (started) return;
  started = true;

  const seconds = Math.max(30, Number(process.env.EMAIL_DISPATCH_INTERVAL_SECONDS ?? 300) || 300);
  const timer = setInterval(() => void runOnce(), seconds * 1000);
  timer.unref();
  // First pass shortly after boot, not immediately — let the server come up.
  setTimeout(() => void runOnce(), 15_000).unref();
}

export async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    // Log mode would only print to the server log — and mark nothing sent —
    // so there is no point draining the queue until a provider is configured.
    const provider = (process.env.EMAIL_PROVIDER ?? "log").toLowerCase();
    if (provider !== "log") {
      const result = await dispatchDueEmails(50);
      if (result.attempted) {
        console.log(
          `[jobs] email: attempted ${result.attempted}, sent ${result.sent}, failed ${result.failed}, suppressed ${result.suppressed}`,
        );
      }
    }
    purgeOldPartials(90);
    purgeExpiredSessions();
  } catch (error) {
    console.error("[jobs] background run failed:", error instanceof Error ? error.message : error);
  } finally {
    running = false;
  }
}
