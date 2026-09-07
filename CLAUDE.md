# CLAUDE.md

Persistent context for Claude Code on this project. Read this file at the start of every session.

## Project overview

V1.0 of an AI onboarding product for solo entrepreneurs and small-team leads who became the de facto AI lead by default. Price: $49 one-time. V1.0 ships the marketing site and admin dashboard only; the product delivery flow is v1.1. The buyer sees the landing page, pays via a Stripe payment link, and is redirected to a "thank you, video coming soon" page. Owner: Tennyson (non-developer). Claude Code is the primary builder and deployment engineer.

## Handoff protocol (critical, do not violate)

There are two Claude instances working on this product:

1. **Claude Code (this repo)** - owns code, structure, deployment.
2. **Strategy Claude (claude.ai web)** - owns content, copy, design decisions, positioning.

Rules:

- **Never edit files in `/content/` based on your own judgment.** Those files are content decisions owned by Strategy Claude and Tennyson.
- When Tennyson wants content changed, instructions arrive in `HANDOFF.md` with the form: "Replace `/content/landing/hero.mdx` with this:" followed by new content.
- At the start of every session, read `HANDOFF.md`. If it contains pending instructions, execute them, then delete the processed instructions and log a one-line summary in that file's "Completed handoffs" section.
- You **can** edit `/components/`, `/app/`, `/middleware.ts`, config files, and everything outside `/content/` freely.
- You **can** edit `/content/` when Tennyson directly asks you to, or when `HANDOFF.md` instructs you to.

## Tech stack (locked, do not suggest alternatives)

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4
- **Content:** MDX for copy, JSON for structured data
- **Deployment:** Vercel
- **Payment:** Stripe payment link (URL pasted into env var)
- **Email capture:** POST to `/api/subscribe`. In production it stores addresses in Supabase and optionally forwards to `SUBSCRIBE_WEBHOOK_URL` (returns 503 if nothing durable accepts the email); the local `/data/subscribers.json` write is dev-only.
- **Auth:** signed-cookie sessions (`middleware.ts` + `lib/session.ts`). At `/login`, admin is granted when the email matches `ADMIN_EMAIL` **and** `ADMIN_PASSWORD` is provided (typing the admin email alone can never grant admin); any other email mints a buyer session. GitHub OAuth is an optional alternative admin path (matches the verified email to `ADMIN_EMAIL`). Requires `SESSION_SECRET`; `PAID_EMAILS` gates the paywall.
- **Database:** shared Vibe Check Supabase stores newsletter subscriptions in `aicu_subscribers`. Other State is repo files, GitHub-Contents-API commits, per-instance memory, or browser `localStorage`. See `docs/architecture.md`.

For how state persists, how auth works, and the full env-var list, read `docs/architecture.md`. For the ship-readiness plan, see `docs/ship-plan.md`.

## File structure

```
/
├── README.md
├── HANDOFF.md
├── CLAUDE.md
├── .env.example
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── middleware.ts
├── /app
│   ├── layout.tsx
│   ├── page.tsx                   public landing page
│   ├── thank-you/page.tsx         post-payment landing
│   ├── login/page.tsx             email + GitHub OAuth sign-in
│   ├── /setup                     paid onboarding flow (gated)
│   ├── /admin                     ~14 surfaces: pulse, plan, schedule,
│   │                             nexus, prompts, roster, workflows,
│   │                             decisions, checklist, claude-md,
│   │                             coding-guide, invocations, memo, settings
│   └── /api
│       ├── subscribe/route.ts     email capture (webhook in prod)
│       ├── login, logout, auth/github  session auth
│       ├── nexus, nexus/nodes     read + Hermes writes
│       └── blog/publish, admin/*, sessions, version
├── /content
│   ├── /landing
│   │   ├── hero.mdx
│   │   ├── plateau.mdx
│   │   ├── what-you-get.mdx
│   │   ├── who-its-for.mdx
│   │   └── final-cta.mdx
│   └── /admin
│       ├── plan.mdx
│       ├── schedule.json
│       ├── decisions.json
│       └── prompts.json
├── /components
│   ├── /landing
│   ├── /admin
│   └── /shared
└── /data
    └── subscribers.json
```

## Voice reference

The Anti-Engineer brand brief (`docs/brand/anti-engineer-brief.md`) is the source of truth for voice, persona, and worldview. Read it before writing any new copy or briefing Strategy Claude. Hooks are mirrored at `docs/brand/hooks.md`.

The brief is a voice-and-worldview layer only. As of the 2026-05-08 decision, **the price stays $49 and the aesthetic stays Aurora Command**. Do not adopt the brief's $97 / "The Anti-Engineer's Stack" / print-zine aesthetic without an explicit new instruction.

Run `npm run voice-check` to scan `/content/**/*.{md,mdx}` for em-dashes, corporate softeners, and italics. The script reports only; pass `--strict` to make it fail.

## Design rules

- **No em dashes anywhere** in code or content. Use regular dashes, commas, or parentheses. Hard rule, no exceptions.
- **Tone:** warm, refined, editorial. Not tech-startup-generic.
- **Primary font:** Georgia serif (body and headers).
- **Secondary font:** `ui-monospace`, Menlo (labels, nav, technical elements).
- **Color palette:** The site now ships the **Aurora Command** palette (midnight navy background `#06101e`, amber and cyan accents). The CSS tokens in `app/globals.css` are the source of truth. Note: the token *names* are historical (`--color-cream` is now navy, `--color-terracotta` is amber, `--color-rust` is a warmer amber) and are due for a rename; do not trust a token name over its value. The warm-cream values below are the retired original palette, kept for reference only.
  - Background: `#faf7f2` (warm cream)
  - Dark sections: `#2a2520`, `#1a1612`
  - Primary accent: `#d97757` (terracotta)
  - Secondary accent: `#c96442` (rust)
  - Muted: `#8a7f6b`, `#5c5248`
  - Border: `#d4cdbf`, `#e5ddd0`, `#3a342c`
- Admin dashboard uses darker palette for the header, lighter for content.

## Running locally

```bash
npm install
cp .env.example .env.local    # then fill in values
npm run dev                   # http://localhost:3000
```

Public site: `/`
Admin: `/admin` (redirects to `/login` if not authenticated). Admin access requires signing in with GitHub as `ADMIN_EMAIL`.

## Deploying

Vercel is connected to the GitHub repo. Pushing to `main` triggers a production deploy. CI (`.github/workflows/ci.yml`) runs typecheck, voice-check, and build on every PR. Env vars must be set in the Vercel dashboard, see `.env.example` and `docs/architecture.md` for the full list. The load-bearing ones:

- `SESSION_SECRET` (required, 32+ random chars, or auth breaks)
- `ADMIN_EMAIL` (who gets admin via GitHub OAuth)
- `STRIPE_PAYMENT_LINK` (unset means every buy button becomes email capture)
- `SUBSCRIBE_WEBHOOK_URL` (unset means signups are dropped in prod)
- `PAID_EMAILS` (set to enforce the paywall on `/setup` and buyer surfaces)
- `NEXT_PUBLIC_SITE_URL`

## Development branch

Work happens on a `claude/*` branch and merges to `main` for production deploys.

## Current focus

_(Update as work progresses.)_

- v1.0 marketing site and admin dashboard shipped; hardening for launch (see `docs/ship-plan.md`).
