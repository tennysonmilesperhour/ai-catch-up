type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error, next } = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--color-darker)] text-[var(--color-cream)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <p className="label text-[var(--color-terracotta)] mb-6">
          Admin
        </p>
        <h1 className="font-serif text-3xl md:text-4xl mb-8">
          Enter the password
        </h1>
        <form
          method="POST"
          action="/api/admin/login"
          className="flex flex-col gap-4"
        >
          {next && <input type="hidden" name="next" value={next} />}
          <input
            type="password"
            name="password"
            autoFocus
            required
            placeholder="Password"
            className="px-4 py-3 bg-transparent border border-[var(--color-border-dark)] text-[var(--color-cream)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-terracotta)] font-serif text-base"
          />
          <button
            type="submit"
            className="px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] bg-[var(--color-terracotta)] text-[var(--color-cream)] border border-[var(--color-terracotta)] hover:bg-[var(--color-rust)] hover:border-[var(--color-rust)] transition-colors"
          >
            Unlock
          </button>
          {error && (
            <p className="font-mono text-xs text-[var(--color-terracotta)]">
              Incorrect password. Try again.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
