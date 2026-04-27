"use client";

import { useEffect, useRef } from "react";

export function Starfield({
  density = 0.00018,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    type Star = {
      x: number;
      y: number;
      r: number;
      vy: number;
      tw: number;
      hue: "white" | "amber" | "violet" | "cyan";
    };
    let stars: Star[] = [];

    function pickHue(): Star["hue"] {
      const r = Math.random();
      if (r < 0.78) return "white";
      if (r < 0.88) return "amber";
      if (r < 0.95) return "violet";
      return "cyan";
    }

    function build() {
      const count = Math.floor(w * h * density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        vy: Math.random() * 0.04 + 0.01,
        tw: Math.random() * Math.PI * 2,
        hue: pickHue(),
      }));
    }

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    const colorFor = (hue: Star["hue"], a: number) => {
      switch (hue) {
        case "amber":  return `rgba(251, 191, 36, ${a})`;
        case "violet": return `rgba(192, 132, 252, ${a})`;
        case "cyan":   return `rgba(95, 255, 215, ${a})`;
        default:       return `rgba(255, 255, 255, ${a})`;
      }
    };

    let raf = 0;
    function frame() {
      ctx!.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduced) {
          s.y += s.vy;
          if (s.y > h + 2) s.y = -2;
          s.tw += 0.02;
        }
        const a = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(s.tw));
        ctx!.beginPath();
        ctx!.fillStyle = colorFor(s.hue, a);
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
