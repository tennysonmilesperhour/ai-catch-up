import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-6 md:px-12 py-4 backdrop-blur-md bg-[rgba(7,7,26,0.5)] border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-dark)] hover:cosmic-glow transition-all"
        >
          AI Catch Up
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
