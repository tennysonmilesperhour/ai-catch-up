export function VideoPlaceholder() {
  return (
    <section className="px-6 md:px-12 pb-16 md:pb-24 max-w-5xl mx-auto">
      <div className="aspect-video bg-[var(--color-darker)] border border-[var(--color-border-dark)] flex items-center justify-center relative group cursor-pointer">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full border-2 border-[var(--color-cream)] flex items-center justify-center transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8 text-[var(--color-cream)] ml-1"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-cream)]">
            The Plateau &middot; 6 min
          </p>
        </div>
      </div>
    </section>
  );
}
