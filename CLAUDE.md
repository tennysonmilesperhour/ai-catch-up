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
- **Email capture:** POST to `/api/subscribe`, which appends to `/data/subscribers.json` (v1.0 only; upgrades to a real email service in v1.1)
- **Admin auth:** password-only via `middleware.ts`, password in `ADMIN_PASSWORD` env var
- **Database:** none in v1.0. Everything static or file-based.

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
│   ├── /admin
│   │   ├── layout.tsx             admin shell with tab nav
│   │   ├── page.tsx               redirects to /admin/plan
│   │   ├── login/page.tsx         password entry
│   │   ├── plan/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── nexus/page.tsx
│   │   ├── prompts/page.tsx
│   │   └── decisions/page.tsx
│   └── /api
│       ├── subscribe/route.ts     email capture endpoint
│       └── admin/login/route.ts   password check, sets cookie
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

## Design rules

- **No em dashes anywhere** in code or content. Use regular dashes, commas, or parentheses. Hard rule, no exceptions.
- **Tone:** warm, refined, editorial. Not tech-startup-generic.
- **Primary font:** Georgia serif (body and headers).
- **Secondary font:** `ui-monospace`, Menlo (labels, nav, technical elements).
- **Color palette:**
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
Admin: `/admin` (redirects to `/admin/login` if not authenticated)

## Deploying

Vercel is connected to the GitHub repo. Pushing to `main` triggers a production deploy. Env vars must be set in the Vercel dashboard:

- `STRIPE_PAYMENT_LINK`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`

## Development branch

Active work happens on `claude/ai-onboarding-v1-RTsDk`. Merge to `main` for production deploys.

## Current focus

_(Update as work progresses.)_

- Scaffolding v1.0 marketing site and admin dashboard.
