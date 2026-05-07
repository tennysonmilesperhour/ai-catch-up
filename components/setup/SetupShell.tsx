"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  PHASES,
  progressFraction,
  readSetupState,
  type SetupState,
} from "@/lib/setup-state";

type Props = {
  children: ReactNode;
};

export function SetupShell({ children }: Props) {
  const pathname = usePathname();
  const [state, setState] = useState<SetupState | null>(null);

  useEffect(() => {
    setState(readSetupState());
    // Re-read on focus so cross-tab updates land.
    function onFocus() {
      setState(readSetupState());
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const fraction = state ? progressFraction(state) : 0;
  const pct = Math.round(fraction * 100);

  return (
    <div className="setup-shell">
      <header className="setup-head">
        <Link href="/" className="brand-mark">
          <span className="box" aria-hidden>
            <span className="core" />
          </span>
          <span className="text">AI · Catch · Up</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] ml-1">
            · setup
          </span>
        </Link>
        <div className="setup-progress">
          <div className="setup-progress-bar" aria-hidden>
            <span
              className="setup-progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="setup-progress-label num-tab">{pct}%</span>
        </div>
        <Link
          href="/admin"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] transition-colors"
        >
          ← Workspace
        </Link>
      </header>

      <div className="setup-grid">
        <aside className="setup-rail">
          <div className="rail-h">
            Phases · {PHASES.length}
            <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--color-muted)] ml-2 normal-case">
              60 min total · best in one sitting
            </span>
          </div>
          {PHASES.map((p, i) => {
            const status = state?.phases[p.id]?.status ?? "not-started";
            const isActive = pathname === p.href;
            const dotColor =
              status === "done"
                ? "var(--color-organic)"
                : status === "in-progress"
                  ? "var(--color-cyan)"
                  : "var(--color-muted)";
            return (
              <Link
                key={p.id}
                href={p.href}
                className={`setup-rail-card ${isActive ? "active" : ""} ${status === "done" ? "is-done" : ""}`}
              >
                <div className="row">
                  <span className="num">0{i + 1}</span>
                  <span className="ttl">{p.label}</span>
                  <span
                    className="setup-dot"
                    style={{
                      background: dotColor,
                      boxShadow:
                        status === "not-started"
                          ? "none"
                          : `0 0 6px ${dotColor}`,
                    }}
                    aria-hidden
                  />
                </div>
                <div className="meta-row">
                  {p.time} ·{" "}
                  {status === "done"
                    ? "complete"
                    : status === "in-progress"
                      ? "in progress"
                      : "not started"}
                </div>
              </Link>
            );
          })}
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-muted)] mt-4 leading-relaxed">
            Linear path. Each phase ends with a working artifact in your
            workspace.
          </p>
        </aside>

        <main className="setup-main">{children}</main>
      </div>
    </div>
  );
}
