import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { join } from "node:path";

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
  // Vercel logs in prod). v1.0 only; v1.1 will route this to a real service.
  console.log("[subscribe]", JSON.stringify(entry));

  // Best-effort append to the local JSON file. Will fail silently on Vercel's
  // read-only serverless filesystem, which is fine because we logged above.
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
