"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function SiteHeader() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (y < 80) {
        setHidden(false);
      } else if (dy > 6) {
        setHidden(true);
      } else if (dy < -6) {
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header sticky top-0 z-30 px-6 md:px-12 py-4 backdrop-blur-md bg-[rgba(7,7,26,0.55)] border-b border-white/5 ${
        hidden ? "site-header-hidden" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-dark)] hover:cosmic-glow transition-all"
        >
          AI Catch Up
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/login"
            className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
