import { loadJson } from "@/lib/content";

type Status = "not-started" | "in-progress" | "done" | "blocked";

type ScheduleItem = {
  type: string;
  title: string;
  status: Status;
  owner: string;
};

type Week = {
  week: string;
  focus: string;
  items: ScheduleItem[];
};

export const metadata = { title: "Schedule" };

const statusStyles: Record<Status, string> = {
  "not-started":
    "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)]",
  "in-progress":
    "bg-[var(--color-terracotta)]/10 text-[var(--color-rust)] border-[var(--color-terracotta)]",
  done: "bg-[var(--color-dark)]/5 text-[var(--color-dark)] border-[var(--color-dark)]",
  blocked:
    "bg-[var(--color-rust)]/10 text-[var(--color-rust)] border-[var(--color-rust)]",
};

const statusLabel: Record<Status, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Done",
  blocked: "Blocked",
};

export default function SchedulePage() {
  const weeks = loadJson<Week[]>("admin/schedule.json");

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Schedule
        </h1>
        <p className="text-[var(--color-muted-dark)]">
          Week-by-week view of what is happening.
        </p>
      </header>

      <div className="grid gap-8">
        {weeks.map((w, i) => (
          <section
            key={i}
            className="glass-card p-6 md:p-8"
          >
            <div className="flex items-baseline gap-4 mb-5">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-terracotta)]">
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
                  className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-2 md:gap-4"
                >
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)] whitespace-nowrap">
                      {t.type}
                    </span>
                    <span className="text-[var(--color-muted-dark)]">
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {t.owner}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-1 border ${
                        statusStyles[t.status] ?? statusStyles["not-started"]
                      }`}
                    >
                      {statusLabel[t.status] ?? t.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
