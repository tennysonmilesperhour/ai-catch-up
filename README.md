# AI Catch Up

V1.0 of a $49 one-time AI onboarding product. This repo ships the marketing site, the gated buyer workspace and setup flow, and Tennyson's admin dashboard.

## Quickstart

```bash
npm install
cp .env.example .env.local
# Fill in at least SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD,
# NEXT_PUBLIC_SITE_URL (and STRIPE_PAYMENT_LINK to test buy buttons)
npm run dev
```

Visit:

- `http://localhost:3000/` - public landing page
- `http://localhost:3000/thank-you` - post-payment page
- `http://localhost:3000/login` - sign in (email form, optional GitHub)
- `http://localhost:3000/admin` - dashboard (admin sees vendor surfaces; buyers see their workspace)
- `http://localhost:3000/setup` - the paid five-phase setup flow (needs a session)

## How sign-in works

Sessions are signed cookies (`middleware.ts` + `lib/session.ts`), signed with `SESSION_SECRET`. Production refuses to run with a missing or short secret, and sessions expire after 30 days.

- **Admin:** sign in at `/login` with the `ADMIN_EMAIL` address **and** the `ADMIN_PASSWORD`. Typing the admin email alone never grants admin. If `ADMIN_PASSWORD` is unset, the email form cannot grant admin at all.
- **GitHub (optional):** with `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` set, "Sign in with GitHub" grants admin when the verified GitHub email matches `ADMIN_EMAIL`.
- **Buyers:** any other email gets a buyer session. When `PAID_EMAILS` is set, only listed addresses reach `/setup` and the buyer surfaces under `/admin`; when it is unset the app runs in preview mode and any signed-in email passes.

There is no shared-password-only login any more; the old `ADMIN_PASSWORD`-only gate was replaced in July 2026.

## Architecture

- **Next.js 15** App Router, **React 19**, **Tailwind v4**, **TypeScript**
- **Content** lives in `/content/` as MDX + JSON so it can be edited without code changes
- **Email capture** (`POST /api/subscribe`) stores addresses in `aicu_subscribers` on the shared Supabase project, and optionally forwards to `SUBSCRIBE_WEBHOOK_URL`. It returns an error if nothing durable accepted the address. The local `data/subscribers.json` write is dev-only.
- **Buyer workspace** state (setup progress, checklists, roster, run history) is saved in the buyer's browser. The Nexus map's admin data is saved through the GitHub Contents API.

`docs/architecture.md` has the full map of where state lives and every environment variable.

## Handoff protocol

Content is owned by Strategy Claude (claude.ai web) and Tennyson. Claude Code (this repo) only edits `/content/` when instructed via `HANDOFF.md` or by direct request. See `CLAUDE.md` for full rules.

## Checks

```bash
npm run typecheck
npm test
npm run voice-check -- --strict
npm run build
```

CI (`.github/workflows/ci.yml`) runs the same four on every PR and push to `main`.

## Deploying

Vercel deploys `main` to production. Set the env vars in the Vercel dashboard (see `.env.example`). The load-bearing ones: `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `STRIPE_PAYMENT_LINK`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `PAID_EMAILS` once you want the paywall enforced.

## Shared subscriber storage

The active backend is Vibe Check, `xyhbuqsxglfjbounogdz`. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for production, preview, and development. The public key can insert email addresses into `aicu_subscribers` but cannot read, update, or delete that list. A unique normalized-email index makes retries safe. `/api/subscribe` reports success only after a durable destination accepts the address. Existing optional webhooks still work.

Migration `20260907180455_subscriber_storage.sql` is deployed. Shared database migration history belongs to several apps, so do not reset it or overwrite it from a partial checkout. The existing signed-cookie auth and browser-local workspace are preserved; this does not introduce shared Supabase sign-in for AI Catch Up. The paused project formerly named AI Catch Up/Campground remains untouched for historical recovery.
