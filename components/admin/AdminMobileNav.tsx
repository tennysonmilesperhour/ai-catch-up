"use client";

import Link from "next/link";
import { TabNav } from "@/components/shared/TabNav";

type Tab = { label: string; href: string };

export function AdminMobileNav({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="md:hidden border-b border-[var(--color-border)] bg-[var(--color-darker)] px-5 pt-5 pb-0 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="label text-[var(--color-terracotta)]">
            AI Catch Up
          </span>
          <span className="font-mono text-[10px] text-[var(--color-muted)]">
            admin
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)]"
          >
            View site
          </Link>
          <form method="POST" action="/api/logout">
            <button
              type="submit"
              className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] bg-transparent border-0 p-0 cursor-pointer"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
      <TabNav tabs={tabs} />
    </div>
  );
}
