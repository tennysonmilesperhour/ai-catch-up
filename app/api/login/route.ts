import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isValidEmail,
  roleForEmail,
  signSession,
} from "@/lib/session";

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

export async function POST(request: Request) {
  try {
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
