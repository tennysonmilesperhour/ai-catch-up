import { type NexusNode } from "@/components/admin/Nexus";
import { NexusAdmin } from "@/components/admin/NexusAdmin";
import {
  DOMAINS,
  NEXUS_LINKS,
  NEXUS_NODES,
} from "@/content/admin/nexus-data";
import { fetchUserRepos } from "@/lib/github";
import { mergeNexus } from "@/lib/nexus-merge";

export const metadata = { title: "Nexus" };
export const revalidate = 900; // 15 min — matches the GitHub fetch cache

export default async function NexusPage() {
  const outcome = await fetchUserRepos();
  const { nodes, links } =
    outcome.ok
      ? mergeNexus(NEXUS_NODES, NEXUS_LINKS, outcome.repos)
      : { nodes: NEXUS_NODES, links: NEXUS_LINKS };

  const autoCount = outcome.ok
    ? outcome.repos.filter(
        (r) =>
          !NEXUS_NODES.some(
            (n) => n.github && n.github.toLowerCase() === r.name.toLowerCase()
          )
      ).length
    : 0;

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
          </p>
        </div>
        <p className="text-[var(--color-muted-dark)] mt-2 max-w-2xl">
          A living map of the onboarding. Drag a node, hover to see neighbors,
          click to pin. New GitHub repos appear here automatically within 15
          minutes.
        </p>
      </header>
      <NexusAdmin
        domains={DOMAINS}
        nodes={nodes as NexusNode[]}
        links={links}
      />
    </div>
  );
}
