import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ClaudeMdViewer } from "@/components/admin/ClaudeMdViewer";

export const metadata = { title: "CLAUDE.md" };

const REPO_EDIT_URL =
  "https://github.com/tennysonmilesperhour/ai-catch-up/edit/claude/ai-onboarding-v1-RTsDk/CLAUDE.md";

export default function ClaudeMdPage() {
  const fullPath = join(process.cwd(), "CLAUDE.md");
  let content = "";
  let error: string | null = null;
  try {
    content = readFileSync(fullPath, "utf8");
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not read CLAUDE.md";
  }

  return (
    <div>
      <header className="admin-header">
        <p className="label text-[var(--color-terracotta)] mb-3">
          Loaded into every session
        </p>
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          CLAUDE.md
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl">
          Persistent context Claude Code reads at the start of every session.
          Edit it on GitHub, copy to clipboard, or download a local copy.
        </p>
      </header>

      {error ? (
        <div className="glass-card p-6">
          <p className="label text-[var(--color-magenta)] mb-2">
            Could not load CLAUDE.md
          </p>
          <p className="text-[var(--color-muted-dark)] font-mono text-sm">
            {error}
          </p>
        </div>
      ) : (
        <ClaudeMdViewer
          content={content}
          filename="CLAUDE.md"
          editUrl={REPO_EDIT_URL}
        />
      )}
    </div>
  );
}
