import { type NexusNode } from "@/components/admin/Nexus";
import { NexusAdmin } from "@/components/admin/NexusAdmin";
import {
  DOMAINS,
  NEXUS_LINKS,
  NEXUS_NODES,
} from "@/content/admin/nexus-data";
import { fetchUserRepos } from "@/lib/github";
import { mergeNexus } from "@/lib/nexus-merge";
import { readHermesStoreLive } from "@/lib/hermes-store";

export const metadata = { title: "Nexus" };
// Rendered per request so nodes added from this page appear on reload.
// The GitHub repo list keeps its own 15-minute fetch cache (lib/github.ts).
export const dynamic = "force-dynamic";

export default async function NexusPage() {
  const [outcome, hermesRead] = await Promise.all([
    fetchUserRepos(),
    readHermesStoreLive(),
  ]);
  const hermes = hermesRead.store;
  const serverWrites = !!process.env.GITHUB_BLOG_TOKEN;
  const merged =
    outcome.ok
      ? mergeNexus(NEXUS_NODES, NEXUS_LINKS, outcome.repos)
      : { nodes: NEXUS_NODES, links: NEXUS_LINKS };

  const nodes = [...merged.nodes, ...hermes.nodes];
  const links = [...merged.links, ...hermes.links];

  const autoCount = outcome.ok
    ? outcome.repos.filter(
        (r) =>
          !NEXUS_NODES.some(
            (n) => n.github && n.github.toLowerCase() === r.name.toLowerCase()
          )
      ).length
    : 0;
  const hermesCount = hermes.nodes.filter((n) => n.source !== "admin").length;

  return (
    <div>
      <header className="admin-header">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)]">
            Nexus
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {outcome.ok
              ? `GitHub synced, ${autoCount} auto-added`
              : `GitHub sync off (${outcome.reason})`}
            {hermesCount > 0 ? ` · Hermes contributed ${hermesCount}` : ""}
          </p>
        </div>
        <p className="text-[var(--color-muted-dark)] mt-2 max-w-2xl">
          A living map of the onboarding. Drag a node, hover to see neighbors,
          click to pin it and tick its connection checks. Dashed lines are
          integrations that could exist but are not wired yet; click one to
          see it. New GitHub repos appear here automatically within 15
          minutes. Hermes can read this graph at <code>/api/nexus</code> and
          add nodes via <code>POST /api/nexus/nodes</code>.
        </p>
      </header>
      <NexusAdmin
        domains={DOMAINS}
        nodes={nodes as NexusNode[]}
        links={links}
        serverWrites={serverWrites}
      />
    </div>
  );
}
