import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isValidEmail,
  roleForEmail,
  signSession,
} from "@/lib/session";

const STATE_COOKIE = "ac_oauth_state";
const NEXT_COOKIE = "ac_oauth_next";

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type GitHubUser = {
  login: string;
  email: string | null;
};

function safeAdminNext(nextValue: string, baseUrl: string): string | null {
  if (!nextValue) return null;
  try {
    const resolved = new URL(nextValue, baseUrl);
    const expectedOrigin = new URL(baseUrl).origin;
    if (resolved.origin !== expectedOrigin) return null;
    if (!resolved.pathname.startsWith("/admin")) return null;
    return resolved.pathname + resolved.search;
  } catch {
    return null;
  }
}

function loginErrorRedirect(request: Request, code: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", code);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(NEXT_COOKIE);
  return res;
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split("=")[1];

  const cookieNext = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${NEXT_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return loginErrorRedirect(request, "github_state");
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return loginErrorRedirect(request, "github_not_configured");
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: new URL(
            "/api/auth/github/callback",
            request.url
          ).toString(),
        }),
      }
    );

    if (!tokenRes.ok) {
      console.error("[github oauth] token exchange failed", tokenRes.status);
      return loginErrorRedirect(request, "github_token");
    }

    const tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      console.error("[github oauth] no access token", tokenJson.error);
      return loginErrorRedirect(request, "github_token");
    }

    const [userRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "ai-catch-up",
        },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "ai-catch-up",
        },
      }),
    ]);

    if (!userRes.ok) {
      console.error("[github oauth] user fetch failed", userRes.status);
      return loginErrorRedirect(request, "github_user");
    }

    const user = (await userRes.json()) as GitHubUser;
    let email: string | null = null;

    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as GitHubEmail[];
      const primary = emails.find((e) => e.primary && e.verified);
      const verified = emails.find((e) => e.verified);
      email = primary?.email ?? verified?.email ?? null;
    }
    if (!email && user.email) email = user.email;
    if (!email && user.login) {
      email = `${user.login}@users.noreply.github.com`;
    }
    if (!email || !isValidEmail(email)) {
      return loginErrorRedirect(request, "github_email");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const role = roleForEmail(normalizedEmail);
    const token = await signSession({
      email: normalizedEmail,
      role,
      iat: Math.floor(Date.now() / 1000),
    });

    const adminNext = cookieNext
      ? safeAdminNext(decodeURIComponent(cookieNext), request.url)
      : null;
    const destination =
      role === "admin" ? (adminNext ?? "/admin") : "/preview";

    const res = NextResponse.redirect(new URL(destination, request.url), {
      status: 303,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  } catch (err) {
    console.error("[github oauth] unexpected error:", err);
    return loginErrorRedirect(request, "server");
  }
}
