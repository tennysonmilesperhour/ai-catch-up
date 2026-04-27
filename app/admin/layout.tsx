import Link from "next/link";
import { TabNav } from "@/components/shared/TabNav";

const tabs = [
  { label: "Plan", href: "/admin/plan" },
  { label: "Schedule", href: "/admin/schedule" },
  { label: "Nexus", href: "/admin/nexus" },
  { label: "Prompts", href: "/admin/prompts" },
  { label: "Decisions", href: "/admin/decisions" },
  { label: "Launch Checklist", href: "/admin/checklist" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-cream)]">
      <header className="bg-[var(--color-darker)] text-[var(--color-dark)]">
        <div className="px-6 md:px-10 pt-6 pb-0 max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="label text-[var(--color-terracotta)]">
                AI Catch Up
              </span>
              <span className="font-mono text-xs text-[var(--color-muted)]">
                admin
              </span>
            </Link>
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
              >
                View site
              </Link>
              <form method="POST" action="/api/logout">
                <button
                  type="submit"
                  className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors bg-transparent border-0 p-0 cursor-pointer"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
          <TabNav tabs={tabs} />
        </div>
      </header>
      <main className="flex-1 px-6 md:px-10 py-10 md:py-14 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
