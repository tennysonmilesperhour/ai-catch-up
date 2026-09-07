# AI Catch Up

V1.0 of a $49 one-time AI onboarding product. This repo ships the marketing site and admin dashboard. The product delivery flow is v1.1.

## Quickstart

```bash
npm install
cp .env.example .env.local
# Fill in STRIPE_PAYMENT_LINK, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL
npm run dev
```

Visit:

- `http://localhost:3000/` - public landing page
- `http://localhost:3000/thank-you` - post-payment page
- `http://localhost:3000/admin` - password-gated admin dashboard

## Architecture

- **Next.js 15** App Router, **React 19**, **Tailwind v4**, **TypeScript**
- **Content** lives in `/content/` as MDX + JSON so it can be edited without code changes
- **Admin auth** is a single shared password in `ADMIN_PASSWORD`, enforced by `middleware.ts`
- **Email capture** persists to `aicu_subscribers` in Supabase. Local JSON is a development fallback when Supabase is not configured.
- **Supabase** stores newsletter subscribers on the active shared Vibe Check project.

## File structure

See `CLAUDE.md` for the full tree and handoff protocol.

## Handoff protocol

Content is owned by Strategy Claude (claude.ai web). Claude Code (this repo) only edits `/content/` when instructed via `HANDOFF.md` or by direct request. See `CLAUDE.md` for full rules.

## Deploying

Push to GitHub, connect the repo in Vercel, set env vars (`STRIPE_PAYMENT_LINK`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`), deploy.

## Shared subscriber storage

The active backend is Vibe Check, `xyhbuqsxglfjbounogdz`. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for production, preview, and development. The public key can insert email addresses into `aicu_subscribers` but cannot read, update, or delete that list. A unique normalized-email index makes retries safe. `/api/subscribe` reports success only after a durable destination accepts the address. Existing optional webhooks still work.

Migration `20260907180455_subscriber_storage.sql` is deployed. Shared database migration history belongs to several apps, so do not reset it or overwrite it from a partial checkout. The existing signed-cookie auth and browser-local workspace are preserved; this does not introduce shared Supabase sign-in for AI Catch Up. The paused project formerly named AI Catch Up/Campground remains untouched for historical recovery.
