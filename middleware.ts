import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Routes under /admin/* that buyers (non-admin authed users) can access.
// Tennyson's vendor-side surfaces (Plan, Schedule, Decisions, Launch
// checklist, Workflows, Nexus map) stay admin-only because they're about
// AI Catch Up the product, not the buyer's own workspace.
const BUYER_ALLOWED = new Set<string>([
  "/admin/pulse",
  "/admin/prompts",
  "/admin/claude-md",
  "/admin/coding-guide",
  "/admin/invocations",
  "/admin/memo",
  "/admin/settings",
]);

function isBuyerAllowed(pathname: string): boolean {
  for (const allowed of BUYER_ALLOWED) {
    if (pathname === allowed || pathname.startsWith(allowed + "/")) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session.role === "admin") {
    return NextResponse.next();
  }

  // Buyer role from here on.
  // Root /admin → send them to their home (Pulse). Tennyson sees the
  // vendor Overview at the same path because his branch above passed.
  if (pathname === "/admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/pulse";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isBuyerAllowed(pathname)) {
    return NextResponse.next();
  }

  // Buyer tried to hit a vendor-only route — send them home.
  const url = request.nextUrl.clone();
  url.pathname = "/admin/pulse";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
