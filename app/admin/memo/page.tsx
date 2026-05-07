import { loadJson } from "@/lib/content";
import { MemoGenerator } from "@/components/admin/MemoGenerator";

export const metadata = { title: "Memo" };

type Prompt = { id: number | string };
type Decision = unknown;

export default function MemoPage() {
  const prompts = loadJson<Prompt[] | { prompts: Prompt[] }>(
    "admin/prompts.json"
  );
  const promptsArr = Array.isArray(prompts) ? prompts : prompts.prompts;
  const decisions = loadJson<Decision[] | { decisions: Decision[] }>(
    "admin/decisions.json"
  );
  const decisionsArr = Array.isArray(decisions)
    ? decisions
    : decisions.decisions;

  return (
    <div className="max-w-4xl">
      <header className="admin-header">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)]">
          Monthly memo
        </h1>
        <p className="text-[var(--color-muted-dark)] mt-2 max-w-3xl leading-relaxed">
          A 30-day distillation: what moved, what stalled, the next three
          moves. Auto-fed by your workspace state. Run it once a month;
          re-read it before you plan the next.
        </p>
      </header>
      <MemoGenerator
        promptsCount={promptsArr.length}
        decisionsCount={decisionsArr.length}
      />
    </div>
  );
}
