import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Admin password is not configured on the server" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const redirectUrl = new URL(next.startsWith("/admin") ? next : "/admin", request.url);
  const res = NextResponse.redirect(redirectUrl, { status: 303 });
  res.cookies.set("admin_auth", password, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
