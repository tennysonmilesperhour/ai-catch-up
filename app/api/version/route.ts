import { NextResponse } from "next/server";

const PROCESS_STAMP = Date.now();

// Source the build identifier in priority order. On Vercel each deploy gets a
// fresh VERCEL_GIT_COMMIT_SHA, so this naturally changes per deploy. Locally
// we fall back to a per-process timestamp so dev never falsely reports stale.
function resolveBuildId(): { buildId: string; source: string } {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return {
      buildId: process.env.VERCEL_GIT_COMMIT_SHA,
      source: "vercel-commit-sha",
    };
  }
  if (process.env.VERCEL_DEPLOYMENT_ID) {
    return {
      buildId: process.env.VERCEL_DEPLOYMENT_ID,
      source: "vercel-deployment-id",
    };
  }
  if (process.env.NEXT_PUBLIC_BUILD_ID) {
    return {
      buildId: process.env.NEXT_PUBLIC_BUILD_ID,
      source: "next-public-build-id",
    };
  }
  return { buildId: `dev-${PROCESS_STAMP}`, source: "dev-process-stamp" };
}

const RESOLVED = resolveBuildId();

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      buildId: RESOLVED.buildId,
      source: RESOLVED.source,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    }
  );
}
