"use client";

import Link from "next/link";
import { useRef, type ReactNode, type MouseEvent } from "react";

type MagneticButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
  range?: number;
};

export function MagneticButton({
  href,
  children,
  className = "",
  strength = 14,
  range = 80,
}: MagneticButtonProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);

  function onMove(e: MouseEvent<HTMLSpanElement>) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    const pull = Math.min(1, dist / range);
    const mx = (dx / (dist || 1)) * pull * strength;
    const my = (dy / (dist || 1)) * pull * strength;
    wrap.style.setProperty("--mx", `${mx}px`);
    wrap.style.setProperty("--my", `${my}px`);
  }

  function onLeave() {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.style.setProperty("--mx", `0px`);
    wrap.style.setProperty("--my", `0px`);
  }

  return (
    <span
      ref={wrapRef}
      className={`magnetic ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <Link href={href} className="magnetic-inner">
        {children}
      </Link>
    </span>
  );
}
