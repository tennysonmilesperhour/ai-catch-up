// Bring-your-own-key (BYOK) helpers for the Anthropic API key the buyer
// pastes into Settings. v1.1 scope: stored in localStorage, never sent to
// our server. The /workspace/run flow calls api.anthropic.com directly
// from the browser using their key, so we only ever see prompts/results
// the user explicitly chooses to save.
//
// Trade-off: localStorage is XSS-readable. We're not rolling our own
// encryption — that's security theater on a key that lives in the same
// JS context that would be compromised. The honest message in the UI is
// "your browser stores this; clear it from Settings or a private
// browsing session is your tab."

const STORAGE_KEY = "byok-anthropic-v1";

export type ApiKeyStatus = {
  hasKey: boolean;
  /** First 7 + last 4 chars of the stored key, for fingerprint display. */
  fingerprint: string | null;
};

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (!trimmed) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function fingerprintKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 14) return "•••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function getStatus(): ApiKeyStatus {
  const key = getApiKey();
  return { hasKey: Boolean(key), fingerprint: fingerprintKey(key) };
}

// Anthropic keys start with "sk-ant-". This is a presence check, not a
// validation — the only real validation is calling the API.
export function looksLikeAnthropicKey(key: string): boolean {
  return /^sk-ant-/.test(key.trim());
}
