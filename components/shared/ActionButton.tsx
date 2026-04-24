"use client";

import { useState } from "react";

export type ActionKind =
  | "copy-prompt"
  | "open-url"
  | "copy-commands"
  | "view-steps";

export type Action = {
  kind: ActionKind;
  label: string;
  payload: string;
};

type Props = {
  action: Action;
  accentColor: string;
  onViewSteps: (payload: string) => void;
};

export function ActionButton({ action, accentColor, onViewSteps }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (action.kind === "open-url") {
      window.open(action.payload, "_blank", "noopener,noreferrer");
    } else if (
      action.kind === "copy-prompt" ||
      action.kind === "copy-commands"
    ) {
      try {
        await navigator.clipboard.writeText(action.payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard write failed:", err);
      }
    } else if (action.kind === "view-steps") {
      onViewSteps(action.payload);
    }
  };

  const icon =
    action.kind === "open-url"
      ? "↗"
      : action.kind === "copy-prompt" || action.kind === "copy-commands"
        ? copied
          ? "✓"
          : "⎘"
        : action.kind === "view-steps"
          ? "→"
          : "";

  return (
    <button
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        background: "transparent",
        color: "#f5efe0",
        border: `1px solid ${accentColor}80`,
        padding: "8px 12px",
        fontSize: 12,
        fontFamily: "ui-monospace, Menlo, monospace",
        letterSpacing: "0.03em",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `${accentColor}20`;
        e.currentTarget.style.borderColor = accentColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = `${accentColor}80`;
      }}
    >
      <span>{copied ? "Copied" : action.label}</span>
      <span style={{ opacity: 0.7 }}>{icon}</span>
    </button>
  );
}
