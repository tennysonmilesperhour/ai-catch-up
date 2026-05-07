import { Starfield } from "@/components/landing/Starfield";

export const metadata = { title: "Log in" };

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;
  const errorMessage =
    error === "email"
      ? "Please enter a valid email."
      : error === "server"
        ? "Something went wrong signing you in. Try again in a moment."
        : error === "github_state"
          ? "Your GitHub sign-in session expired. Please try again."
          : error === "github_token" || error === "github_user"
            ? "GitHub did not return your account. Please try again."
            : error === "github_email"
              ? "We could not read a verified email from your GitHub account."
              : error === "github_not_configured"
                ? "GitHub login is not available right now."
                : null;
  const githubHref = next
    ? `/api/auth/github?next=${encodeURIComponent(next)}`
    : "/api/auth/github";

  return (
    <main className="aurora-page min-h-screen grid md:grid-cols-[1.05fr_1fr] text-[var(--color-dark)]">
      {/* Left: editorial brand pane */}
      <aside className="relative overflow-hidden hidden md:flex flex-col justify-between p-12 lg:p-16 border-r border-[rgba(95,255,215,0.12)]">
        <div className="absolute inset-0 -z-10">
          <Starfield density={0.00012} />
          <div className="orbit-stack">
            <div className="orbit orbit-ring" />
            <div className="orbit" />
            <div className="orbit" />
          </div>
        </div>
        <p className="label text-[var(--color-terracotta)]">AI Catch Up</p>
        <blockquote className="max-w-md">
          <p className="font-serif italic text-2xl lg:text-3xl leading-snug headline-gradient">
            &ldquo;You don&rsquo;t need to learn AI. You need a setup that
            already works.&rdquo;
          </p>
          <footer className="mt-6 font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
            &mdash; the working theory
          </footer>
        </blockquote>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
          A 60-minute onboarding for the de facto AI lead.
        </p>
      </aside>

      {/* Right: form pane */}
      <section className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-md">
          <p className="label text-[var(--color-terracotta)] mb-6 md:hidden">
            AI Catch Up
          </p>
          <p className="label text-[var(--color-muted-dark)] mb-4">Log in</p>
          <h1 className="font-serif text-3xl md:text-4xl mb-3 leading-tight">
            Enter your email to continue.
          </h1>
          <p className="text-[var(--color-muted-dark)] mb-8 leading-relaxed">
            New here? Use any email to preview the product. Already bought? Use
            the email you bought with. Admins: use your admin email.
          </p>
          <a
            href={githubHref}
            className="flex items-center justify-center gap-3 px-6 py-3 mb-6 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[12px] text-[var(--color-dark)] hover:bg-[rgba(13,28,52,0.85)] hover:border-[var(--color-terracotta)] transition-colors font-mono text-sm uppercase tracking-[0.08em]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.16-.02-2.1-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.71 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.55 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.99 0 0 .94-.3 3.08 1.15.89-.25 1.85-.37 2.8-.37.95 0 1.91.12 2.8.37 2.14-1.45 3.08-1.15 3.08-1.15.61 1.56.23 2.71.11 2.99.72.79 1.16 1.79 1.16 3.02 0 4.31-2.63 5.27-5.14 5.54.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.06 0 .3.21.65.78.54 4.46-1.49 7.68-5.7 7.68-10.67C23.25 5.48 18.27.5 12 .5z" />
            </svg>
            <span>Continue with GitHub</span>
          </a>
          <div className="relative mb-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--color-border-dark)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
              or with email
            </span>
            <div className="flex-1 h-px bg-[var(--color-border-dark)]" />
          </div>
          <form method="POST" action="/api/login" className="flex flex-col gap-4">
            {next && <input type="hidden" name="next" value={next} />}
            <label className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                Email
              </span>
              <input
                type="email"
                name="email"
                autoFocus
                required
                placeholder="you@example.com"
                className="px-4 py-3 bg-[rgba(13,28,52,0.55)] border border-[var(--color-border-dark)] rounded-[10px] text-[var(--color-dark)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-terracotta)] focus:bg-[rgba(13,28,52,0.85)] transition-colors font-serif text-base"
              />
            </label>
            <button
              type="submit"
              className="glass-button-primary px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] rounded-[12px] mt-2"
            >
              Continue
            </button>
            {errorMessage && (
              <p className="font-mono text-xs text-[var(--color-terracotta)]">
                {errorMessage}
              </p>
            )}
          </form>
          <p className="mt-10 font-mono text-xs text-[var(--color-muted)]">
            We keep you signed in for 30 days on this device.
          </p>
        </div>
      </section>
    </main>
  );
}
