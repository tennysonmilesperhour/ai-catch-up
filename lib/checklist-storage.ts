const STORAGE_KEY = "launch-checklist-state-v1";

export type ChecklistItemState = {
  status?: "not-started" | "in-progress" | "done";
  note?: string;
  updatedAt?: string;
};

export type ChecklistState = {
  [itemId: string]: ChecklistItemState;
};

export function loadState(): ChecklistState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChecklistState) : {};
  } catch {
    return {};
  }
}

export function saveState(state: ChecklistState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save checklist state:", err);
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear checklist state:", err);
  }
}

export function updateItem(
  state: ChecklistState,
  itemId: string,
  updates: Partial<ChecklistItemState>
): ChecklistState {
  return {
    ...state,
    [itemId]: {
      ...state[itemId],
      ...updates,
      updatedAt: new Date().toISOString(),
    },
  };
}
