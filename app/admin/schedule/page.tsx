import { loadJson } from "@/lib/content";

type Status = "todo" | "in_progress" | "done" | "blocked";

type Task = { label: string; status: Status };

type Week = {
  week: number;
  title: string;
  tasks: Task[];
};

type Schedule = { weeks: Week[] };

export const metadata = { title: "Schedule" };

const statusStyles: Record<Status, string> = {
  todo: "bg-transparent text-[var(--color-muted-dark)] border-[var(--color-border)]",
  in_progress:
    "bg-[var(--color-terracotta)]/10 text-[var(--color-rust)] border-[var(--color-terracotta)]",
  done: "bg-[var(--color-dark)]/5 text-[var(--color-dark)] border-[var(--color-dark)]",
  blocked:
    "bg-[var(--color-rust)]/10 text-[var(--color-rust)] border-[var(--color-rust)]",
};

const statusLabel: Record<Status, string> = {
  todo: "Todo",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

export default function SchedulePage() {
  const schedule = loadJson<Schedule>("admin/schedule.json");

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
        {schedule.weeks.map((w) => (
          <section
            key={w.week}
            className="bg-white/60 border border-[var(--color-border)] p-6 md:p-8"
          >
            <div className="flex items-baseline gap-4 mb-5">
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-terracotta)]">
                Week {w.week}
              </p>
              <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)]">
                {w.title}
              </h2>
            </div>
            <ul className="divide-y divide-[var(--color-border-light)]">
              {w.tasks.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <span className="text-[var(--color-muted-dark)]">
                    {t.label}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.12em] px-2 py-1 border ${
                      statusStyles[t.status] ?? statusStyles.todo
                    }`}
                  >
                    {statusLabel[t.status] ?? t.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
