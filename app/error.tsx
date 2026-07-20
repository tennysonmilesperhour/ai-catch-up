"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <main className="aurora-page min-h-screen">
      <div className="px-6 md:px-12 py-20 md:py-32 max-w-3xl mx-auto">
        <p className="label text-[var(--color-terracotta)] mb-6">Error</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] text-[var(--color-dark)] mb-8">
          Something went wrong.
        </h1>
        <p className="text-lg text-[var(--color-muted-dark)] leading-relaxed mb-10 max-w-xl">
          A part of the page failed to load. This is on our side, not yours.
          Try again, and if it keeps happening, head back to the landing page.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={reset}
            className="glass-button-primary inline-flex items-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em]"
          >
            Try again
          </button>
          <a
            href="/"
            className="glass-button inline-flex items-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em]"
          >
            Back to landing
          </a>
        </div>
      </div>
    </main>
  );
}
