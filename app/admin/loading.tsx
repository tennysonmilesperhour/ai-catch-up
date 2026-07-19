export default function AdminLoading() {
  return (
    <div className="max-w-3xl animate-pulse" aria-hidden="true">
      <div className="h-3 w-24 bg-[var(--color-border-dark)] rounded mb-6" />
      <div className="h-9 w-2/3 bg-[var(--color-border-dark)] rounded mb-4" />
      <div className="h-4 w-full bg-[var(--color-border-dark)] rounded mb-2" />
      <div className="h-4 w-5/6 bg-[var(--color-border-dark)] rounded mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-28 bg-[var(--color-border-dark)] rounded" />
        <div className="h-28 bg-[var(--color-border-dark)] rounded" />
        <div className="h-28 bg-[var(--color-border-dark)] rounded" />
        <div className="h-28 bg-[var(--color-border-dark)] rounded" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
