import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isValidEmail,
  roleForEmail,
  signSession,
} from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

// Resolve an internal redirect safely. Rejects external origins and
// protocol-relative URLs ("//evil.com"). Only returns a same-origin path
// under /admin when valid.
function safeAdminNext(nextValue: string, baseUrl: string): string | null {
  if (!nextValue) return null;
  try {
    const resolved = new URL(nextValue, baseUrl);
    const expectedOrigin = new URL(baseUrl).origin;
    if (resolved.origin !== expectedOrigin) return null;
    if (!resolved.pathname.startsWith("/admin")) return null;
    return resolved.pathname + resolved.search;
  } catch {
    return null;
  }
}

// CSRF defense: reject form posts that came from a foreign origin. We
// accept Sec-Fetch-Site values of `same-origin`, `same-site`, or `none`
// (browser top-level navigation, e.g. when the user types the URL or
// reloads). When Sec-Fetch-Site is unavailable (older browsers), we fall
// back to comparing the Origin header to the request URL's origin.
function isSameOriginRequest(request: Request): boolean {
  const sfs = request.headers.get("sec-fetch-site");
  if (sfs) {
    return sfs === "same-origin" || sfs === "same-site" || sfs === "none";
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    // No Origin header on the POST. Browsers send Origin on form POSTs,
    // so missing usually means a non-browser client (curl) — let it
    // through; the cookie SameSite=Lax already blocks cross-site forms
    // hitting this from a real browser tab.
    return true;
  }
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "origin");
      return NextResponse.redirect(url, { status: 303 });
    }

    // 5 attempts / 60s per IP. Same bucket for valid+invalid attempts so
    // an attacker can't enumerate emails for free.
    const rl = rateLimit("login", clientKey(request.headers), 5, 60_000);
    if (!rl.ok) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "rate");
      const res = NextResponse.redirect(url, { status: 303 });
      res.headers.set(
        "Retry-After",
        String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)))
      );
      return res;
    }

    const formData = await request.formData();
    const rawEmail = String(formData.get("email") || "");
    const email = rawEmail.trim().toLowerCase();
    const next = String(formData.get("next") || "");

    if (!isValidEmail(email)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "email");
      if (next) url.searchParams.set("next", next);
      return NextResponse.redirect(url, { status: 303 });
    }

    const role = roleForEmail(email);
    const token = await signSession({
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    });

    const adminNext = safeAdminNext(next, request.url);
    // Buyers (non-admin authed users) land on their workspace home
    // (Pulse). Admins go to either ?next= (if it's a safe /admin path)
    // or the Overview dashboard.
    const destination =
      role === "admin" ? (adminNext ?? "/admin") : "/admin/pulse";

    const res = NextResponse.redirect(new URL(destination, request.url), {
      status: 303,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("[api/login] unexpected error:", err);
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "server");
    return NextResponse.redirect(url, { status: 303 });
  }
}
