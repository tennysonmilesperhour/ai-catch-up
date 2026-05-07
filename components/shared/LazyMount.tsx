"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Distance ahead of the viewport to start mounting (CSS rootMargin). */
  rootMargin?: string;
  /** Min height held while not yet mounted, to keep page height stable. */
  minHeight?: string;
  /** className applied to the wrapper div. */
  className?: string;
};

/**
 * Mounts children only after the wrapper has scrolled within `rootMargin`
 * of the viewport. Used to keep below-fold landing sections out of the
 * initial hydration / paint pass, Hero + dashboard hydrate immediately,
 * Pricing + FAQ + the rest wait until you scroll near them.
 */
export function LazyMount({
  children,
  rootMargin = "400px 0px",
  minHeight = "320px",
  className = "",
}: Props) {
  const [shown, setShown] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shown) return;
    if (typeof window === "undefined") return;
    // No IO support? Fall back to mounting eagerly.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
            return;
          }
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={shown ? undefined : { minHeight }}
    >
      {shown ? children : null}
    </div>
  );
}
