"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 60 * 1000; // 60 seconds

export function RefreshBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const loadedBuildId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        const remote = data.buildId;
        if (!remote) return;
        if (loadedBuildId.current === null) {
          loadedBuildId.current = remote;
          return;
        }
        if (remote !== loadedBuildId.current && !cancelled) {
          setUpdateAvailable(true);
        }
      } catch {
        // Network blip is fine; try again next tick.
      }
    }

    void poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        maxWidth: 360,
        background: "#1a1612",
        color: "#f5efe0",
        border: "1px solid #3a342c",
        borderLeft: "3px solid #d97757",
        padding: "14px 18px",
        zIndex: 200,
        boxShadow: "0 8px 28px rgba(0, 0, 0, 0.35)",
        display: "flex",
        gap: 14,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#d97757",
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
            color: "#e5ddd0",
          }}
        >
          This page is out of date. Refresh to pick up the latest.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#d97757",
          color: "#faf7f2",
          border: "1px solid #d97757",
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
