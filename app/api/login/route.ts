import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  isValidEmail,
  roleForEmail,
  signSession,
} from "@/lib/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawEmail = String(formData.get("email") || "");
  const email = rawEmail.trim().toLowerCase();
  const next = String(formData.get("next") || "");

  if (!isValidEmail(email)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "email");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const role = roleForEmail(email);
  const token = await signSession({
    email,
    role,
    iat: Math.floor(Date.now() / 1000),
  });

  const destination =
    role === "admin"
      ? next && next.startsWith("/")
        ? next
        : "/admin"
      : "/preview";

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
  return res;
}
