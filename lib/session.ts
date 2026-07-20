export type Role = "admin" | "user";

export type SessionPayload = {
  email: string;
  role: Role;
  iat: number;
};

export const SESSION_COOKIE = "ac_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const norm = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(norm);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

let warnedMissingSecret = false;

// In local dev only, if SESSION_SECRET is not set we fall back to a random
// secret generated at module load so `npm run dev` works without ceremony.
// The fallback is NOT a hardcoded string, so nobody can forge a cookie by
// reading this source file. In production we refuse to use it (see
// getSecret): a per-process random key cannot verify across serverless
// instances, which shows up as users being "randomly logged out" and is far
// more confusing than a loud failure.
const FALLBACK_SECRET = (() => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
})();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  // Missing or too-short secret. In production, fail loudly instead of
  // silently signing with an unstable per-process key. Only /admin, /setup,
  // and the auth routes import this module, so the public marketing site
  // stays up; the auth paths surface a clear error and log the reason.
  if (process.env.NODE_ENV === "production") {
    if (!warnedMissingSecret) {
      console.error(
        "[session] SESSION_SECRET is missing or shorter than 16 chars. Authentication is disabled until it is set on Vercel (32+ random chars)."
      );
      warnedMissingSecret = true;
    }
    throw new Error("SESSION_SECRET is not configured");
  }

  if (!warnedMissingSecret) {
    console.warn(
      "[session] SESSION_SECRET env var is missing or too short. Using a per-process random fallback for local dev only. Set SESSION_SECRET (32+ random chars) before deploying."
    );
    warnedMissingSecret = true;
  }
  return FALLBACK_SECRET;
}

async function importKey(): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const bodyBytes = new TextEncoder().encode(JSON.stringify(payload));
  const body = b64url(bodyBytes);
  const key = await importKey();
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
  );
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const key = await importKey();
    const expected = new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
    );
    const got = b64urlDecode(sig);
    if (!constantTimeEqual(expected, got)) return null;
    const bodyStr = new TextDecoder().decode(b64urlDecode(body));
    const payload = JSON.parse(bodyStr) as SessionPayload;
    if (!payload.email || !payload.role) return null;
    // Server-side expiry. The browser cookie has its own maxAge, but a
    // captured token must not verify forever, so we reject anything older
    // than SESSION_MAX_AGE (iat is in seconds). The small negative window
    // tolerates minor clock skew between instances.
    if (typeof payload.iat !== "number") return null;
    const ageSeconds = Math.floor(Date.now() / 1000) - payload.iat;
    if (ageSeconds > SESSION_MAX_AGE || ageSeconds < -300) return null;
    return payload;
  } catch {
    return null;
  }
}

export function roleForEmail(email: string): Role {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  return email.trim().toLowerCase() === adminEmail && adminEmail !== ""
    ? "admin"
    : "user";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}
