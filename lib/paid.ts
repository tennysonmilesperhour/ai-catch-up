// Paid-email allowlist. Reads PAID_EMAILS at request time (Vercel env vars
// can change between deploys but the value is stable within a request, and
// re-reading per call avoids stale module-level caches when Tennyson updates
// the list mid-month).
//
// Format: comma- or whitespace-separated list. Whitespace and case are
// ignored. Examples:
//   PAID_EMAILS=alice@example.com,bob@example.com
//   PAID_EMAILS="alice@example.com bob@example.com"
//
// Behavior:
//   - When PAID_EMAILS is unset or empty, isPaidEmail() returns true for any
//     valid input. This preserves the v1.x "anyone can preview" flow that the
//     login page advertises. Tennyson can flip on enforcement by setting the
//     env var on Vercel; no code change required.
//   - When PAID_EMAILS is set, isPaidEmail() returns true only for listed
//     addresses. Admin emails are NOT auto-included, middleware checks role
//     first, so admins bypass this gate without needing to be on the list.

function parseList(): Set<string> | null {
  const raw = process.env.PAID_EMAILS;
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const items = trimmed
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (items.length === 0) return null;
  return new Set(items);
}

export function isPaidEmail(email: string): boolean {
  const list = parseList();
  // No allowlist configured → preview mode, everyone passes.
  if (list === null) return true;
  return list.has(email.trim().toLowerCase());
}

export function isPaidEnforcementEnabled(): boolean {
  return parseList() !== null;
}
