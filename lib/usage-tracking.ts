// Per-prompt usage counter. Incremented every time RunPrompt completes
// successfully and was invoked with a promptId. Heuristics read this to
// detect stuck patterns ("you used P14 a lot then stopped").

const USAGE_KEY = "prompt-usage-v1";

export type PromptUsage = {
  count: number;
  firstAt: number;
  lastAt: number;
};

export type UsageMap = Record<string, PromptUsage>;

export function readPromptUsage(): UsageMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    return raw ? (JSON.parse(raw) as UsageMap) : {};
  } catch {
    return {};
  }
}

export function incrementPromptUsage(promptId: string | number): void {
  if (typeof window === "undefined") return;
  const id = String(promptId);
  const map = readPromptUsage();
  const now = Date.now();
  const prev = map[id];
  map[id] = {
    count: (prev?.count ?? 0) + 1,
    firstAt: prev?.firstAt ?? now,
    lastAt: now,
  };
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function clearPromptUsage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USAGE_KEY);
  } catch {
    /* ignore */
  }
}
