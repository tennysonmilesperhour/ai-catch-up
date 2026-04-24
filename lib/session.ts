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

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET env var is missing or too short (need at least 16 chars)"
    );
  }
  return secret;
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
