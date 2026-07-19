# Architecture notes

A short map of how this app is wired, focused on the parts that surprise people: where state lives, how auth works, and what needs configuring to run in production. For the prioritized work plan, see `docs/ship-plan.md`.

## Runtime shape

- Next.js 15 App Router on Vercel. The public marketing site is mostly static; `/admin/*` and `/setup/*` are dynamic and gated by `middleware.ts`.
- No database. Every piece of "state" is one of: a file committed to the repo, a file committed through the GitHub Contents API at runtime, an in-memory value on a single serverless instance, or something in the visitor's browser `localStorage`.

## Where state lives (the important part)

| State | Storage | Durable on Vercel? | Notes |
| --- | --- | --- | --- |
| Marketing / admin copy | `/content/**` (repo) | Yes | MDX + JSON, bundled into the function via `outputFileTracingIncludes`. |
| Blog posts | GitHub Contents API → `content/blog/*.mdx` | Yes | Written by `POST /api/blog/publish`; rendered with react-markdown (no raw HTML). |
| Hermes Nexus additions | GitHub Contents API → `content/admin/hermes-nexus.json` | Yes (eventually) | `POST /api/nexus/nodes` commits; `GET /api/nexus` reads the deployed file, so new nodes appear on the next deploy, not instantly. |
| Newsletter subscribers | `SUBSCRIBE_WEBHOOK_URL` (prod) / `data/subscribers.json` (dev) | Only via webhook | On Vercel the file write is skipped; `/api/subscribe` returns 503 if no durable destination accepts the email. |
| Globe session pins | in-memory `Map` | No | Per-instance, resets on cold start; falls back to a demo dataset at low traffic. |
| Rate-limit buckets | in-memory `Map` | No | Per-instance, so limits are a guardrail, not a hard cap. |
| Buyer workspace (setup progress, checklists, roster, run history, usage, BYOK key) | browser `localStorage` | Per-browser only | Clearing the cache or switching devices resets it. Server persistence is a planned upgrade (see ship-plan Phase 2). |

## Auth

- Sessions are HMAC-signed cookies (`ac_session`), signed with `SESSION_SECRET`. In production a missing/short secret fails loudly rather than signing with an unstable per-process key. Tokens carry `iat` and are rejected server-side past `SESSION_MAX_AGE` (30 days).
- Two login paths:
  - **Email form** (`POST /api/login`): mints **buyer-only** sessions. No password/verification, so it can never grant admin.
  - **GitHub OAuth** (`/api/auth/github`): verifies a real email; grants **admin** only when that email matches `ADMIN_EMAIL`.
- `middleware.ts` gates `/admin/*` and `/setup/*`. Buyers reach the workspace surfaces in `BUYER_ALLOWED` and the setup flow; vendor surfaces are admin-only. When `PAID_EMAILS` is set, buyers must be on the list; unset means "preview mode" (any authed email passes).

## Anthropic (BYOK)

- `lib/anthropic-client.ts` runs in the browser and sends the buyer's own key straight to `api.anthropic.com` (`anthropic-dangerous-direct-browser-access`). The server never sees or stores the key. The vendor pays nothing for inference.
- Models: `DEFAULT_MODEL = claude-sonnet-5`, `HEAVY_MODEL = claude-opus-4-8`. Thinking is disabled to keep the prompt-runner fast and predictable under the `max_tokens` budget.

## Environment variables

Required for a working production deploy: `SESSION_SECRET`, `ADMIN_EMAIL`, `STRIPE_PAYMENT_LINK`, `NEXT_PUBLIC_SITE_URL`, `SUBSCRIBE_WEBHOOK_URL` (+ optional `SUBSCRIBE_WEBHOOK_TOKEN`). Set `PAID_EMAILS` to enforce the paywall. GitHub sync/publish uses `GITHUB_USERNAME`, `GITHUB_TOKEN`, `GITHUB_OAUTH_CLIENT_ID/SECRET`, `GITHUB_BLOG_TOKEN`, `GITHUB_BLOG_REPO_OWNER/REPO/BRANCH`, `BLOG_PUBLISH_SECRET`, `HERMES_API_KEY`. See `.env.example` for the full list.

## Stripe flow

CTAs point at `STRIPE_PAYMENT_LINK`. The success/return URL (`/thank-you`) is configured in the Stripe dashboard, not in code. If `STRIPE_PAYMENT_LINK` is unset, every buy button silently becomes an email-capture "Notify me" (`lib/checkout.ts`).
