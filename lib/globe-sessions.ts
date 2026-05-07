// Curated demo session data for the marketing OpsGlobe. Each entry
// represents a buyer's "logged in from" location with active status.
// On Vercel, /api/sessions reads x-vercel-ip-country + city headers
// from real visits and aggregates; this curated list is the fallback
// when the live data hasn't kicked in (low traffic or local dev).

export type GlobeSession = {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  /** Active = currently online, recent = within last 60 min, stale = older. */
  state: "active" | "recent" | "stale";
};

export const DEMO_SESSIONS: GlobeSession[] = [
  { id: "sf",  city: "San Francisco", country: "US", lat: 37.7749, lon: -122.4194, state: "active" },
  { id: "ny",  city: "New York",       country: "US", lat: 40.7128, lon: -74.0060,  state: "active" },
  { id: "la",  city: "Los Angeles",    country: "US", lat: 34.0522, lon: -118.2437, state: "active" },
  { id: "chi", city: "Chicago",        country: "US", lat: 41.8781, lon: -87.6298,  state: "recent" },
  { id: "atx", city: "Austin",         country: "US", lat: 30.2672, lon: -97.7431,  state: "active" },
  { id: "tor", city: "Toronto",        country: "CA", lat: 43.6532, lon: -79.3832,  state: "recent" },
  { id: "ldn", city: "London",         country: "UK", lat: 51.5074, lon: -0.1278,   state: "active" },
  { id: "ams", city: "Amsterdam",      country: "NL", lat: 52.3676, lon: 4.9041,    state: "recent" },
  { id: "ber", city: "Berlin",         country: "DE", lat: 52.5200, lon: 13.4050,   state: "stale" },
  { id: "par", city: "Paris",          country: "FR", lat: 48.8566, lon: 2.3522,    state: "active" },
  { id: "sto", city: "Stockholm",      country: "SE", lat: 59.3293, lon: 18.0686,   state: "stale" },
  { id: "lis", city: "Lisbon",         country: "PT", lat: 38.7223, lon: -9.1393,   state: "recent" },
  { id: "tlv", city: "Tel Aviv",       country: "IL", lat: 32.0853, lon: 34.7818,   state: "recent" },
  { id: "dub", city: "Dubai",          country: "AE", lat: 25.2048, lon: 55.2708,   state: "stale" },
  { id: "blr", city: "Bengaluru",      country: "IN", lat: 12.9716, lon: 77.5946,   state: "active" },
  { id: "del", city: "Delhi",          country: "IN", lat: 28.7041, lon: 77.1025,   state: "recent" },
  { id: "sgp", city: "Singapore",      country: "SG", lat: 1.3521,  lon: 103.8198,  state: "active" },
  { id: "hkg", city: "Hong Kong",      country: "HK", lat: 22.3193, lon: 114.1694,  state: "stale" },
  { id: "tyo", city: "Tokyo",          country: "JP", lat: 35.6762, lon: 139.6503,  state: "active" },
  { id: "syd", city: "Sydney",         country: "AU", lat: -33.8688, lon: 151.2093, state: "recent" },
  { id: "auk", city: "Auckland",       country: "NZ", lat: -36.8485, lon: 174.7633, state: "stale" },
  { id: "spo", city: "São Paulo",      country: "BR", lat: -23.5505, lon: -46.6333, state: "recent" },
  { id: "mex", city: "Mexico City",    country: "MX", lat: 19.4326, lon: -99.1332,  state: "stale" },
];

export type GlobeFeed = {
  sessions: GlobeSession[];
  totals: {
    active: number;
    recent: number;
    stale: number;
    countries: number;
  };
  source: "live" | "demo";
  generatedAt: number;
};

export function summariseSessions(
  sessions: GlobeSession[],
  source: GlobeFeed["source"]
): GlobeFeed {
  const totals = {
    active: sessions.filter((s) => s.state === "active").length,
    recent: sessions.filter((s) => s.state === "recent").length,
    stale: sessions.filter((s) => s.state === "stale").length,
    countries: new Set(sessions.map((s) => s.country)).size,
  };
  return { sessions, totals, source, generatedAt: Date.now() };
}
