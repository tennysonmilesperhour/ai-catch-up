import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const DATA_FILE = join(process.cwd(), "data", "subscribers.json");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Subscriber = {
  email: string;
  createdAt: string;
};

async function readSubscribers(): Promise<Subscriber[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubscribers(list: Subscriber[]) {
  await fs.mkdir(join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

export async function POST(request: Request) {
  // 10 / 60s per IP. Subscribe is a low-stakes endpoint but the file
  // write makes it slightly more interesting to abuse, so cap it.
  const rl = rateLimit("subscribe", clientKey(request.headers), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests, try again shortly" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const email =
    typeof body === "object" && body && "email" in body
      ? String((body as { email: unknown }).email || "").trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email" },
      { status: 400 }
    );
  }

  const entry: Subscriber = {
    email,
    createdAt: new Date().toISOString(),
  };

  // Always log so the email lands somewhere persistent (local stdout in dev,
  // Vercel logs in prod). Logs are recoverable but not exportable, so we
  // also try the optional outbound webhook below.
  //
  // Mask the local-part in logs so PII doesn't sit in plaintext in Vercel
  // logs. The webhook still receives the real address; only the log line
  // is masked. Pattern: "f***@example.com".
  const maskedEmail = email.replace(
    /^([^@]{1,2})[^@]*(@.+)$/,
    (_m, head: string, tail: string) => `${head}***${tail}`
  );
  console.log("[subscribe]", JSON.stringify({ ...entry, email: maskedEmail }));

  // Optional outbound webhook. If SUBSCRIBE_WEBHOOK_URL is set we POST the
  // entry there (Resend audience, ConvertKit, Zapier hook, Google Apps
  // Script, whatever). If SUBSCRIBE_WEBHOOK_TOKEN is set, it's sent as a
  // Bearer token. This is the recommended persistence path for production.
  const webhookUrl = process.env.SUBSCRIBE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = process.env.SUBSCRIBE_WEBHOOK_TOKEN;
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        console.warn(
          "[subscribe] webhook non-2xx:",
          res.status,
          res.statusText
        );
      }
    } catch (err) {
      console.warn(
        "[subscribe] webhook fetch failed:",
        (err as Error).message
      );
    }
  }

  // Best-effort append to the local JSON file. Will fail silently on Vercel's
  // read-only serverless filesystem, which is fine because we logged above
  // and (if configured) forwarded to the webhook. Kept for local dev so the
  // admin can inspect the file during development.
  try {
    const list = await readSubscribers();
    if (!list.some((s) => s.email === email)) {
      list.push(entry);
      await writeSubscribers(list);
    }
  } catch (err) {
    console.warn("[subscribe] file write skipped:", (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
