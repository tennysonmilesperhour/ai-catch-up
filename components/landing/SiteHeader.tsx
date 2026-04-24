import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="px-6 md:px-12 pt-6 md:pt-8 max-w-7xl mx-auto flex items-center justify-between gap-6">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] transition-colors"
      >
        AI Catch Up
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/login"
          className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] transition-colors"
        >
          Log in
        </Link>
      </nav>
    </header>
  );
}
