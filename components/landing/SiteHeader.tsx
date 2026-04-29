"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Tab = { id: string; label: string };

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "flow", label: "The flow" },
  { id: "nexus", label: "Nexus" },
  { id: "prompts", label: "Prompts" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string>("overview");
  const lastY = useRef(0);

  // Tab anchors are absolute ("/#section") so they work as cross-page nav
  // from /preview/dashboard, /thank-you, etc. — they navigate back to the
  // landing and jump to the section. On the landing itself the browser
  // smooth-scrolls within the page (default behavior).
  const tabHref = (id: string) => (isLanding ? `#${id}` : `/#${id}`);

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

  useEffect(() => {
    // The active-tab indicator only makes sense on the landing where every
    // section id exists. On other routes (/preview/dashboard, /thank-you,
    // etc.) most ids are absent so the IO would lock to whichever single id
    // happens to be present and read as "wrong tab active." Skip entirely.
    if (!isLanding) {
      setActive("");
      return;
    }
    const els = TABS.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (els.length === 0) return;

    const visibility = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId = "overview";
        let best = -1;
        for (const [id, ratio] of visibility) {
          if (ratio > best) {
            best = ratio;
            bestId = id;
          }
        }
        if (best > 0) setActive(bestId);
      },
      { threshold: [0.1, 0.25, 0.5, 0.75] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isLanding]);

  return (
    <header
      className={`site-header sticky top-[28px] z-30 px-6 md:px-12 py-3 backdrop-blur-md bg-[rgba(2,6,14,0.55)] border-b border-white/5 ${
        hidden ? "site-header-hidden" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="brand-mark">
          <span className="box" aria-hidden>
            <span className="core" />
          </span>
          <span className="text">AI · Catch · Up</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={tabHref(t.id)}
              className={`tab-pill ${active === t.id ? "is-active" : ""}`}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Open command palette"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("command-palette:open"))
            }
            className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-md border border-white/10 text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] hover:border-[rgba(95,255,215,0.45)] transition-colors"
          >
            <span className="font-mono text-[11px]">⌘K</span>
          </button>
          <Link
            href="/login"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
          >
            Log in
          </Link>
          <Link
            href={tabHref("pricing")}
            className="glass-button-primary px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em]"
          >
            Get access
          </Link>
        </div>
      </div>
    </header>
  );
}
