/**
 * Melbourne calendar helpers.
 *
 * The server runs in UTC and SQLite's `date('now')` is a UTC date. For a
 * Melbourne business that puts every lead between midnight and 10–11am local
 * time on "yesterday" — the busiest hours for a morning call list. Anything
 * that means "today" to the people using the admin goes through here.
 */

const ZONE = "Australia/Melbourne";

/** Today's date in Melbourne as YYYY-MM-DD. */
export function melbourneDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Melbourne's UTC offset, in minutes, at a given instant (600 or 660). */
export function melbourneOffsetMinutes(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((wall - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
}

/**
 * The UTC instant at which today began in Melbourne, in SQLite's text format,
 * ready to compare against `created_at`. (DST changes happen at 2–3am, never
 * at midnight, so the offset at midnight is the offset now unless "now" is
 * within those hours on a changeover night — handled by measuring at midnight.)
 */
export function melbourneDayStartUtc(now: Date = new Date()): string {
  const [y, m, d] = melbourneDate(now).split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d) - melbourneOffsetMinutes(now) * 60_000);
  const start = new Date(Date.UTC(y, m - 1, d) - melbourneOffsetMinutes(guess) * 60_000);
  return start.toISOString().replace("T", " ").slice(0, 19);
}
