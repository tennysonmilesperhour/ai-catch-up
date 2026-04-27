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
        : null;

  return (
    <main className="min-h-screen grid md:grid-cols-[1.05fr_1fr] bg-[var(--color-darker)] text-[var(--color-dark)]">
      {/* Left: editorial brand pane */}
      <aside className="relative overflow-hidden hidden md:flex flex-col justify-between p-12 lg:p-16 border-r border-[var(--color-border)]">
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
