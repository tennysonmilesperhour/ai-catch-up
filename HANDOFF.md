# Handoff

This file is how Tennyson passes instructions from Strategy Claude (claude.ai web app) to Claude Code (this repo).

## How to use this file

1. Tennyson pastes instructions from Strategy Claude at the top of this file.
2. At the start of every session, Claude Code reads this file.
3. If there are pending instructions, Claude Code executes them, then deletes the processed instructions from this file and leaves a short note in the "Completed handoffs" section below.

## Pending instructions

_(None. Paste new instructions from Strategy Claude above this line.)_

## Completed handoffs

### 2026-04-28 - Aurora Command landing reskin

Full structural reskin of the public landing page (`/`) to the operations-console aesthetic. Five chunked commits, each verified with `npx tsc --noEmit` + `npm run build` (28 routes still emitting).

**CSS additions (chunk 1).** Appended ~30 new classes to `app/globals.css` for the Aurora layout: `.utility-bar`, `.hero-eyebrow` / `.hero-grid`, `.ops-panel*` / `.globe-wrap` / `.stat-strip`, `.dash*` / `.rail-card` / `.month-strip` / `.chart` / `.anomaly` / `.loc*`, `.phases-grid` / `.phase-card`, `.outcomes` / `.outcome` / `.glyph.{cyan,violet,pink,amber}`, `.compare*` / `.compare-list`, `.prompts` / `.prompt-row` / `.prompt-body{.cm,.kw,.var,.str}` / `.prompt-meta`, `.testis` / `.testi` / `.testi .avatar`, `.pricing` / `.price-card` / `.features` / `.price-aside` / `.aside-row`, `.faqs` / `.faq` (uses existing `.chev`), `.capture` / `.capture-card`, `.foot-grid` / `.foot-col` / `.foot-bot`, `.final`, `.num-tab`. All compose on existing `.glass-card` / `.glass-card-static` surfaces and respect `prefers-reduced-motion`.

**Content (chunk 1).** Replaced `hero.mdx` and `final-cta.mdx` with the Aurora copy. Created `pricing.mdx` and `utility-bar.mdx`. Scaffolded `outcomes.mdx`, `testimonials.mdx`, `faq.mdx` with placeholder copy explicitly marked `# STRATEGY CLAUDE: refine` since the prototype copy wasn't included in the handoff (per the option-C path Tennyson approved). Authoritative price stays at `$49`; `$249` from the prototype is not in the repo.

**New components.**
- `UtilityBar.tsx` (chunk 2). Sticky 28px strip above SiteHeader with cyan dot, mono-caps system status labels, and a live UTC clock (1s setInterval, tabular numerals).
- `EmailCapture.tsx` (chunk 2). Centered glass-card with gradient sub-headline; reuses the existing `EmailCaptureForm` with `Sent ✓` success message and dark tone.
- `OpsPanelGlobe.tsx` (chunk 2). Pure-SVG globe with 4 latitude / 3 longitude ellipses, 140 deterministic surface dots (seeded RNG so client/server hydration matches), an outer cyan ring, a dashed magenta orbit rotating 40s linear via `<animateTransform>`, and three location pings on staggered 2.4s pulses. Below the SVG, a 3-cell stat strip. No JS animation; SVG-native, runs pre-hydration.
- `NexusDashPreview.tsx` (chunk 3). Full-width "live console" section: `dash-tabbar` pills + ⌘K search chip, 3-column grid (left rail of 5 phase rail-cards + 3 workspace rail-cards, center month strip + 5-stream waveform chart, right anomaly stat block + 4 location sync stamps with hardcoded `2026-04-27` timestamps per the DESIGN.md note). The chart inlines `genPath` + a single RAF that recomputes 5 wave paths and a probe sweep every frame from `performance.now() / 1000`. Wrapped in `useEffect` with cleanup; gated by `matchMedia('(prefers-reduced-motion: reduce)')` which renders one fixed-`t=0` snapshot. IntersectionObserver pauses the RAF when the section is offscreen and restarts when it returns. Mobile reduces samples from 240 to 100. Probe label recomputes every frame to suggest live telemetry.
- `PhasesGrid.tsx` (chunk 3). 5-card responsive grid (1/2/3/5 cols) reading the existing `setup-preview.mdx` `phases` array. Each card is a `.glass-card .phase-card` with a `PHASE · 0N` mono label, title, description, and a Duration footer row separated by a hairline cyan border. Reveal stagger 0/80/160/240/320.
- `OutcomesGrid.tsx` (chunk 3). 4-card grid reading `outcomes.mdx` (placeholder), each with a 2-letter glyph badge in cosmic-tinted background (MD cyan, NX violet, PL magenta, NM amber).
- `BeforeAfterCompare.tsx` (chunk 4). Two `glass-card-static .compare-card` panels side-by-side with ✕/✓ markers and 5-item checklists. Inline placeholder copy lives in the component since the existing `before-after.mdx` schema (chat scenarios) doesn't fit the new compare-list shape; marked for Strategy Claude refinement.
- `PromptLibraryExplorer.tsx` (chunk 4). `'use client'` two-column glass-card. Reads the first 8 entries from `/content/admin/prompts.json` (same source as the admin tab). Inline regex-based syntax highlighter applies four classes (`.cm` / `.kw` / `.var` / `.str`) by escaping HTML before `dangerouslySetInnerHTML`. Copy button writes to clipboard with a 2s "Copied" confirmation. The 4-cell stat row reads optional `variables` / `avg_tokens` / `used_by_pct` / `updated_at` fields, falling back to a regular hyphen `"-"` when absent.
- `TestimonialsRow.tsx` (chunk 4). 3 quote cards reading `testimonials.mdx` (placeholder). Editorial serif body, mono caps name/role, gradient amber→magenta avatar circle.
- `FAQ.tsx` (chunk 4). 7 `<details>` accordions reading `faq.mdx` (placeholder). First item open via `item.open` frontmatter flag. The existing `.chev` rotates via `.faq[open] summary .chev` rule.

**Existing component touch-ups.**
- `Hero.tsx` (chunk 2). Switched to a 2-column grid on `md+` (text left, `<OpsPanelGlobe />` right). Mobile single-column with the globe stacked. New hero-eyebrow chip (cyan border, cyan dot, mono caps). New CTA pair below the body: `MagneticButton` "Begin onboarding" + a mono `$49 one-time, lifetime access` line. Section gets `id="overview"`.
- `Pricing.tsx` (chunk 5). Switched from inline strings to `pricing.mdx`. 2-column on `md+`: a `glass-card .price-card` with the large amount, ✓-marked feature list, full-width MagneticButton CTA; and a `glass-card-static .price-aside` 6-row k/v reassurance panel with the `¤` glyph. Section gets `id="pricing"`.
- `FinalCTA.tsx` (chunk 5). Wrapped in `.final` so it can pick up future final-stage CSS. Copy already lands via `final-cta.mdx`; line 2 already has `headline-gradient`.
- `SiteHeader.tsx` (chunk 5). Added a 6-tab nav row (`Overview / The flow / Nexus / Prompts / Pricing / FAQ`) between the wordmark and the right-side actions. Tabs are anchor links to in-page section ids (`#overview`, `#flow`, `#nexus`, `#prompts`, `#pricing`, `#faq`). Active tab determined by a single `IntersectionObserver` across the section ids; active gets the amber underline + `cosmic-glow-soft`. Right-side actions gain a `⌘K` search button (visual only) and the `Get access` CTA links to `#pricing`. Auto-hide-on-scroll behavior preserved. Sticky positioning shifts to `top-[28px]` so the new `UtilityBar` sits above it.
- `app/page.tsx` (chunk 5). New section order: `UtilityBar` → `SiteHeader` → `Hero` → `NexusDashPreview` → `PhasesGrid` → `OutcomesGrid` → `BeforeAfterCompare` → `PromptLibraryExplorer` → `TestimonialsRow` → `Pricing` → `FAQ` → `EmailCapture` → `FinalCTA` → `Footer`. The retired components (`LatestWriting`, `WhatYouGet`, `WhoItsFor`, `ThisIsForYou`, `VideoPlaceholder`, `Plateau`, `BeforeAfter`, `SetupPreview`) are left in the codebase (kept for `/preview` and future blog reuse).

**Verification.** `npx tsc --noEmit` clean; `npm run build` green (28 routes); no em dashes in any landing component or `/content/landing/*.mdx`; no `$249` anywhere; `$49` in three expected places (Hero subhead, `pricing.mdx`, `final-cta.mdx` footnote); Stripe link still wired through `STRIPE_PAYMENT_LINK` on every CTA.

**Phase B (deferred).** Strategy Claude needs to supply real copy for `outcomes.mdx`, `testimonials.mdx`, `faq.mdx`, and the 5-item before/after checklists currently inline in `BeforeAfterCompare.tsx`. Optional: deliver the `aurora-command.css` source so the CSS can be ported literally rather than authored from descriptions, and decide whether to extend `before-after.mdx` schema for compare-list data.

**Fidelity follow-up (same session).** Tennyson sent five reference screenshots from the prototype; ran four small fidelity chunks to align the implementation more closely with the visual target.

- *Chunk A* (`804e4c1`). Hero headline switched from 3 lines to 5 with the `headline-gradient` on the last 2 lines (`workspace that` / `already works.`). `hero.mdx` schema gained `headline_line_4` + `headline_line_5`. CTA row reads "Begin onboarding →" + "$49 / one-time · lifetime access" with the price in display serif. New 3-cell `hero-stats` strip (Active builds 1,284 ↑12% / Hours saved 9k /mo / Anomalies 34 active) lives below the CTA; `OpsPanelGlobe` no longer carries it. Header tabs are now `tab-pill` cyan-bordered pills (active gets the cyan glow). Shared `SectionEyebrow` component added (`components/shared/SectionEyebrow.tsx`).
- *Chunk B* (`f6c89fe`). `SectionEyebrow` + `section-subhead` rolled through every section so the page reads with one consistent eyebrow style: cyan-bordered pill (`● TEXT`) on the left, mono-caps right-aligned 2-3 line subhead on the right. Compare-card borders tinted (magenta for "before", cyan for "after"); ✕/✓ markers inherit those colors. Outcome card borders tinted per glyph color (`tint-cyan` / `tint-violet` / `tint-pink` / `tint-amber`). Phase card duration row uses a dashed cyan hairline + cyan duration value. Headline-gradient spans dropped the `italic` class everywhere — the prototype shows them upright.
- *Chunk C* (`bb812fb`). `PromptLibraryExplorer` rebuilt: "LIBRARY · n · CURATED" cyan header row above the list, each prompt row is a 3-col grid (P0n badge, display-serif title + tone subtitle, "n vars" cyan pill), active row gets a 3px cyan inset bar + violet glow. Syntax highlighter palette swapped to match the prototype: comments → muted, headers `##` → violet, variables `[PLACEHOLDER]` and `{{template}}` → cyan, "quoted strings" → organic green. Copy button is now a cyan pill (`copy-pill`). `NexusDashPreview`: anomaly panel rebuilt as a 4-row telemetry block with the ↗ link icon (Service availability 29.3% / P95 utilization 43.5 MHz / Overload [24h] 41 min / Active alerts ● 34); location list redesigned as 3-line stacks (display-serif city / mono-caps "LAST SYNC" / tabular timestamp).
- *Chunk D* (`ca1454e`). `NexusChart` overlays 4 decorative stream labels (ST-983, VYG1, ST-156, ST-204) anchored to each underlying wave at a fixed t=0 sample point. `OpsPanelGlobe` pings now render their labels inline (SF · 2.1k cyan, NYC · 3.8k magenta, LDN · 1.4k violet) with side auto-determined to keep text off the sphere. Phase rail-cards in `NexusDashPreview` rebuilt as 2-row layouts with magenta numeric badges (5 / 4 / 12 / 4) and a magenta dot on the active first row; workspace rail-cards reuse the structure with 2-letter glyph codes (MD / NX / PL). Active rail-card switched from amber to cyan to match selection treatment elsewhere. `Footer` rebuilt around `foot-grid` / `foot-col` / `foot-bot`: dropped the embedded `EmailCaptureForm` (now its own `EmailCapture` section above) and the dark fullbleed background; renders on the cosmic page bg with 4 lean columns + a thin foot-bot row.

**Total commits on this branch since fork:** 9 (handoff landing → 5 reskin chunks → 4 fidelity chunks). PR #3 still draft for Tennyson's review.

### 2026-04-27 - Login two-pane restyle + admin sidebar shell

Companion to the polish pass. Visual + structural redesign of two surfaces, no auth/middleware logic changes, no `/content/` edits.

- `app/login/page.tsx` rewritten as a two-pane layout. Left pane is editorial (hidden < md): brand label, blockquote in `headline-gradient`, footer line, with the `Starfield` and `orbit-stack` decorations layered behind. Right pane is the form, same `POST /api/login` action, same `email` + `next` fields, same `?error=email` / `?error=server` contract. Submit button promoted to `glass-button-primary` with rounded corners.
- New `components/admin/AdminSidebar.tsx` (md+): persistent left rail with the wordmark up top, the six tabs (Plan / Schedule / Nexus / Prompts / Decisions / Launch Checklist) as vertical pills, an amber active indicator bar with `cosmic-glow-soft`, and View-site + Log-out actions footer-pinned. Background `rgba(2,6,14,0.65)` with `backdrop-blur-md` reads as a workspace shell, not a marketing nav.
- New `components/admin/AdminMobileNav.tsx` (< md): preserves the prior compact top-bar + horizontal `TabNav` strip so narrow screens don't lose navigation.
- `app/admin/layout.tsx` replaced: `flex md:flex-row` shell with `<AdminSidebar>` then `<AdminMobileNav>` + main, content `max-w-5xl` (down from `max-w-7xl` since the sidebar reclaims ~240px).

Verified: `npx tsc --noEmit` clean, `npm run build` green; `/login` shows two columns desktop / single column mobile, posts to `/api/login`; `/admin/*` pages render inside the new sidebar shell with the active-tab amber accent and working logout.

### 2026-04-27 - Landing polish pass (motion + magnetic CTA + starfield)

Visual + motion polish on the public landing only. No `/content/` edits, no copy changes, no admin/login changes.

Motion primitives appended to `app/globals.css`:

- `[data-reveal]` / `[data-revealed]` — opacity + translate scroll-reveal pair, paired with `Reveal.tsx`.
- `.magnetic` / `.magnetic-inner` — CSS shell for the magnetic-pull-on-hover button effect, plus an amber/magenta hover halo.
- `.hotwire` — vertical gradient pulse animation for the SetupPreview connector line.
- `.headline-gradient` — amber → orange → magenta text gradient.
- `.orbit-stack` / `.orbit` — concentric ring decoration behind the Hero (4 rings at 520 / 820 / 1180 / 1620px).
- `.site-header` / `.site-header-hidden` — auto-hide-on-scroll helper.
- All motion respects `prefers-reduced-motion`.

New shared components:

- `components/shared/Reveal.tsx` — one-shot IntersectionObserver wrapper with a polymorphic `as` prop. Implemented via `React.createElement` because React 19 / Next 15 don't expose the global `JSX` namespace without explicit import; this avoids the namespace and keeps the polymorphic API.
- `components/shared/MagneticButton.tsx` — wraps a Next `Link` with a span that pulls toward the cursor on hover (default 14px @ 80px range).
- `components/landing/Starfield.tsx` — DPR-aware parallax canvas, 4-color stars (white / amber / violet / cyan), density-driven, RAF-animated, cleans up on unmount.

Replaced landing components:

- `Hero.tsx` — starfield + orbit stack behind the headline, gradient on the third headline line, `Reveal` on each block.
- `SetupPreview.tsx` — hot-wire pulse running through the timeline, `cosmic-glow-soft` on each step pip, `Reveal` on every step.
- `FinalCTA.tsx` — gradient on the second headline line, button wrapped in `MagneticButton`, `Reveal` on every block.
- `SiteHeader.tsx` — auto-hide on scroll-down past 80px, return on scroll-up.

Verified: typecheck clean, `npm run build` green (all routes still emit), spot-checks pass.

### 2026-04-24 - Nexus auto-sync (GitHub + local tool adds)

Direct request: "I want the nexus to auto update every time I add a new repo to github. I also want it to be able to autoupdate essentially any time I download or integrate a new tool - within the scope of possibility and relevance."

**GitHub auto-sync (real auto-update):**

- `lib/github.ts` fetches public repos from `https://api.github.com/users/{GITHUB_USERNAME}/repos` at request time. Respects optional `GITHUB_TOKEN` for higher rate limits / private repos. Uses Next.js `fetch` cache with a 15-minute revalidate, so new repos show up within the cache window.
- `lib/nexus-merge.ts` merges live GitHub data with the curated `nexus-data.ts`:
  - Curated nodes with a matching `github` field keep all their copy; only `homepage` and `deployed` get refreshed from the live data.
  - Unknown repos (not yet in the content file) get auto-added as `real` (or `fork` if the repo is a fork) in the `apps` domain, weight 3, desc = GitHub description, and are auto-linked to `global-memory` with strength 0.25 so they join the orbit rather than float alone.
- Auto-added nodes carry a `synced: true` flag. Visually they get a thin dashed cream-colored ring; in the hover tooltip their kind tag reads `auto-synced`.
- The Nexus page header now shows `GitHub synced, N auto-added` or `GitHub sync off (reason)` so the state is legible.
- New env vars: `GITHUB_USERNAME` (required for sync), `GITHUB_TOKEN` (optional). Added to `.env.example`.

**Tool auto-sync (semi-automatic):**

- Auto-detecting local tool installs (Cursor, 1Password, Raycast, etc.) isn't possible from a web app without an agent on Tennyson's machine. Intentional v1.0 decision: offer a low-friction quick-add form instead.
- New `NexusAdmin` client wrapper (`components/admin/NexusAdmin.tsx`) renders an "Add a tool or node" button above the graph. The form takes a name, domain, description, and kind ("Already using" / "Planning to" / "Fork / adjacent"). Adds persist to `localStorage` under `nexus-custom-nodes-v1` and merge into the graph immediately with no reload.
- A "Manage local additions" disclosure lets you remove any entry you added.
- Cross-device sync is out of scope for v1.0. The UI labels this honestly ("Saved in this browser only. Cross-device sync lands in v1.1.") so Tennyson isn't surprised when a tool added on his laptop doesn't appear on his Mac mini.

**New env var Tennyson needs to set on Vercel:** `GITHUB_USERNAME=tennysonmilesperhour`. Without it, the Nexus falls back to the curated data only (no sync), still works.

Verified: typecheck clean; `npm run build` green (18 routes); Nexus page renders with "GitHub sync off" banner when the var is missing and the add-tool form is visible.

### 2026-04-24 - Full security / bug / UX audit (autonomous)

Direct request from Tennyson: full audit, fix everything, use best judgment on trade-offs, report when done. Changes in one batch:

**Security**

- `SESSION_SECRET` fallback was a hardcoded string in `lib/session.ts`. Anyone with GitHub access could forge an admin cookie. Replaced with a per-process random (32 bytes via `crypto.getRandomValues`). If the env var is still missing, sessions stop being stable across serverless invocations, which is a useful pressure signal to fix the config, but the source code no longer leaks a valid secret.
- `/api/login` `next` param now rejects external origins and protocol-relative URLs (`//evil.com`) via a `safeAdminNext` helper. Only same-origin paths under `/admin` are honored.
- Added security response headers via `next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-DNS-Prefetch-Control: on`. Also disabled `X-Powered-By`.

**Bugs / cleanup**

- `BeforeAfter` was styling the "with" panel by hardcoded `i === 1`. Replaced with an explicit `mode: "with" | "without"` field on each scenario, so reordering can't break the styling.
- `/api/version` had both `dynamic = "force-dynamic"` and `revalidate = 0`. Kept only `force-dynamic`.
- Added `Viewport` export to root layout so mobile browsers don't zoom out. `themeColor` matches the cream background.

**UX / site coverage**

- `SiteHeader` (wordmark + Log in) now renders on `/thank-you` and `/preview` in addition to the landing page. One consistent way to find login.
- Admin tab nav now scrolls horizontally on narrow screens instead of wrapping. Tabs get `whitespace-nowrap`.
- Added custom `/not-found.tsx` with the site's editorial style. Previously Next's default 404.
- Added visible focus ring (terracotta, 2px, 2px offset) via `:focus-visible` in `globals.css` for keyboard users.

**SEO**

- Added `app/sitemap.ts` (landing, thank-you, login) and `app/robots.ts` that disallows `/admin`, `/api`, and `/preview`. Sitemap URL is pinned to `NEXT_PUBLIC_SITE_URL`.

**Verified:** typecheck clean; `npm run build` green (18 routes including `/robots.txt` and `/sitemap.xml`); security headers show up in `curl -I`; sitemap and robots render correctly; 404 page renders with site aesthetic; BeforeAfter scenarios still display correctly with the new `mode` field.

### 2026-04-24 - Minimum-viable accounts + refresh banner

Per Tennyson's direct request. Flagged the conflict with the freshly-locked v1.1 scope decision; Tennyson chose the scoped middle-path option.

**Unified login + roles.**

- `ADMIN_PASSWORD`-based `/admin/login` replaced with a single email-only `/login`.
- New `ADMIN_EMAIL` env var: exact match (case-insensitive) issues an admin session. Any other email issues a user session.
- Sessions use HMAC-SHA256 signed cookies (`ac_session`, 30 days, httpOnly, SameSite=lax). Implemented with Web Crypto so it runs in the Edge middleware.
- New `SESSION_SECRET` env var (min 16 chars). Changing it invalidates every session.
- Middleware guards `/admin/*`: no session → `/login?next=...`; user role → `/preview`; admin role → allow. Back-compat `admin_auth` cookies are ignored.
- New files: `/lib/session.ts`, `/app/login/page.tsx`, `/app/api/login/route.ts`, `/app/api/logout/route.ts`, `/app/preview/page.tsx`. Removed: `/app/admin/login/page.tsx`, `/app/api/admin/login/route.ts`.
- Admin header gained a Log out button next to View site.

**/preview page** for non-admin users: shows the six admin tab titles with one-sentence blurbs, a "Locked" tag on each, a big "Unlock the onboarding" CTA pointing at the Stripe link, and Log out + Back to landing footer links.

**Refresh banner.**

- `/api/version` returns `{buildId}`, populated from `VERCEL_GIT_COMMIT_SHA` in production (unique per deploy) or a per-process `dev-<timestamp>` in dev.
- `RefreshBanner` (mounted in root layout) records the first fetched build id, polls every 60s, and shows a pinned bottom-right dark card with a Refresh button when the id changes.

**Env vars Tennyson needs to add on Vercel** before this stops 500-ing on admin: `ADMIN_EMAIL` (his email) and `SESSION_SECRET` (any 32-char random string). `ADMIN_PASSWORD` is no longer read.

Verified: typecheck clean; `npm run build` green (16 routes); full end-to-end test (unauth → login → admin role → nexus, unauth → login → user role → preview, logout → back to login).

### 2026-04-24 - Launch Checklist (admin) + v1.1/v1.2 previews

**Section 1: Admin Launch Checklist tab.**

- New data file `/content/admin/launch-checklist.ts` with three phases (Infrastructure, Content, Launch Readiness) and 24 total items, each with optional action buttons.
- New storage utility `/lib/checklist-storage.ts` persists per-item status and notes to `localStorage` under the versioned key `launch-checklist-state-v1`.
- New tab at `/admin/checklist` (sixth tab, after Decisions). `LaunchChecklist.tsx` renders the three phases with: a top progress bar (done / total, percent), a per-phase progress count, per-item status dropdown (not-started / in-progress / done), description, action buttons, and an optional collapsible note field. Completed items get line-through and reduced opacity. Reset button at the bottom clears localStorage after a confirm prompt.
- Action button pattern extracted into shared `/components/shared/ActionButton.tsx` and `/components/shared/StepsModal.tsx` so both Nexus and LaunchChecklist use the same implementation. Nexus.tsx now imports these instead of keeping inline copies.

**Section 2: Landing page previews for v1.1 and v1.2.**

- New section `Setup Flow Preview` sits between What You Get and Who This Is For. Five numbered phase cards (Capture your idea, Set up accounts, Install the starter package, Configure Claude, Receive your outputs) with time estimates in monospace. Copy consistently frames this as "what happens after you buy" so it previews v1.1 without promising a date.
- Two new items in What You Get previewing the v1.2 dynamic checklist: Layer 2 gains "An ongoing personalized checklist that updates as your project grows"; Layer 3 gains "Future-proofing: your setup continues to adapt as you build". No new section created, so the page length stays calm.

**Section 3: Locked Decisions.**

- Appended four decisions to `/content/admin/decisions.json`: v1.0 ships admin-facing checklist only; v1.1 is the user setup flow; v1.2 is the dynamic checklist; landing page previews v1.1 and v1.2 without dates.

**Scope respected.** No user setup flow or dynamic checklist built as functional features; those remain v1.1 and v1.2. Landing previews are static copy + design only.

### 2026-04-24 - Landing upgrades + Nexus tooltip action buttons

**Section 1: Landing page.**

- `what-you-get.mdx` rewritten as three layers (what you install / what Claude learns / what you learn); `WhatYouGet.tsx` renders them as three equally-weighted cards.
- New `before-after.mdx` + `BeforeAfter.tsx`: side-by-side panels showing a user prompt, Claude response, and outcome for "without this system" vs "with this system". Styled distinctly (muted grays vs warm terracotta).
- New `this-is-for-you.mdx` + `ThisIsForYou.tsx`: prominent positive list plus a muted "and this is not for you if..." counterpoint below.
- One-line positioning statement appended to `who-its-for.mdx` (hiding vs teaching).
- Landing page section order is now: Hero → Video → Pricing → Plateau → Before/After → What You Get → Who It's For → This Is For You → Final CTA → Footer.

**Section 2: Nexus tooltip action buttons.**

- `NexusNode` in `/content/admin/nexus-data.ts` gained an optional `actions` field (`NodeAction[]`). `ActionKind` is `copy-prompt | open-url | copy-commands | view-steps`.
- Populated actions for 10 key nodes (cursor, 1password, claude-sync, env-sync, claude-projects, this-product, readmes, claude-md-per, context-md, decisions-md).
- Hover tooltip now renders action buttons below the description, separated by a faint border in the domain color. `pointerEvents` is `"auto"` when a node has actions so the buttons are clickable.
- `copy-prompt` / `copy-commands` write to clipboard with a 2-second "Copied" confirmation.
- `open-url` opens in a new tab with `noopener,noreferrer`.
- `view-steps` opens a full-screen modal with markdown content rendered via `react-markdown` (installed). The tooltip closes when the modal opens. Pressing Escape or clicking the backdrop closes the modal.
- Nodes without actions render the tooltip unchanged (just the description, no button section, no visual glitch).

Scope boundary respected: no API automation, no direct Claude Code integration. Clipboard prompts are the manual-but-reliable bridge for v1.0.

Verified: typecheck clean; `npm run build` green (14 pages, Nexus bundle 39kB after react-markdown addition); public landing page unaffected.

### 2026-04-24 - Nexus tooltips

Added an HTML overlay tooltip to the Nexus component that shows on hover. Anchored to the existing `position: relative` SVG container, top-right corner, max-width 320px, glassy dark background with a left accent bar in the domain color. Shows: domain label, kind tag ("original" / "fork" / "high priority gap" / "gap"), node label in monospace, description, and a "click to open" hint when `github` or `homepage` is set. Renders only when a node is hovered and no modal is open (`hovered && !selected`). Implementation uses a derived `hoveredNode` from the existing `hoveredId` state, so the dimming/highlight logic stays untouched. The component's `NexusNode` type gained optional `deployed`, `github`, `homepage` fields to match the richer schema in `/content/admin/nexus-data.ts`.

Touch: existing `onPointerEnter` / `onPointerUp` handlers already work on touch; tapping a node will briefly flash the tooltip and then open the modal, which matches the spec.

### 2026-04-24 - Complete Nexus data (36 nodes)

Replaced `/content/admin/nexus-data.ts` with the full 36-node ecosystem map: every real repo, every fork, identified gaps, must-have tools, documentation needs, and the new Onboarding Product. Schema gained optional `deployed`, `github`, `homepage` per node, a `note` field on Domain, and Priority widened to `"high" | "medium" | "low"`.

Component upgrades to match:

- viewBox switched to centered coords `-700 -500 1400 1000` so the 9 fanned-out domains breathe.
- Force constants tuned: link target 130, repulsion 800.
- Filter bar above the canvas with four modes: Everything, What I have, What's missing, Sync and tools only. Hidden nodes drop their links automatically.
- Stats bar below the canvas: total / real / ghost / fork counts, high-priority gap count, plus the standard help line ("Click any node for details. Hover a node to see what it connects to. Drag nodes to rearrange.").
- Hover-highlighted links use the terracotta accent at 1.8 stroke width.
- High-priority ghost nodes still get a filled center dot (already present).

Verified: typecheck clean, `/admin/nexus` HTTP 200 with all kinds of nodes present, and the public landing page (`/`) is unchanged.

### 2026-04-24 - Nexus data

Created `/content/admin/nexus-data.ts` (new location under `/content/`) with Strategy Claude's exact 18 nodes, 16 links, and 6 domains for the current state of Tennyson's ecosystem. Nodes now use a richer schema: `kind` ("real" | "ghost" | "fork"), `weight`, `desc`, optional `priority`. Domains are a keyed object with absolute anchor offsets.

`components/admin/Nexus.tsx` rewritten to match:

- Accepts `kind: "real" | "ghost" | "fork"`; fork renders as a semi-transparent filled circle with a thin outer ring.
- Node radius now scales with `weight` (6 + weight * 1.5).
- Domain anchors are absolute offsets from the viewBox center, matching the layout Strategy Claude specified.
- Legend now includes the Fork marker.
- Detail modal reads `desc` and shows a kind-specific label.

Old sample data file `components/admin/nexus-data.ts` removed. The nexus page boundary casts `NEXUS_NODES` to the strict `NexusNode[]` type to keep the content file as plain JS declarations.

### 2026-04-24 - v1.0 prompts library

Replaced `/content/admin/prompts.json` with the full 20-prompt library from Strategy Claude, spanning seven categories: Getting Unstuck, Project Setup, Building, Prompting Claude, Research & Learning, Marketing & Sales, Business Operations, Brand & Design, When Things Feel Hard.

Schema: each entry has `id` (number), `category`, `title`, `prompt`, `whyItWorks`. The `PromptsList` component was updated to render the full prompt in a highlighted box plus an italic "Why it works" note underneath. Expanded state is stable across numeric or string ids.

Verified: dev server renders all 20 prompt cards with categories and titles; typecheck clean.

### 2026-04-24 - v1.0 initial content

Replaced the following content files per Strategy Claude's instructions:

- `/content/landing/plateau.mdx` - Pattern eyebrow, "You're probably on the Plateau right now" headline, four-paragraph story.
- `/content/landing/what-you-get.mdx` - "A working AI setup in 60 minutes" with six numbered items (video, setup flow, starter repo, prompt library, Nexus map, monthly distillation).
- `/content/landing/who-its-for.mdx` - "You became the AI person by default" plus three paragraphs.
- `/content/landing/final-cta.mdx` - Two-line headline ("Whatever you do, / don't fizzle."), subhead, button text, footnote.
- `/content/admin/plan.mdx` - Six-section "V1 in one page" (Who this is for, Positioning, Price, What the buyer gets, Timeline, The Five Phases).
- `/content/admin/decisions.json` - Ten locked decisions with rationale.
- `/content/admin/schedule.json` - Four weeks (Foundation, Build Core, Launch, Iterate) with owner and status per item.
- `/content/admin/prompts.json` - Empty array for now; prompt content coming in a follow-up handoff.

Schema notes for Tennyson / Strategy Claude:

- `WhatYouGet` items now use fields `number`, `title`, `text` (was `title`, `body`).
- `FinalCTA` now uses `headline_line_1`, `headline_line_2`, `subhead`, `button_text`, `footnote`.
- Plan sections moved from MDX body (`##` headings) into frontmatter (`sections: [{title, content}]`).
- `decisions.json` and `schedule.json` are now top-level arrays (not wrapped in an object).
- Schedule status values are `"not-started"`, `"in-progress"`, `"done"`, `"blocked"`.
- `prompts.json` accepts either a raw array `[...]` or `{categories, prompts}`.

Components updated to match all six schema changes. Dev server verified, all pages render.
