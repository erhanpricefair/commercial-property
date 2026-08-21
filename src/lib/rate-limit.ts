/**
 * Minimal in-process rate limiter for the public form endpoints.
 *
 * Deliberately dependency-free and per-instance: it stops casual abuse and
 * scripted spam without adding infrastructure. Behind multiple instances or a
 * CDN, put a real limiter (Cloudflare, WAF, Upstash) in front — this is a
 * floor, not a ceiling.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > MAX_TRACKED_KEYS) sweep(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
