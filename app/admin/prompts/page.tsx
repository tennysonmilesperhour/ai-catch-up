import { loadJson } from "@/lib/content";
import { PromptsList, type Prompt } from "@/components/admin/PromptsList";

type PromptsFile = {
  categories?: string[];
  prompts: Prompt[];
};

export const metadata = { title: "Prompts" };

export default function PromptsPage() {
  const { prompts, categories } = loadJson<PromptsFile>("admin/prompts.json");
  const derivedCategories =
    categories ?? Array.from(new Set(prompts.map((p) => p.category)));

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
      <PromptsList prompts={prompts} categories={derivedCategories} />
    </div>
  );
}
