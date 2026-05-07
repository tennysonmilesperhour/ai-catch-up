// Derive a beginner-friendly connection status for any Nexus node.
// Used by the renderer to color a small status ring on each node and
// by the tooltip to show a status pill.

import type { NexusNode } from "@/components/admin/Nexus";

export type ConnectionStatus =
  | "connected"
  | "partial"
  | "needs-setup"
  | "not-installed";

export function deriveConnectionStatus(node: NexusNode): ConnectionStatus {
  // Explicit override wins, the data file knows best.
  const explicit = (node as NexusNode & { connectionStatus?: ConnectionStatus })
    .connectionStatus;
  if (explicit) return explicit;

  // Skills follow a simple rule: real = installed, ghost = not installed.
  if (node.domain === "skills") {
    return node.kind === "real" ? "connected" : "not-installed";
  }

  // Real apps: deployed = connected, otherwise partial (built but not live).
  if (node.kind === "real") {
    return node.deployed ? "connected" : "partial";
  }

  // Forks default to partial, cloned but rarely fully integrated.
  if (node.kind === "fork") return "partial";

  // Ghost: priority high = needs-setup, anything else = not-installed.
  if (node.kind === "ghost") {
    return node.priority === "high" ? "needs-setup" : "not-installed";
  }

  return "not-installed";
}

export const STATUS_PALETTE: Record<
  ConnectionStatus,
  { color: string; label: string; description: string }
> = {
  connected: {
    color: "#10b981",
    label: "Connected",
    description: "Installed and wired up. Nothing to do.",
  },
  partial: {
    color: "#fbbf24",
    label: "Partial",
    description: "Started but not fully connected. Verify it's working.",
  },
  "needs-setup": {
    color: "#fb923c",
    label: "Needs setup",
    description: "Recommended for your stack. Install when ready.",
  },
  "not-installed": {
    color: "#6b7280",
    label: "Not installed",
    description: "Optional. Skip unless it solves a real problem.",
  },
};
