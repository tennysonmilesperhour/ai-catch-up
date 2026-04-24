import { NextResponse } from "next/server";

// Vercel injects VERCEL_GIT_COMMIT_SHA at build time for deployed commits.
// Locally we fall back to a per-process stamp so dev never falsely reports stale.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  `dev-${Date.now()}`;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { buildId: BUILD_ID },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
      },
    }
  );
}
