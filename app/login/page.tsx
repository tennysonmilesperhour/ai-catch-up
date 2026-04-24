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
    <main className="min-h-screen bg-[var(--color-darker)] text-[var(--color-cream)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="label text-[var(--color-terracotta)] mb-6">
          Log in
        </p>
        <h1 className="font-serif text-3xl md:text-4xl mb-3">
          Enter your email to continue.
        </h1>
        <p className="text-[var(--color-muted)] mb-8 leading-relaxed">
          New here? Use any email to preview the product. Already bought?
          Use the email you bought with. Admins: use your admin email.
        </p>
        <form
          method="POST"
          action="/api/login"
          className="flex flex-col gap-4"
        >
          {next && <input type="hidden" name="next" value={next} />}
          <input
            type="email"
            name="email"
            autoFocus
            required
            placeholder="you@example.com"
            className="px-4 py-3 bg-transparent border border-[var(--color-border-dark)] text-[var(--color-cream)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-terracotta)] font-serif text-base"
          />
          <button
            type="submit"
            className="px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] bg-[var(--color-terracotta)] text-[var(--color-cream)] border border-[var(--color-terracotta)] hover:bg-[var(--color-rust)] hover:border-[var(--color-rust)] transition-colors"
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
    </main>
  );
}
