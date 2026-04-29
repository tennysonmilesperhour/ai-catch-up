// Setup-flow state. v1.1 stores everything in localStorage per-browser.
// v1.2 will add server-side persistence keyed off the buyer's session.

export type PhaseId =
  | "capture"
  | "accounts"
  | "starter"
  | "configure"
  | "outputs";

export type PhaseStatus = "not-started" | "in-progress" | "done";

export type SetupState = {
  currentPhase: PhaseId | "done";
  phases: Record<PhaseId, PhaseRecord>;
};

export type PhaseRecord = {
  status: PhaseStatus;
  /** Free-form data per phase. Each phase decides its own shape. */
  data: Record<string, unknown>;
};

const STORAGE_KEY = "setup-state-v1";

export const PHASES: { id: PhaseId; label: string; time: string; href: string }[] = [
  { id: "capture",   label: "Capture",     time: "5 min",  href: "/setup/capture" },
  { id: "accounts",  label: "Accounts",    time: "15 min", href: "/setup/accounts" },
  { id: "starter",   label: "Starter pkg", time: "10 min", href: "/setup/starter" },
  { id: "configure", label: "Configure",   time: "20 min", href: "/setup/configure" },
  { id: "outputs",   label: "Outputs",     time: "10 min", href: "/setup/outputs" },
];

export const PHASE_INDEX: Record<PhaseId, number> = {
  capture: 0,
  accounts: 1,
  starter: 2,
  configure: 3,
  outputs: 4,
};

function emptyState(): SetupState {
  return {
    currentPhase: "capture",
    phases: {
      capture:   { status: "not-started", data: {} },
      accounts:  { status: "not-started", data: {} },
      starter:   { status: "not-started", data: {} },
      configure: { status: "not-started", data: {} },
      outputs:   { status: "not-started", data: {} },
    },
  };
}

export function readSetupState(): SetupState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as SetupState;
    // Forward-compat: fill in any missing phase records.
    const empty = emptyState();
    for (const id of Object.keys(empty.phases) as PhaseId[]) {
      if (!parsed.phases[id]) parsed.phases[id] = empty.phases[id];
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

export function writeSetupState(state: SetupState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function setPhaseStatus(
  phase: PhaseId,
  status: PhaseStatus,
  patch?: Record<string, unknown>
): SetupState {
  const state = readSetupState();
  state.phases[phase] = {
    ...state.phases[phase],
    status,
    data: { ...state.phases[phase].data, ...(patch ?? {}) },
  };
  // Advance currentPhase to the next not-done phase, or "done" if all are done.
  const allDone = (Object.keys(state.phases) as PhaseId[]).every(
    (id) => state.phases[id].status === "done"
  );
  if (allDone) {
    state.currentPhase = "done";
  } else if (status === "done") {
    const idx = PHASE_INDEX[phase];
    const next =
      (Object.keys(PHASE_INDEX) as PhaseId[]).find(
        (id) => PHASE_INDEX[id] > idx && state.phases[id].status !== "done"
      ) ?? phase;
    state.currentPhase = next;
  }
  writeSetupState(state);
  return state;
}

export function resetSetup(): SetupState {
  const fresh = emptyState();
  writeSetupState(fresh);
  return fresh;
}

export function progressFraction(state: SetupState): number {
  const total = Object.keys(state.phases).length;
  const done = (Object.values(state.phases) as PhaseRecord[]).filter(
    (p) => p.status === "done"
  ).length;
  return total === 0 ? 0 : done / total;
}
