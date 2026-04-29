// Run-history persistence helpers. Lives in lib/ (not in the RunPrompt
// component) so workspace-state.ts and admin pages can read it without
// importing client component code.

const HISTORY_KEY = "run-prompt-history-v1";
const HISTORY_MAX = 30;

export type HistoryEntry = {
  id: string;
  ts: number;
  title: string;
  /** Optional: the canonical prompt id from prompts.json (number) when the
   *  invocation came from the library. Setup phases and ad-hoc runs leave
   *  this undefined. */
  promptId?: number | string;
  prompt: string;
  result: string;
  inputTokens: number;
  outputTokens: number;
};

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  try {
    const list = readHistory();
    list.unshift(entry);
    window.localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(list.slice(0, HISTORY_MAX))
    );
  } catch {
    /* ignore */
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
