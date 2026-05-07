// Workspace state snapshot — all signals about the buyer's workspace
// rolled into one shape that heuristics + the /admin/pulse view can
// consume. v1.2 reads from localStorage; v1.3+ will swap in server-side
// reads keyed off the buyer's session cookie.

import { getStatus, type ApiKeyStatus } from "@/lib/byok";
import { readSetupState, type SetupState } from "@/lib/setup-state";
import { readHistory, type HistoryEntry } from "@/lib/run-history-shape";
import { readPromptUsage, type UsageMap } from "@/lib/usage-tracking";

export type WorkspaceSnapshot = {
  apiKey: ApiKeyStatus;
  setup: SetupState;
  invocations: {
    total: number;
    last7d: number;
    last30d: number;
    recent: HistoryEntry[];
    usage: UsageMap;
    lastAt: number | null;
  };
  decisions: { total: number };
  prompts: { total: number };
  generatedAt: number;
};

const D7 = 7 * 24 * 60 * 60 * 1000;
const D30 = 30 * 24 * 60 * 60 * 1000;

export function readWorkspaceSnapshot(opts?: {
  decisionsCount?: number;
  promptsCount?: number;
}): WorkspaceSnapshot {
  const apiKey = getStatus();
  const setup = readSetupState();
  const recent = readHistory();
  const usage = readPromptUsage();
  const now = Date.now();
  const last7d = recent.filter((h) => now - h.ts <= D7).length;
  const last30d = recent.filter((h) => now - h.ts <= D30).length;

  return {
    apiKey,
    setup,
    invocations: {
      total: recent.length,
      last7d,
      last30d,
      recent: recent.slice(0, 10),
      usage,
      lastAt: recent[0]?.ts ?? null,
    },
    decisions: { total: opts?.decisionsCount ?? 0 },
    prompts: { total: opts?.promptsCount ?? 0 },
    generatedAt: now,
  };
}
