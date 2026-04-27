"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { label: string; href: string };
type TabGroup = { heading?: string; tabs: Tab[] };

type Props = {
  groups: TabGroup[];
};

export function AdminSidebar({ groups }: Props) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[rgba(2,6,14,0.65)] backdrop-blur-md">
      <div className="px-5 pt-6 pb-8">
        <Link href="/admin" className="block">
          <p className="label text-[var(--color-terracotta)] leading-tight">
            AI Catch Up
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mt-1">
            admin workspace
          </p>
        </Link>
      </div>
      <nav className="flex-1 px-3 flex flex-col gap-5 overflow-y-auto pb-4">
        {groups.map((group, gi) => (
          <div key={group.heading ?? `group-${gi}`} className="flex flex-col gap-1">
            {group.heading && (
              <p className="px-4 mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]/70">
                {group.heading}
              </p>
            )}
            {group.tabs.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href !== "/admin" && pathname.startsWith(tab.href + "/"));
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative px-4 py-2.5 rounded-[10px] font-mono text-xs uppercase tracking-[0.08em] transition-colors ${
                    isActive
                      ? "text-[var(--color-dark)] bg-[rgba(251,191,36,0.10)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-dark)] hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-1 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--color-terracotta)] cosmic-glow-soft"
                    />
                  )}
                  <span className="ml-2">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="px-5 py-5 border-t border-[var(--color-border)] flex flex-col gap-3">
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
        >
          &larr; View site
        </Link>
        <form method="POST" action="/api/logout">
          <button
            type="submit"
            className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-terracotta)] transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
