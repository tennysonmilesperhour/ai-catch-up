// Browser-side Anthropic Messages API client. The user's key (BYOK)
// goes from their localStorage to api.anthropic.com directly, our
// server never sees it. Anthropic supports CORS for browser callers
// when the `anthropic-dangerous-direct-browser-access` header is set;
// the "dangerous" naming is about exposing keys in app-bundled code,
// which doesn't apply to BYOK where the key is the user's own.

const API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Default to Claude Sonnet 4.6, the right balance of speed + quality
// for prompt-running. Phase 4 (CLAUDE.md generation) might want Opus 4.7
// for the heavier reasoning task; bumpable via the `model` arg.
export const DEFAULT_MODEL = "claude-sonnet-4-6";
export const HEAVY_MODEL = "claude-opus-4-7";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type RunResult = {
  ok: true;
  content: string;
  usage: { input_tokens: number; output_tokens: number };
  model: string;
} | {
  ok: false;
  error: string;
};

export type RunOptions = {
  model?: string;
  maxTokens?: number;
  system?: string;
  signal?: AbortSignal;
};

/**
 * Run a single user message against Claude using a BYOK API key.
 * Returns the assistant's text plus token usage. Non-streaming for
 * v1.1 simplicity; streaming is a v1.2 polish.
 */
export async function runMessage(
  apiKey: string,
  prompt: string,
  opts: RunOptions = {}
): Promise<RunResult> {
  if (!apiKey) {
    return { ok: false, error: "No API key configured. Add it in Settings." };
  }

  const body: Record<string, unknown> = {
    model: opts.model ?? DEFAULT_MODEL,
    max_tokens: opts.maxTokens ?? 2048,
    messages: [{ role: "user", content: prompt }],
  };
  if (opts.system) body.system = opts.system;

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Network error: ${err.message}`
          : "Network error reaching api.anthropic.com.",
    };
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message ?? detail;
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      error:
        res.status === 401
          ? "API key rejected. Check it in Settings (must start with sk-ant-)."
          : detail,
    };
  }

  let json: {
    content?: { type: string; text: string }[];
    usage?: { input_tokens: number; output_tokens: number };
    model?: string;
  };
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "Invalid response from Anthropic." };
  }

  const text =
    json.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n") ?? "";

  return {
    ok: true,
    content: text,
    usage: json.usage ?? { input_tokens: 0, output_tokens: 0 },
    model: json.model ?? body.model as string,
  };
}

/** Extract {{variable_name}} and [PLACEHOLDER] tokens from a prompt. */
export function extractVariables(prompt: string): string[] {
  const found = new Set<string>();
  const reTemplate = /\{\{([A-Za-z0-9_\s]+)\}\}/g;
  const reBracket = /\[([A-Z_][A-Z0-9_ \-,/]*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = reTemplate.exec(prompt)) !== null) {
    found.add(m[1].trim());
  }
  while ((m = reBracket.exec(prompt)) !== null) {
    found.add(m[1].trim());
  }
  return Array.from(found);
}

/** Replace tokens in a prompt with user-supplied values. Unknown tokens
 *  are left intact so Claude can flag them in its response. */
export function fillVariables(
  prompt: string,
  values: Record<string, string>
): string {
  let out = prompt;
  for (const [key, val] of Object.entries(values)) {
    if (!val) continue;
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, "g"), val)
      .replace(new RegExp(`\\[${escaped}\\]`, "g"), val);
  }
  return out;
}
