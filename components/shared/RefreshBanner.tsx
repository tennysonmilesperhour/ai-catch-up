"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const FOCUS_THROTTLE_MS = 5 * 1000; // ignore focus events within 5s of last poll

export function RefreshBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const loadedBuildId = useRef<string | null>(null);
  const lastPollAt = useRef<number>(0);

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
        if (loadedBuildId.current === null) {
          loadedBuildId.current = remote;
          console.info(
            `[refresh-banner] baseline set buildId=${remote} source=${data.source ?? "?"}`
          );
          return;
        }
        if (remote !== loadedBuildId.current) {
          console.info(
            `[refresh-banner] update detected: ${loadedBuildId.current} -> ${remote}`
          );
          if (!cancelled) setUpdateAvailable(true);
        } else {
          console.debug(
            `[refresh-banner] poll(${reason}) buildId unchanged (${remote})`
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
