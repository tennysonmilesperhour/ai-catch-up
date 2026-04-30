"use client";

import { useEffect, useState } from "react";
import { LearnHint, LearnModeToggle } from "@/components/shared/LearnMode";

type UtilityBarProps = {
  left?: string[];
  rightStatic?: string[];
};

function fmtUtc(d: Date) {
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss} UTC`;
}

// Bundle build id baked at build time (next.config.mjs → env.NEXT_PUBLIC_BUILD_ID).
// Render the first 7 chars so it reads like a short git sha. RefreshBanner
// compares this same constant against /api/version; this chip is the visible
// breadcrumb that the system is wired up.
const BUILD_ID = (process.env.NEXT_PUBLIC_BUILD_ID as string | undefined) || "";
const BUILD_TAG = BUILD_ID ? BUILD_ID.slice(0, 7) : "dev";

// Clock isolated into its own component so the 1-second setInterval only
// re-renders the clock span — not the LearnModeToggle, the build id chip,
// or the rest of the bar. Pauses when the tab is hidden via document
// visibilitychange to save CPU on background tabs.
function UtcClock() {
  const [now, setNow] = useState<string>(() => fmtUtc(new Date()));
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    function start() {
      stop();
      setNow(fmtUtc(new Date()));
      id = setInterval(() => setNow(fmtUtc(new Date())), 1000);
    }
    function stop() {
      if (id) clearInterval(id);
      id = null;
    }
    start();
    function onVis() {
      if (document.visibilityState === "visible") start();
      else stop();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <span className="num-tab">{now}</span>;
}

export function UtilityBar({
  left = ["SYSTEM ONLINE", "Build 26.04 · stable"],
  rightStatic = ["v1.0.0"],
}: UtilityBarProps) {
  return (
    <div className="utility-bar" role="status" aria-live="off">
      <div className="group">
        <span className="dot" aria-hidden />
        {left.map((part, i) => (
          <span key={i} className="group">
            <span>{part}</span>
            {i < left.length - 1 && <span className="sep">·</span>}
          </span>
        ))}
      </div>
      <div className="group">
        <LearnHint
          title="Learn mode"
          body="Toggles the dotted-underline tooltips on technical terms and the ? badges on UI elements. On by default; turn off here once the workspace feels familiar."
          side="bottom-right"
        >
          <LearnModeToggle />
        </LearnHint>
        <span className="sep">·</span>
        {rightStatic.map((part, i) => (
          <span key={i} className="group">
            <span>{part}</span>
            <span className="sep">·</span>
          </span>
        ))}
        <LearnHint
          title="Build id"
          body="Short hash of the bundle this browser loaded. Compared against /api/version every 30 seconds; when they diverge, a refresh banner offers to reload."
          more="In production this is the first 7 chars of VERCEL_GIT_COMMIT_SHA. In dev it reads 'dev'."
          side="bottom-right"
        >
          <span
            className="num-tab"
            title="Bundle build id (compares against /api/version for stale-page detection)"
          >
            {BUILD_TAG}
          </span>
        </LearnHint>
        <span className="sep">·</span>
        <LearnHint
          title="UTC clock"
          body="Live UTC time. Cosmetic; pauses when the tab is hidden so background tabs don't burn cycles on a clock no one's watching."
          side="bottom-right"
        >
          <UtcClock />
        </LearnHint>
      </div>
    </div>
  );
}
