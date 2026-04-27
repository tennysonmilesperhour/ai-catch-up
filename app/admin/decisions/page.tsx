import { loadJson } from "@/lib/content";

type Decision = {
  decision: string;
  rationale: string;
};

export const metadata = { title: "Decisions" };

export default function DecisionsPage() {
  const decisions = loadJson<Decision[]>("admin/decisions.json");

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Decisions
        </h1>
        <p className="text-[var(--color-muted-dark)]">
          Locked decisions and why. Not up for debate unless there is new
          information.
        </p>
      </header>

      <ul className="grid gap-4">
        {decisions.map((d, i) => (
          <li
            key={i}
            className="glass-card p-6 md:p-7"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="font-serif text-lg md:text-xl text-[var(--color-dark)]">
                {d.decision}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-1 border border-[var(--color-dark)] text-[var(--color-dark)] whitespace-nowrap">
                Locked
              </span>
            </div>
            <p className="text-[var(--color-muted-dark)] leading-relaxed">
              {d.rationale}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
