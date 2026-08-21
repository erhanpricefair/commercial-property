/**
 * Send any queued follow-up email whose scheduled time has arrived.
 *
 *   npm run email:dispatch
 *
 * Intended to run on a schedule (cron, systemd timer, a platform scheduled
 * function). With EMAIL_PROVIDER unset it prints the messages rather than
 * sending them, which is useful for checking template output.
 */
import { dispatchDueEmails } from "../src/lib/email/dispatch.ts";

const result = await dispatchDueEmails(50);
console.log(
  `Attempted ${result.attempted} · sent ${result.sent} · failed ${result.failed}` +
    (process.env.EMAIL_PROVIDER ? "" : "  (EMAIL_PROVIDER not set — log mode)"),
);
