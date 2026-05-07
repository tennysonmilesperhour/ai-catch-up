"use client";

import Link from "next/link";
import { TabNav } from "@/components/shared/TabNav";

type Tab = { label: string; href: string };

export function AdminMobileNav({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="md:hidden border-b border-[rgba(95,255,215,0.12)] bg-[rgba(2,6,14,0.7)] backdrop-blur-md px-5 pt-5 pb-0 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="brand-mark">
          <span className="box" aria-hidden>
            <span className="core" />
          </span>
          <span className="text">AI · Catch · Up</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] ml-1">
            · admin
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] hover:text-[var(--color-cyan)]"
          >
            View site
          </Link>
          <form method="POST" action="/api/logout">
            <button
              type="submit"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] hover:text-[var(--color-magenta)] bg-transparent border-0 p-0 cursor-pointer"
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
