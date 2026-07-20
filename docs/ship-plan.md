# Ship-Readiness Plan: AI Catch Up v1.0

Date: 2026-07-19
Prepared by: Claude Code, from a full-codebase audit (every API route, every lib module, middleware, all pages and components, build verification).
Status at time of audit: typecheck clean, production build green (48 routes), working tree clean.

This is the plan to take the app from "impressive demo" to "final product I would put real customers on." It is ordered by risk: things that lose money or leak access first, things that lose trust second, polish last. Each item says who owns it (Claude Code, Strategy Claude via HANDOFF.md, or Tennyson directly) because a third of the blockers are not code changes.

---

## How to read this

- **Phase 0** items are ship blockers. Do not launch with any of them open.
- **Phase 1** items are trust and correctness issues a customer could hit in week one.
- **Phase 2** is durability: making buyer data survive.
- **Phase 3** is the Nexus map upgrade (the product's centerpiece).
- **Phase 4** is polish and cleanup.
- **Phase 5** is engineering hygiene so the app stays shippable.
- The **Launch runbook** at the end is the go-live checklist for launch day itself.

File references are `path:line` against the current branch.

---

## Phase 0: Ship blockers

### 0.1 The login form gives admin access to anyone who types the admin email

`POST /api/login` (`app/api/login/route.ts:86` plus `lib/session.ts:110`) issues a signed session for any submitted email with no password, no magic link, no verification. If the email matches `ADMIN_EMAIL`, that session is an admin session. Anyone who knows or guesses Tennyson's email owns the admin dashboard, the buyer list logic, and every vendor surface.

Fix (Claude Code):
- Make GitHub OAuth (`app/api/auth/github/*`, which does verify identity) the only path that can mint an admin session.
- The plain email form may remain for buyers only, but it must never return `role: admin`, and ideally should be replaced with a magic-link flow (send a signed one-time link through the same webhook infrastructure used for subscribe) so buyer identity is verified too. Minimum viable: email form mints buyer sessions only, admin comes exclusively through OAuth.

### 0.2 Session security: secret handling and expiry

Two related flaws in `lib/session.ts`:
- If `SESSION_SECRET` is unset, the code falls back to a random per-process key (`lib/session.ts:36-58`). On Vercel, each serverless instance gets a different key, so sessions randomly fail verification depending on which instance answers. Auth appears flaky rather than failing loudly.
- `verifySession` (`lib/session.ts:88-108`) checks the HMAC but never checks token age. A stolen cookie is valid forever; there is no server-side expiry and no revocation short of rotating the secret.

Fix (Claude Code): fail loudly at boot when `SESSION_SECRET` is missing in production, and enforce a max session age from the stored `iat` (30 days to match the cookie).
Fix (Tennyson): set `SESSION_SECRET` in the Vercel dashboard now, before any other work, since rotating it later logs everyone out anyway.

### 0.3 The paid product is free: /setup is not gated

The middleware matcher only covers `/admin/:path*` (`middleware.ts:81`). The actual $49 deliverable, the five-phase setup flow at `/setup/*`, is fully public. It is even advertised to crawlers in the sitemap (`app/sitemap.ts:29`). Anyone can complete the entire onboarding without paying.

Fix (Claude Code): extend the middleware to gate `/setup/*` behind a session, honoring the same `PAID_EMAILS` enforcement used for buyer admin surfaces, and remove `/setup` from the sitemap. Decide with Tennyson whether the setup landing page (`/setup` index) stays public as a teaser while phases lock.

### 0.4 Email capture silently loses subscribers in production

`POST /api/subscribe` writes to `data/subscribers.json` on the local filesystem (`app/api/subscribe/route.ts:124-127`). On Vercel the filesystem is ephemeral and the write failure is swallowed (`:129`). Unless `SUBSCRIBE_WEBHOOK_URL` is configured, every signup shows "Sent" to the visitor and is then lost (it exists only masked in function logs).

Fix (Tennyson): configure `SUBSCRIBE_WEBHOOK_URL` (Zapier, Make, or a simple endpoint into the email tool of choice) in Vercel. This is the fastest durable path and matches the v1.0 "no database" constraint.
Fix (Claude Code): make the endpoint return an error state when neither the webhook nor a durable store accepted the email, so the UI never claims success for a dropped address. Skip the filesystem write entirely when running on Vercel.

### 0.5 The funnel's last step is unverified: Stripe success URL

Nothing in code controls where Stripe sends a buyer after payment; the payment link's success URL is configured in the Stripe dashboard. If it is not set to `/thank-you`, a paying customer finishes checkout and never reaches the product. There is also no signal on `/thank-you` or `/setup` that verifies a purchase happened.

Fix (Tennyson): in the Stripe dashboard, set the payment link confirmation to redirect to `NEXT_PUBLIC_SITE_URL/thank-you`, and confirm `STRIPE_PAYMENT_LINK` is set in Vercel. Note: when `STRIPE_PAYMENT_LINK` is unset, every buy button silently becomes a "Notify me" email capture (`lib/checkout.ts:23`), so an unset var means the site sells nothing without looking broken.
Fix (Tennyson, process): after each sale, add the buyer's email to `PAID_EMAILS` in Vercel so enforcement has teeth. Automating this via Stripe webhook is the v1.1 upgrade; for launch volume, manual is acceptable but must be a written habit (added to the launch checklist tab).

### 0.6 The copy promises support that does not exist

Buyer-visible claims with nothing behind them:
- `content/landing/faq.mdx:8`: "the chat icon up top works. A real human reads it." There is no chat icon anywhere in the app.
- `content/landing/pricing.mdx:14` and `:20`: "Real humans on chat (14-min average)". The stat is fabricated and the channel does not exist.
- `components/landing/Pricing.tsx:72` repeats the chat-support claim in a LearnHint.

This is the kind of claim that generates refunds and chargebacks.

Fix (Strategy Claude via HANDOFF.md): rewrite these three passages to promise the support channel that will actually exist (likely email support with an honest response window). Content files are Strategy Claude's domain; this plan flags them, and the HANDOFF entry should include the exact file list above. The `Pricing.tsx` LearnHint copy is in component code, so Claude Code applies whatever replacement copy Strategy Claude supplies.

---

## Phase 1: Correctness and trust

### 1.1 Buyers see a tab that bounces them

`app/admin/layout.tsx:16` shows buyers a Roster tab, but `/admin/roster` is not in `BUYER_ALLOWED` (`middleware.ts:9-17`), so clicking it silently redirects to Pulse. Either add the route to the allowlist or hide the tab for the buyer role. (Claude Code; needs a one-line product decision from Tennyson on whether Roster is a buyer surface.)

### 1.2 Stale offer copy

`app/thank-you/page.tsx:9` metadata still says "The video is in production", contradicting the current four-artifact offer. `content/landing/outcomes.mdx:2` still carries a "STRATEGY CLAUDE: refine, placeholder copy" marker, and `components/landing/BeforeAfterCompare.tsx:5` has inline placeholder checklists flagged the same way. Route the MDX rewrites through HANDOFF.md; Claude Code fixes the thank-you metadata and applies supplied copy to the component.

### 1.3 Error and loading surfaces

There are zero `error.tsx` or `loading.tsx` files in the app tree. Admin pages that fetch remote data (Nexus GitHub sync, workflows import) have no boundary; a failure surfaces as a hard crash or a hung render. Add a root `error.tsx`, an admin-level `error.tsx` plus `loading.tsx`, and a timeout on the GitHub fetch in `lib/github.ts` (currently none, so a slow GitHub hangs `/api/nexus` and the Nexus page). (Claude Code.)

### 1.4 API hardening round

All small, all worth doing in one pass (Claude Code):
- Add rate limiting to the write endpoints that lack it: `POST /api/nexus/nodes`, `POST /api/blog/publish`, `POST /api/admin/connections/test`, `POST /api/admin/workflows/import`, and the OAuth routes.
- `POST /api/blog/publish` commits the request body verbatim into an `.mdx` file that later renders as executable JSX (MDX injection). Sanitize or restrict to plain Markdown (strip imports/JSX, or render with a plain-markdown pipeline for published posts).
- `POST /api/logout` has no origin check; add the same origin guard used by login.
- Stop echoing sliced GitHub error bodies to callers on the commit endpoints; log server-side instead.
- `GET /api/nexus` is unauthenticated and does outbound work per call; add rate limiting and a short cache.
- On 409 conflicts from the GitHub Contents API (concurrent writers), retry once with a re-fetched sha instead of failing with a 502.

### 1.5 Hermes reads are stale by design

`POST /api/nexus/nodes` writes through the GitHub API, but `GET /api/nexus` reads `content/admin/hermes-nexus.json` from the deployed filesystem (`lib/hermes-store.ts:53-62`), so a just-added node is invisible until the commit triggers a redeploy. Either read the store through the GitHub API with a short cache, or document the eventual consistency explicitly in the API response. (Claude Code.)

### 1.6 Verify Anthropic model IDs

`lib/anthropic-client.ts:14-15` pins `claude-sonnet-4-6` and `claude-opus-4-7`. Before launch, verify against Anthropic's current model list and move to the latest stable IDs (as of this audit, the Claude 5 family and Opus 4.8 are current; `claude-sonnet-5` is the sensible default, with the heavy tier on `claude-opus-4-8`). A wrong ID means every buyer BYOK run fails with a 404. Add a graceful "model not available, check Settings" error path. (Claude Code.)

---

## Phase 2: Durability of buyer data

Everything a buyer does in the workspace (setup progress, checklists, roster, run history, usage counts, BYOK key by design) lives only in `localStorage` (`lib/setup-state.ts`, `checklist-storage.ts`, `roster-storage.ts`, `usage-tracking.ts`, `byok.ts`). Clear the cache or switch devices and the $49 product resets to zero.

For v1.0 final, choose one deliberately:

- **Option A (recommended): minimal server persistence.** Add Vercel KV (or Upstash Redis) keyed by session email for the small JSON blobs that matter: setup phase completion, checklist state, roster. The BYOK key stays browser-only by design. This is a contained change: one storage lib, a thin `/api/workspace` GET/PUT, and swapping the storage adapters. It also fixes the in-memory globe roster and makes rate limiting instance-global (both currently reset per serverless instance, `lib/rate-limit.ts:12`, `app/api/sessions/route.ts:18`).
- **Option B: ship browser-only, but say so.** Add a visible one-line notice on the buyer surfaces ("Progress is saved in this browser") and an export/import button (JSON download/upload). Cheap insurance against the angriest support email.

Tennyson decides A or B; A is roughly a day of work and removes a whole category of complaints, and it unblocks Nexus improvements below.

---

## Phase 3: Nexus map, from picture to instrument

The map's job is to show what you have, how it is integrated, and what is missing. Today status is asserted, not observed, and "missing" lives only in ghost nodes. Full analysis was delivered in-session; the build order:

1. **Interactive connection checks.** Turn each node's `connectionChecks` into persisted checkboxes (server-side once Phase 2 lands; the pattern already exists in `lib/checklist-storage.ts`). Derive `connectionStatus` from checked state instead of the current guess in `lib/nexus-status.ts:13` (where every fork is "partial" and every high-priority ghost is "needs-setup" by definition). The map then reflects what was actually done, and checking a box visibly changes the node's ring.
2. **Wired vs potential links.** Add `status: "wired" | "potential"` to `NexusLink`. Render potential integrations as dashed lines, wired ones solid, and make links clickable with a short card: why these two connect, what wiring them looks like, and a copy-prompt action to do it. Integration debt becomes literally visible as dashed lines between things the user already has.
3. **A ranked "next 3 moves" panel.** Compute leverage from the graph (priority times count of real nodes a gap links to), show the top three with their existing action buttons inline, and highlight reach on the map on hover. Pair with a single integration score (checked checks over total, or wired links over all links) so progress is visible week over week.
4. **Server-synced custom nodes.** The add-a-tool form currently saves to `localStorage` only (`components/admin/NexusAdmin.tsx:17`); point it at the existing `POST /api/nexus/nodes` store so additions sync across devices and appear in `/api/nexus` for Hermes. Add a "connects to" multi-select so added nodes do not float unlinked.
5. **Cheap observed signals.** The GitHub sync already runs; use it to detect README and CLAUDE.md presence per repo (auto-wiring the `readmes` and `claude-md-per` gap nodes), last-push recency (dim dormant repos), and verify `deployed` with a HEAD request to the homepage.
6. **Filter improvements.** "What's missing" should keep one-hop real neighbors visible but dimmed so gaps show in context (`lib/nexus-filter.ts:19`); add a status-based "needs attention" filter; auto-classify synced repos by language/topics instead of dumping all into "apps" (`lib/nexus-merge.ts:42`).

Items 1-3 are the product upgrade; 4-6 round it out. All Claude Code.

---

## Phase 4: Polish and cleanup

### 4.1 Delete dead code

Nine components and six content files are confirmed unreferenced: `LatestWriting.tsx`, `WhatYouGet.tsx`, `WhoItsFor.tsx`, `ThisIsForYou.tsx`, `VideoPlaceholder.tsx`, `Plateau.tsx`, `BeforeAfter.tsx`, `SetupPreview.tsx`, `shared/LazyMount.tsx`; content `what-you-get.mdx`, `who-its-for.mdx`, `this-is-for-you.mdx`, `before-after.mdx`, `plateau.mdx`, `utility-bar.mdx` (the last is created but never read; `UtilityBar.tsx:56-59` hardcodes its strings). Deleting `/content/` files is a Strategy Claude sign-off in HANDOFF.md; the components are Claude Code's call. Keep `setup-preview.mdx`, `community.mdx`, `outcomes.mdx`, `testimonials.mdx`, `faq.mdx` (all live).

### 4.2 Performance touch-ups

- `NexusDashPreview.tsx:5-6` imports the full prompts and decisions JSON into the client bundle for every landing visitor; pass the few needed counts/titles down from a server component instead.
- `OpsPanelGlobe.tsx:257-276` runs a WebGL render loop every frame for the whole session, even under reduced motion and offscreen; pause on IntersectionObserver and render single frames under reduced motion. Same idle fix for `Starfield.tsx:81-96`.

### 4.3 Design-system debt

- The palette tokens still carry old names mapped to new values (`--color-cream` is midnight navy, `--color-terracotta` is amber, `globals.css:33-41`), which will mislead every future session; rename tokens (`--color-bg`, `--color-accent`, `--color-accent-2`) in one mechanical sweep. Update CLAUDE.md's palette table at the same time (it still documents warm cream and terracotta).
- Unify hover accents: header and blog hover amber while newer sections hover cyan; pick one rule (accent for actions, cyan for links, or similar) and apply it.
- Contrast pass: the pervasive 10-11px mono labels in `--color-muted` (#7d8aad on #06101e) are likely below WCAG AA; bump the token or the label sizes.
- Version strings `v1.0.0` are hardcoded in `Footer.tsx:44` and `UtilityBar.tsx:58`; derive from one constant or drop them.

### 4.4 Small SEO and metadata fixes

- `app/sitemap.ts:9-14`: the build-stamp helper returns `new Date()` on both branches, defeating its own purpose; stamp from the deploy SHA time or a fixed date per content change.
- `app/robots.ts:18-20` uses regex anchors only Googlebot understands; use plain path rules.
- Remove `/setup` from the sitemap once gated (Phase 0.3).
- Admin-only leftovers: `app/admin/page.tsx:306` renders "Live tracking: TODO" and `app/admin/plan/page.tsx:32` has a TODO fallback; finish or remove.

---

## Phase 5: Engineering hygiene

The repo has no CI and no tests. For a product taking money, the floor is:

1. **CI (GitHub Actions):** on every PR run typecheck, `next build`, `next lint`, and `npm run voice-check --strict` scoped to changed content. Roughly an hour of work, permanent safety net.
2. **Tests where the money and access are:** unit tests for `lib/session.ts` (signing, tampering, expiry once added), `safeAdminNext`, `lib/paid.ts`, rate limiting, and the input validation on `POST /api/nexus/nodes` and `POST /api/subscribe`. A handful of integration tests for middleware role routing (anon, buyer, unpaid buyer, admin against `/admin/*` and `/setup/*`). Vitest keeps this light; no browser suite needed for v1.0.
3. **Update CLAUDE.md.** It still describes the v0 file structure (admin login page and ADMIN_PASSWORD, both gone), the old palette, five admin tabs (there are fourteen surfaces), and none of the newer env vars. Every future session inherits that confusion. Rewrite the structure, palette, auth notes, and env var list; add `NEXT_PUBLIC_BUILD_ID` to `.env.example` while at it.
4. **Document the runtime truthfully:** a short `docs/architecture.md` covering what persists where (GitHub-backed stores, localStorage, in-memory), since that split is now the app's most surprising property.

---

## Launch runbook (day of ship)

Vercel env vars, verified present: `SESSION_SECRET`, `ADMIN_EMAIL`, `STRIPE_PAYMENT_LINK`, `NEXT_PUBLIC_SITE_URL`, `PAID_EMAILS` (with enforcement decision made), `SUBSCRIBE_WEBHOOK_URL` plus token, `GITHUB_USERNAME`, `GITHUB_TOKEN`, `GITHUB_OAUTH_CLIENT_ID/SECRET`, `GITHUB_BLOG_TOKEN` and blog repo vars, `HERMES_API_KEY`, `BLOG_PUBLISH_SECRET`.

Stripe: payment link live-mode, success URL points to `/thank-you`, price $49, receipt email on.

Smoke test on production, in order: landing renders with no console errors; buy button reaches Stripe checkout; test purchase in live mode redirects to `/thank-you`; add the test email to `PAID_EMAILS`; log in as that buyer, confirm Pulse loads and vendor tabs are hidden; `/setup` blocked when logged out and open for the paid email; email capture delivers to the webhook destination; admin login works only through OAuth; `/api/nexus` responds; blog renders; 404 page renders.

Rollback: production deploys are per-commit on Vercel; keep the previous deployment pinned for instant rollback, and treat `main` as protected (all work through PRs once CI exists).

---

## Suggested sequencing

- **Week 1:** Phase 0 complete (0.1-0.5 code and config, 0.6 handed to Strategy Claude), plus 1.1, 1.2, 1.6. This alone makes the product safe to sell.
- **Week 2:** Phase 1 remainder, Phase 2 decision and implementation, CI from Phase 5.
- **Week 3:** Phase 3 (Nexus upgrade) and Phase 4 polish, tests from Phase 5, CLAUDE.md rewrite, launch runbook.

Total: roughly three focused weeks to a product that is honest, gated, durable, and maintainable, with the Nexus map upgraded from a beautiful picture to the instrument the product is named for.
