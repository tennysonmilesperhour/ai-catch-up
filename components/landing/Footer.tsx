import Link from "next/link";

export function Footer() {
  return (
    <footer className="px-6 md:px-12 pb-12 pt-4 max-w-7xl mx-auto text-[var(--color-muted-dark)]">
      <div className="foot-grid">
        <div className="foot-col">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-dark)]"
          >
            AI · Catch · Up
          </Link>
          <p className="text-xs leading-relaxed mt-2 text-[var(--color-muted)] font-mono tracking-[0.04em]">
            A 60-minute onboarding for the solo entrepreneur or small-team lead
            who became the AI person by default.
          </p>
        </div>

        <div className="foot-col">
          <h4>Product</h4>
          <Link href="/#overview" className="hover:text-[var(--color-dark)] transition-colors">Overview</Link>
          <Link href="/#flow" className="hover:text-[var(--color-dark)] transition-colors">The flow</Link>
          <Link href="/#nexus" className="hover:text-[var(--color-dark)] transition-colors">Nexus</Link>
          <Link href="/#prompts" className="hover:text-[var(--color-dark)] transition-colors">Prompts</Link>
          <Link href="/preview/dashboard" className="hover:text-[var(--color-cyan)] transition-colors">Playground →</Link>
        </div>

        <div className="foot-col">
          <h4>Buy</h4>
          <Link href="/#pricing" className="hover:text-[var(--color-dark)] transition-colors">Pricing</Link>
          <Link href="/#faq" className="hover:text-[var(--color-dark)] transition-colors">FAQ</Link>
          <Link href="/blog" className="hover:text-[var(--color-dark)] transition-colors">Writing</Link>
        </div>

        <div className="foot-col">
          <h4>Account</h4>
          <Link href="/login" className="hover:text-[var(--color-dark)] transition-colors">Log in</Link>
          <Link href="/preview/dashboard" className="hover:text-[var(--color-dark)] transition-colors">Dashboard demo</Link>
        </div>
      </div>

      <div className="foot-bot">
        <span>© {new Date().getFullYear()} AI Catch Up · v1.0.0</span>
        <span>Made with care, not hype.</span>
      </div>
    </footer>
  );
}
