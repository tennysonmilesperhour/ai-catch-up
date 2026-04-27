"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 15 * 1000; // 15 seconds
const FOCUS_THROTTLE_MS = 5 * 1000;

// BUILD_ID is baked into the client bundle at build time via
// next.config.mjs (env.NEXT_PUBLIC_BUILD_ID). On Vercel this resolves
// to VERCEL_GIT_COMMIT_SHA. The poll compares this CONSTANT (frozen at
// build) against /api/version (live at request time). The instant the
// server's id differs from the bundle's id, the user is on a stale
// page and the banner fires — even if they just opened the tab.
const BUILD_ID = (process.env.NEXT_PUBLIC_BUILD_ID as string | undefined) || "";

export function RefreshBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const lastPollAt = useRef<number>(0);

  // Verification escape hatch: ?force-banner=1 in the URL forces the toast
  // to render. Useful for confirming the component is mounted and styled
  // correctly without waiting for a real deploy.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("force-banner") === "1") {
      setUpdateAvailable(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll(reason: string) {
      const now = Date.now();
      lastPollAt.current = now;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) {
          console.warn(`[refresh-banner] poll(${reason}) HTTP ${res.status}`);
          return;
        }
        const data = (await res.json()) as {
          buildId?: string;
          source?: string;
        };
        const remote = data.buildId;
        if (!remote) {
          console.warn(`[refresh-banner] poll(${reason}) missing buildId`);
          return;
        }
        if (!BUILD_ID) {
          // No bundle id: we can't compare, so skip silently. This only
          // happens in dev where NEXT_PUBLIC_BUILD_ID isn't set.
          console.debug(
            `[refresh-banner] poll(${reason}) no bundle BUILD_ID, skipping compare`
          );
          return;
        }
        if (remote !== BUILD_ID) {
          console.info(
            `[refresh-banner] update detected: bundle=${BUILD_ID} server=${remote} source=${data.source ?? "?"}`
          );
          if (!cancelled) setUpdateAvailable(true);
        } else {
          console.debug(
            `[refresh-banner] poll(${reason}) buildId matches (${remote})`
          );
        }
      } catch (err) {
        console.warn(`[refresh-banner] poll(${reason}) failed`, err);
      }
    }

    void poll("mount");
    const intervalId = setInterval(() => poll("interval"), POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastPollAt.current < FOCUS_THROTTLE_MS) return;
      void poll("visibility");
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass-card"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        maxWidth: 360,
        padding: "14px 18px",
        zIndex: 200,
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
        borderLeft: "3px solid #ff8a4c",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#ff8a4c",
            marginBottom: 4,
          }}
        >
          Updates available
        </p>
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 14,
            lineHeight: 1.4,
            color: "#f3ecdb",
          }}
        >
          This page is out of date. Refresh to pick up the latest.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="glass-button-primary"
        style={{
          padding: "8px 14px",
          fontSize: 12,
          fontFamily: "ui-monospace, Menlo, monospace",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Refresh
      </button>
    </div>
  );
}
