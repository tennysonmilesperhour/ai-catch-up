// INSERT-only public credentials. This server never needs a service-role key.
export async function storeSubscriber(email: string): Promise<boolean> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return false;
  const response = await fetch(`${url}/rest/v1/aicu_subscribers`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ email }),
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) return true;
  const error = await response.json().catch(() => ({}));
  if (response.status === 409 && error.code === "23505") return true;
  throw new Error(`Subscriber storage returned ${response.status}`);
}
