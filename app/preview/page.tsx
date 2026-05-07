import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// /preview as a "locked tabs" upsell page is retired. The page
// existed pre-/setup and pre-BYOK to dangle the admin tabs in front of
// signed-in non-buyers; with v1.1+ shipping the actual product, that
// metaphor doesn't apply. Server-side redirect:
//   - authed → /admin/pulse (their workspace home)
//   - unauthed → / (the landing pitch)
//
// /preview/dashboard remains as the public marketing playground; the
// nested route still works because Next.js routes match more specific
// segments before this index.
export const dynamic = "force-dynamic";

export default async function PreviewIndexPage() {
  const c = await cookies();
  const session = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (session) {
    redirect("/admin/pulse");
  }
  redirect("/");
}
