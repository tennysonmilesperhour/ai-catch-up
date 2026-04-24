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
- **Email capture** appends to `/data/subscribers.json` (v1.0 only; upgrades to a real email service in v1.1)
- **No database** in v1.0

## File structure

See `CLAUDE.md` for the full tree and handoff protocol.

## Handoff protocol

Content is owned by Strategy Claude (claude.ai web). Claude Code (this repo) only edits `/content/` when instructed via `HANDOFF.md` or by direct request. See `CLAUDE.md` for full rules.

## Deploying

Push to GitHub, connect the repo in Vercel, set env vars (`STRIPE_PAYMENT_LINK`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`), deploy.
