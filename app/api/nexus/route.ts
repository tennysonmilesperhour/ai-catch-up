// GET /api/nexus
// Returns the merged Nexus (curated TS data + GitHub sync + Hermes
// additions) as JSON so external agents like Hermes can read the same
// graph the admin dashboard sees.

import { NextResponse } from "next/server";
import {
  DOMAINS,
  NEXUS_LINKS,
  NEXUS_NODES,
} from "@/content/admin/nexus-data";
import { fetchUserRepos } from "@/lib/github";
import { mergeNexus } from "@/lib/nexus-merge";
import { readHermesStoreLive } from "@/lib/hermes-store";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rl = rateLimit("nexus-read", clientKey(req.headers), 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests, try again shortly" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
        },
      }
    );
  }

  const [outcome, hermesRead] = await Promise.all([
    fetchUserRepos(),
    readHermesStoreLive(),
  ]);
  const hermes = hermesRead.store;

  const githubMerged = outcome.ok
    ? mergeNexus(NEXUS_NODES, NEXUS_LINKS, outcome.repos)
    : { nodes: NEXUS_NODES, links: NEXUS_LINKS };

  const nodes = [...githubMerged.nodes, ...hermes.nodes];
  const links = [...githubMerged.links, ...hermes.links];

  return NextResponse.json(
    {
      ok: true,
      domains: DOMAINS,
      nodes,
      links,
      provenance: {
        curated: NEXUS_NODES.length,
        github: outcome.ok ? githubMerged.nodes.length - NEXUS_NODES.length : 0,
        hermes: hermes.nodes.length,
        githubSyncOk: outcome.ok,
        // With GITHUB_BLOG_TOKEN set, Hermes nodes are read from GitHub at
        // request time, so a node added via POST /api/nexus/nodes shows up
        // within the 60s CDN cache. Without the token (or if GitHub is
        // failing) this falls back to the deployed file, which only updates
        // on the next deploy; this flag says which one you got.
        hermesEventuallyConsistent: !hermesRead.live,
      },
    },
    {
      // Short CDN cache to blunt repeated unauthenticated reads while keeping
      // data fresh (the GitHub fetch inside has its own 15-min revalidate).
      headers: {
        "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
