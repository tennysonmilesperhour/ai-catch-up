import { loadJson } from "@/lib/content";
import { PulseDashboard } from "@/components/admin/PulseDashboard";

export const metadata = { title: "Pulse" };
export const dynamic = "force-dynamic";

type Prompt = { id: number | string };
type Decision = unknown;

export default function PulsePage() {
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
    <div className="max-w-7xl">
      <header className="admin-header">
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)]">
            Workspace Pulse
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.10em] text-[var(--color-cyan)]">
            Live · this browser
          </p>
        </div>
        <p className="text-[var(--color-muted-dark)] mt-2 max-w-3xl leading-relaxed">
          The dynamic checklist. Pattern signals, recent invocations, and
          suggested next moves are computed from your real workspace state
          (setup progress, prompt usage, API key, decisions). Heuristics
          run in your browser; nothing is sent anywhere.
        </p>
      </header>
      <PulseDashboard
        decisionsCount={decisionsArr.length}
        promptsCount={promptsArr.length}
      />
    </div>
  );
}
