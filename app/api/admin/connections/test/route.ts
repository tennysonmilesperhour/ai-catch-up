import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only. Verified inline since middleware only protects /admin
// HTML routes; API routes need their own session check (and should
// return JSON, not redirect, on auth failure).

type Provider = "anthropic" | "github" | "stripe";

type Payload = {
  provider?: unknown;
  key?: unknown;
};

type TestResult =
  | { ok: true; detail: string }
  | { ok: false; reason: string };

const KEY_MAX = 4096;

async function testAnthropic(key: string): Promise<TestResult> {
  // The cheapest way to validate an Anthropic key is to call /v1/models,
  // which returns a paginated list of available models. A 401 means the
  // key is bad; a 200 means it works and we can read the first model id
  // back to the user as a friendly confirmation.
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      reason: `network error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: "key rejected by Anthropic (401/403)" };
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return {
      ok: false,
      reason: `Anthropic returned ${res.status} ${txt.slice(0, 120)}`,
    };
  }
  const json = (await res.json().catch(() => null)) as
    | { data?: Array<{ id?: string }> }
    | null;
  const firstModel = json?.data?.[0]?.id;
  return {
    ok: true,
    detail: firstModel
      ? `Key valid. First model visible: ${firstModel}.`
      : "Key valid.",
  };
}

async function testGithub(key: string): Promise<TestResult> {
  // GET /user is the standard "is this token alive" probe and tells us
  // the login back. We do not store the login; we just echo it once for
  // the operator to confirm they pasted the right token.
  let res: Response;
  try {
    res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      reason: `network error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
  if (res.status === 401) {
    return { ok: false, reason: "GitHub rejected the token (401)" };
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return {
      ok: false,
      reason: `GitHub returned ${res.status} ${txt.slice(0, 120)}`,
    };
  }
  const json = (await res.json().catch(() => null)) as
    | { login?: string }
    | null;
  return {
    ok: true,
    detail: json?.login ? `Token valid for ${json.login}.` : "Token valid.",
  };
}

async function testStripe(key: string): Promise<TestResult> {
  // GET /v1/balance is a tiny authenticated probe. The response includes
  // the livemode flag, which we surface so the user knows whether they
  // pasted a test key or a live key.
  let res: Response;
  try {
    res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      reason: `network error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
  if (res.status === 401) {
    return { ok: false, reason: "Stripe rejected the key (401)" };
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return {
      ok: false,
      reason: `Stripe returned ${res.status} ${txt.slice(0, 120)}`,
    };
  }
  const json = (await res.json().catch(() => null)) as
    | { livemode?: boolean }
    | null;
  return {
    ok: true,
    detail: json?.livemode === false
      ? "Test-mode key, valid."
      : json?.livemode === true
        ? "Live-mode key, valid."
        : "Key valid.",
  };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const provider = payload.provider;
  const key = typeof payload.key === "string" ? payload.key.trim() : "";

  if (provider !== "anthropic" && provider !== "github" && provider !== "stripe") {
    return NextResponse.json(
      { error: "provider must be anthropic, github, or stripe" },
      { status: 400 }
    );
  }
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }
  if (key.length > KEY_MAX) {
    return NextResponse.json(
      { error: `key exceeds ${KEY_MAX} chars` },
      { status: 400 }
    );
  }

  const result =
    provider === "anthropic"
      ? await testAnthropic(key)
      : provider === "github"
        ? await testGithub(key)
        : await testStripe(key as string);

  if (result.ok) {
    return NextResponse.json({ ok: true, detail: result.detail });
  }
  return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "method not allowed" }, { status: 405 });
}
