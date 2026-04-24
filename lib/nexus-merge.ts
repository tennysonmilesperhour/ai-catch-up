import type { GithubRepo } from "@/lib/github";
import type {
  NexusNode as ContentNode,
  NexusLink,
} from "@/content/admin/nexus-data";

export type MergedNode = ContentNode & { synced?: boolean };

// Curated nodes win on descriptive fields; live GitHub data just fills in
// deployment/homepage status and adds new repos we haven't curated yet.
export function mergeNexus(
  base: ContentNode[],
  baseLinks: NexusLink[],
  repos: GithubRepo[]
): { nodes: MergedNode[]; links: NexusLink[] } {
  const byGithubName = new Map<string, ContentNode>();
  for (const n of base) {
    if (n.github) byGithubName.set(n.github.toLowerCase(), n);
  }

  const mergedNodes: MergedNode[] = base.map((n) => {
    if (!n.github) return { ...n };
    const repo = repos.find(
      (r) => r.name.toLowerCase() === n.github!.toLowerCase()
    );
    if (!repo) return { ...n };
    return {
      ...n,
      homepage: repo.homepage || n.homepage,
      deployed: n.deployed ?? !!repo.homepage,
    };
  });

  const newNodes: MergedNode[] = [];
  const newLinks: NexusLink[] = [];
  for (const repo of repos) {
    if (byGithubName.has(repo.name.toLowerCase())) continue;
    // Unknown repo: add it as a real node in the apps domain, synced from
    // GitHub. Forks of other orgs get our fork kind. Size defaults to 3.
    const id = repo.name;
    const kind = repo.fork ? "fork" : "real";
    newNodes.push({
      id,
      label: repo.name,
      domain: "apps",
      kind,
      weight: 3,
      desc:
        repo.description ||
        `Auto-synced from GitHub. No description on the repo yet.`,
      github: repo.name,
      homepage: repo.homepage || undefined,
      deployed: !!repo.homepage,
      synced: true,
    });
    // Gentle link to the core so it joins the orbit rather than floats alone.
    newLinks.push({
      source: "global-memory",
      target: id,
      strength: 0.25,
    });
  }

  return {
    nodes: [...mergedNodes, ...newNodes],
    links: [...baseLinks, ...newLinks],
  };
}
