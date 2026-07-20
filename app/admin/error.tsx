"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-terracotta)] mb-3">
        Error
      </p>
      <h1 className="font-serif text-2xl md:text-3xl text-[var(--color-dark)] mb-4">
        This panel failed to load.
      </h1>
      <p className="text-[var(--color-muted-dark)] leading-relaxed mb-8">
        A data source (often the GitHub sync) may be slow or unavailable. The
        rest of the dashboard still works. Try again in a moment.
      </p>
      <button
        onClick={reset}
        className="glass-button-primary inline-flex items-center px-5 py-2.5 font-mono text-xs uppercase tracking-[0.08em]"
      >
        Retry
      </button>
    </div>
  );
}
