import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_SESSIONS,
  summariseSessions,
  type GlobeSession,
} from "@/lib/globe-sessions";
import { clientKey, rateLimit } from "@/lib/rate-limit";

// Live globe-sessions feed. v1.x scope: in-memory per-instance roster
// keyed off Vercel-provided geo headers. Cold-start wipes the list, so
// real volume + persistence will need Vercel KV in v1.3+. Until the
// roster has at least 3 entries we serve the curated DEMO_SESSIONS so
// the marketing surface still looks alive.

export const dynamic = "force-dynamic";

type Pin = GlobeSession & { ts: number };
const ROSTER: Map<string, Pin> = new Map();
const ACTIVE_WINDOW_MS = 5 * 60_000; // 5 min
const RECENT_WINDOW_MS = 60 * 60_000; // 60 min
const STALE_AFTER_MS = 24 * 60 * 60_000; // 24h
const MAX_PINS = 64;

// Vercel sets these on every request:
//   x-vercel-ip-country
//   x-vercel-ip-country-region
//   x-vercel-ip-city (URL-encoded)
//   x-vercel-ip-latitude
//   x-vercel-ip-longitude
function readGeo(headers: Headers): {
  city: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
} {
  const city = headers.get("x-vercel-ip-city");
  const country = headers.get("x-vercel-ip-country");
  const lat = headers.get("x-vercel-ip-latitude");
  const lon = headers.get("x-vercel-ip-longitude");
  return {
    city: city ? decodeURIComponent(city) : null,
    country,
    lat: lat ? Number(lat) : null,
    lon: lon ? Number(lon) : null,
  };
}

function classify(now: number, ts: number): GlobeSession["state"] {
  const dt = now - ts;
  if (dt <= ACTIVE_WINDOW_MS) return "active";
  if (dt <= RECENT_WINDOW_MS) return "recent";
  return "stale";
}

function trimRoster(now: number) {
  // Drop pins older than STALE_AFTER_MS.
  for (const [k, p] of ROSTER) {
    if (now - p.ts > STALE_AFTER_MS) ROSTER.delete(k);
  }
  // Cap size, oldest-first.
  if (ROSTER.size > MAX_PINS) {
    const sorted = [...ROSTER.entries()].sort((a, b) => a[1].ts - b[1].ts);
    while (ROSTER.size > MAX_PINS) {
      const [k] = sorted.shift()!;
      ROSTER.delete(k);
    }
  }
}

// POST: register a hit. The landing page can ping this on mount; the
// payload is empty because the geo comes from request headers.
export async function POST(request: NextRequest) {
  // 30 / 60s per IP. The landing page only pings once on mount, so this
  // ceiling is well above legitimate use; it just blunts a misconfigured
  // client (or an attacker) from packing the in-memory roster.
  const rl = rateLimit("sessions", clientKey(request.headers), 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate" },
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

  const { city, country, lat, lon } = readGeo(request.headers);
  if (!country || lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ ok: false, error: "no geo" }, { status: 200 });
  }
  const id = `${country}-${city ?? "?"}-${Math.round(lat * 10) / 10}-${Math.round(lon * 10) / 10}`;
  const now = Date.now();
  ROSTER.set(id, {
    id,
    city: city ?? country,
    country,
    lat,
    lon,
    state: "active",
    ts: now,
  });
  trimRoster(now);
  return NextResponse.json({ ok: true, count: ROSTER.size });
}

// GET: snapshot the roster, fall back to DEMO_SESSIONS when empty.
export async function GET() {
  const now = Date.now();
  trimRoster(now);
  const live: GlobeSession[] = [...ROSTER.values()].map((p) => ({
    id: p.id,
    city: p.city,
    country: p.country,
    lat: p.lat,
    lon: p.lon,
    state: classify(now, p.ts),
  }));

  if (live.length < 3) {
    return NextResponse.json(summariseSessions(DEMO_SESSIONS, "demo"));
  }
  return NextResponse.json(summariseSessions(live, "live"));
}
