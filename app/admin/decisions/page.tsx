import { loadJson } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

type Decision = { decision: string; rationale: string };

export const metadata = { title: "Decisions" };

export default function DecisionsPage() {
  const decisions = loadJson<Decision[]>("admin/decisions.json");

  return (
    <div>
      <header className="admin-header">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Decisions
        </h1>
        <p className="text-[var(--color-muted-dark)]">
          Locked decisions and why. Not up for debate unless there is new information.
        </p>
      </header>

      <ul className="grid gap-4">
        {decisions.map((d, i) => (
          <Reveal as="li" key={i} delay={i * 50}>
            <div className="glass-card p-6 md:p-7 grid grid-cols-[auto_1fr_auto] gap-5 items-start">
              <span className="idx-numeral select-none" style={{ fontSize: "1.5rem" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-serif text-lg md:text-xl text-[var(--color-dark)] mb-2">
                  {d.decision}
                </h2>
                <p className="text-[var(--color-muted-dark)] leading-relaxed">
                  {d.rationale}
                </p>
              </div>
              <span className="status-pill is-in-progress whitespace-nowrap" style={{ color: "var(--color-magenta)" }}>
                Locked
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
