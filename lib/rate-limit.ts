// In-memory token-bucket rate limiter. Per-instance state, Vercel serverless
// cold-starts wipe the buckets, so this is a coarse guardrail rather than a
// hardened defense. For real volume, swap to Vercel KV or upstream Vercel
// firewall rules; the API surface stays the same.
//
// Buckets are keyed by IP (resolved via request headers, falling back to a
// constant for missing values). Each bucket holds the request timestamps
// from the last `windowMs`; if the count meets or exceeds `max`, requests
// are denied. Old timestamps are pruned on every check.

type Bucket = { hits: number[] };
const STORE: Map<string, Bucket> = new Map();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Resolve a stable per-client key from request headers. Vercel sets
 * x-forwarded-for; in dev / unknown environments we fall back to a constant
 * so the bucket still applies (just to "all unknown clients" as a group).
 */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export function rateLimit(
  bucketName: string,
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const id = `${bucketName}:${key}`;
  let bucket = STORE.get(id);
  if (!bucket) {
    bucket = { hits: [] };
    STORE.set(id, bucket);
  }
  // Prune expired hits.
  const cutoff = now - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > cutoff);
  if (bucket.hits.length >= max) {
    const earliest = bucket.hits[0] ?? now;
    return { ok: false, remaining: 0, resetAt: earliest + windowMs };
  }
  bucket.hits.push(now);
  return {
    ok: true,
    remaining: max - bucket.hits.length,
    resetAt: now + windowMs,
  };
}

// Periodic prune so STORE doesn't grow unbounded across long-lived
// processes (fine for serverless because each instance is short-lived,
// but harmless to do anyway).
let lastPrune = 0;
const PRUNE_INTERVAL = 60_000;
export function maybePruneStore(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL) return;
  lastPrune = now;
  // Drop empty/stale buckets.
  for (const [id, bucket] of STORE) {
    if (bucket.hits.length === 0) STORE.delete(id);
  }
}
