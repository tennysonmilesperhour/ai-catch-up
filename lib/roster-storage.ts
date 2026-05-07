const STORAGE_KEY = "roster-state-v1";

export type RosterPickState = {
  pick?: string;
  custom?: boolean;
  signedUp?: boolean;
  integrated?: boolean;
  updatedAt?: string;
};

export type RosterState = {
  [categoryId: string]: RosterPickState;
};

export function loadRoster(): RosterState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RosterState) : {};
  } catch {
    return {};
  }
}

export function saveRoster(state: RosterState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save roster state:", err);
  }
}

export function clearRoster(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear roster state:", err);
  }
}

export function updateRosterPick(
  state: RosterState,
  categoryId: string,
  updates: Partial<RosterPickState>
): RosterState {
  return {
    ...state,
    [categoryId]: {
      ...state[categoryId],
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function isCategoryComplete(pick: RosterPickState | undefined): boolean {
  return !!(pick && pick.pick && pick.signedUp && pick.integrated);
}
