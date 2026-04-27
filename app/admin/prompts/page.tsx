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
    <div>
      <header className="mb-10">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Prompts
        </h1>
        <p className="text-[var(--color-muted-dark)]">
          The prompt library. Click any card to expand.
        </p>
      </header>
      {prompts.length === 0 ? (
        <div className="bg-[var(--color-surface)]/55 border border-[var(--color-border)] p-8 md:p-10">
          <p className="label text-[var(--color-terracotta)] mb-3">
            Empty for now
          </p>
          <p className="text-[var(--color-muted-dark)] leading-relaxed max-w-xl">
            The prompt library is waiting on its first batch of prompts from
            Strategy Claude. Once the handoff arrives, this page will light up
            with expandable cards and category filters.
          </p>
        </div>
      ) : (
        <PromptsList prompts={prompts} categories={derivedCategories} />
      )}
    </div>
  );
}
