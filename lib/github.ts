// Fetches the current user's public repos from GitHub at request time so the
// Nexus graph stays in sync with the actual repo list. v1.0 scope: read-only,
// merged at the page boundary, cached for 15 minutes via Next fetch cache.

export type GithubRepo = {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  private: boolean;
  pushed_at: string;
};

export type FetchOutcome =
  | { ok: true; repos: GithubRepo[] }
  | { ok: false; reason: string };

const CACHE_REVALIDATE_SECONDS = 60 * 15;

export async function fetchUserRepos(): Promise<FetchOutcome> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) {
    return { ok: false, reason: "GITHUB_USERNAME env var is not set" };
  }
  const token = process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ai-catch-up/nexus",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`,
      {
        headers,
        next: { revalidate: CACHE_REVALIDATE_SECONDS },
      }
    );
    if (!res.ok) {
      return { ok: false, reason: `GitHub API ${res.status}` };
    }
    const data = (await res.json()) as GithubRepo[];
    if (!Array.isArray(data)) {
      return { ok: false, reason: "Unexpected GitHub response shape" };
    }
    return { ok: true, repos: data.filter((r) => !r.archived) };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "fetch failed",
    };
  }
}
