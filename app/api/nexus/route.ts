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
import { readHermesStoreFromDisk } from "@/lib/hermes-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [outcome, hermes] = await Promise.all([
    fetchUserRepos(),
    readHermesStoreFromDisk(),
  ]);

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
      },
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    }
  );
}
