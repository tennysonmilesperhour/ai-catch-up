import Link from "next/link";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="px-6 md:px-12 py-20 md:py-32 max-w-3xl mx-auto">
        <p className="label text-[var(--color-terracotta)] mb-6">404</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] text-[var(--color-dark)] mb-8">
          This page is not here.
        </h1>
        <p className="text-lg text-[var(--color-muted-dark)] leading-relaxed mb-10 max-w-xl">
          You followed a link that has moved or was never real. No harm done.
          Head back to the landing page and start from there.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="glass-button-primary inline-flex items-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em]"
          >
            Back to landing
          </Link>
          <Link
            href="/login"
            className="glass-button inline-flex items-center px-6 py-3 font-mono text-sm uppercase tracking-[0.08em]"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
