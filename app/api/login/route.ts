import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isValidEmail,
  signSession,
  type Role,
} from "@/lib/session";
import { clientKey, rateLimit } from "@/lib/rate-limit";

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
    // so missing usually means a non-browser client (curl), let it
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

// Constant-time string comparison so the admin-password check doesn't leak
// via timing. Length still differs early, which is acceptable here.
function constantTimeEqualStr(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
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
    const password = String(formData.get("password") || "");
    const next = String(formData.get("next") || "");

    if (!isValidEmail(email)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "email");
      if (next) url.searchParams.set("next", next);
      return NextResponse.redirect(url, { status: 303 });
    }

    // Admin via the email form is gated by a shared secret. Typing the admin
    // email alone can never grant admin (that was the impersonation hole);
    // it also requires ADMIN_PASSWORD. When ADMIN_PASSWORD is unset, the
    // email form only mints buyer sessions and admin comes via GitHub OAuth.
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "";
    let role: Role = "user";
    if (adminEmail && email === adminEmail && adminPassword) {
      if (password && constantTimeEqualStr(password, adminPassword)) {
        role = "admin";
      } else {
        // Admin email + configured password, but wrong/absent password.
        // Fail with clear feedback instead of silently downgrading.
        const url = new URL("/login", request.url);
        url.searchParams.set("error", "admin_password");
        if (next) url.searchParams.set("next", next);
        return NextResponse.redirect(url, { status: 303 });
      }
    }

    const token = await signSession({
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
    });

    // Admins land on the vendor Overview; buyers on their workspace home.
    const destination = role === "admin" ? "/admin" : "/admin/pulse";

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
