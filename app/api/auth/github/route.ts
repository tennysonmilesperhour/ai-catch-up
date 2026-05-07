import { NextResponse } from "next/server";

const STATE_COOKIE = "ac_oauth_state";
const NEXT_COOKIE = "ac_oauth_next";
const STATE_MAX_AGE = 60 * 10; // 10 minutes

function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "github_not_configured");
    return NextResponse.redirect(url, { status: 303 });
  }

  const incoming = new URL(request.url);
  const next = incoming.searchParams.get("next") || "";
  const state = randomState();
  const callback = new URL("/api/auth/github/callback", request.url).toString();

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", callback);
  authorize.searchParams.set("scope", "read:user user:email");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "true");

  const res = NextResponse.redirect(authorize, { status: 303 });
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: STATE_MAX_AGE,
  });
  if (next) {
    res.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: STATE_MAX_AGE,
    });
  } else {
    res.cookies.delete(NEXT_COOKIE);
  }
  return res;
}
