"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  label: string;
  href: string;
};

type Props = {
  tabs: Tab[];
};

export function TabNav({ tabs }: Props) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-[var(--color-border-dark)] overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-3 font-mono text-xs uppercase tracking-[0.08em] border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? "text-[var(--color-cream)] border-[var(--color-terracotta)]"
                : "text-[var(--color-muted)] border-transparent hover:text-[var(--color-cream)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
