import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Reject cross-site logout POSTs. Accepts same-origin/same-site/top-level
// navigations; when Sec-Fetch-Site is unavailable, compares Origin to the
// request origin. Mirrors the guard on /api/login.
function isSameOriginRequest(request: Request): boolean {
  const sfs = request.headers.get("sec-fetch-site");
  if (sfs) {
    return sfs === "same-origin" || sfs === "same-site" || sfs === "none";
  }
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "cross-origin logout blocked" }, { status: 403 });
  }
  const res = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
