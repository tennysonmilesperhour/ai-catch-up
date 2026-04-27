import { loadJson } from "@/lib/content";
import { Reveal } from "@/components/shared/Reveal";

type Status = "not-started" | "in-progress" | "done" | "blocked";
type ScheduleItem = { type: string; title: string; status: Status; owner: string };
type Week = { week: string; focus: string; items: ScheduleItem[] };

export const metadata = { title: "Schedule" };

const statusLabel: Record<Status, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
  blocked: "Blocked",
};

const statusClass: Record<Status, string> = {
  "not-started": "is-not-started",
  "in-progress": "is-in-progress",
  done: "is-done",
  blocked: "is-blocked",
};

export default function SchedulePage() {
  const weeks = loadJson<Week[]>("admin/schedule.json");

  return (
    <div>
      <header className="admin-header">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Schedule
        </h1>
        <p className="text-[var(--color-muted-dark)]">
          Week-by-week view of what is happening.
        </p>
      </header>

      <div className="grid gap-6">
        {weeks.map((w, i) => (
          <Reveal key={i} delay={i * 80}>
            <section className="glass-card p-6 md:p-8">
              <div className="flex items-baseline gap-4 mb-5">
                <span className="idx-numeral select-none" style={{ fontSize: "1.75rem" }}>
                  W{String(i + 1).padStart(2, "0")}
                </span>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-terracotta)]">
                  {w.week}
                </p>
                <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)]">
                  {w.focus}
                </h2>
              </div>
              <ul className="divide-y divide-[var(--color-border-light)]">
                {w.items.map((t, j) => (
                  <li
                    key={j}
                    className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-2 md:gap-4 transition-colors hover:bg-[rgba(255,255,255,0.02)] -mx-3 px-3 rounded-md"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)] whitespace-nowrap">
                        {t.type}
                      </span>
                      <span className="text-[var(--color-muted-dark)]">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                        {t.owner}
                      </span>
                      <span className={`status-pill ${statusClass[t.status] ?? "is-not-started"}`}>
                        {statusLabel[t.status] ?? t.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
