import { loadJson } from "@/lib/content";
import { PromptsList, type Prompt } from "@/components/admin/PromptsList";

type PromptsFile =
  | Prompt[]
  | { categories?: string[]; prompts: Prompt[] };

export const metadata = { title: "Prompts" };

export default function PromptsPage() {
  const raw = loadJson<PromptsFile>("admin/prompts.json");
  const prompts = Array.isArray(raw) ? raw : raw.prompts;
  const explicitCategories = !Array.isArray(raw) ? raw.categories : undefined;
  const derivedCategories =
    explicitCategories ?? Array.from(new Set(prompts.map((p) => p.category)));

  return (
    <div className="max-w-7xl">
      <header className="admin-header">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-3">
          Prompt library &middot; {prompts.length} prompts
        </p>
        <h1 className="font-display text-3xl md:text-5xl text-[var(--color-dark)] mb-2 leading-[1.05]">
          Tuned to your{" "}
          <span className="headline-gradient">tone, your tools.</span>
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl mt-3 leading-relaxed">
          Each prompt loads your CLAUDE.md context automatically. Click any
          card to read it in full and copy it.
        </p>
      </header>
      {prompts.length === 0 ? (
        <div className="glass-card p-8 md:p-10">
          <p className="label text-[var(--color-terracotta)] mb-3">
            Empty for now
          </p>
          <p className="text-[var(--color-muted-dark)] leading-relaxed max-w-xl">
            The prompt library is waiting on its first batch of prompts from
            Strategy Claude. Once the handoff arrives, this page will light up
            with cards and category filters.
          </p>
        </div>
      ) : (
        <PromptsList prompts={prompts} categories={derivedCategories} />
      )}
    </div>
  );
}
