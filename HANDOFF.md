# Handoff

This file is how Tennyson passes instructions from Strategy Claude (claude.ai web app) to Claude Code (this repo).

## How to use this file

1. Tennyson pastes instructions from Strategy Claude at the top of this file.
2. At the start of every session, Claude Code reads this file.
3. If there are pending instructions, Claude Code executes them, then deletes the processed instructions from this file and leaves a short note in the "Completed handoffs" section below.

## Pending instructions

### Aurora Command landing reskin

> Paste this entire block into `HANDOFF.md` directly under the `## Pending instructions` heading (replacing the "_(None...)_" line). Claude Code will execute it on the next session, then move it to "Completed handoffs" with a one-line summary per the protocol in CLAUDE.md.

---

## Scope

Full reskin of the public landing page (`/`) to match the Aurora Command direction. The repo is already converging on the cosmic palette and motion primitives that this direction extends, so this is an additive polish pass and a few new sections — not a re-architecture. **No admin / login / middleware / auth changes. No tech-stack changes.**

The site moves from a single-column editorial scroll to a denser, "operations console" feel: utility status bar, persistent nav with tabs, a hero with a live-globe ops panel on the right, a Nexus dashboard preview with animated waveform chart, a 5-card phase grid, a 4-card outcomes/deliverables grid, a before/after comparison, an interactive prompt library, testimonials, a two-column pricing block, FAQ, email capture, and a final CTA. All sections respect `prefers-reduced-motion`.

## Hard constraints

- **No em dashes anywhere** (per CLAUDE.md). The prototype HTML has a few; strip them when porting copy. Use commas, regular dashes, or parentheses.
- **No new top-level dependencies.** All animation is CSS + plain SVG + a small RAF loop, identical pattern to the existing `Starfield.tsx`.
- **No `/content/` writes that aren't listed below.** The schema changes I'm proposing are listed explicitly under "Content schema changes."
- **Price.** The prototype shows `$249`. Authoritative price is still `$49` per CLAUDE.md / `final-cta.mdx` / `Pricing.tsx`. **Keep `$49`.** Treat the prototype's `$249` as an artifact of the design exploration and ignore it.
- **Tone preserved.** Headlines stay editorial / human. Don't "operations-console" the copy. The chrome is denser; the prose is not.

## Content schema changes (`/content/landing/*.mdx`)

These are the only `/content/` edits in this handoff. Apply them verbatim.

### 1. `content/landing/hero.mdx` — replace whole file

```mdx
---
eyebrow: "Live · 60-minute onboarding · v1.0"
headline_line_1: "You became the AI person by default."
headline_line_2: "Build a custom"
headline_line_3: "workspace that already works."
---

A 60-minute guided onboarding for the solo entrepreneur or small-team lead. Install the starter kit, configure Claude, walk away with a setup that compounds, not another bookmark folder.

Three months ago I had no coding experience. Today I've shipped real apps. I'm probably not much further along than you are, but I can tell you exactly what helped, what wasted my time, and what I wish someone had told me in week one.
```

Notes: line 2 stays plain; line 3 takes the `headline-gradient` + `breath` treatment in `Hero.tsx` (already wired). Eyebrow is the system-status string. No em dashes.

### 2. `content/landing/pricing.mdx` — new file

```mdx
---
eyebrow: "Pricing"
headline: "One price."
headline_em: "Everything inside."
sub: "No tiers. No upsells. The setup, artifacts, chat support, lifetime access to all future updates."
amount: "$49"
amount_qualifier: "one-time, includes every future update"
button_text: "Buy and start setup"
features:
  - "The full 60-minute guided setup, top to bottom"
  - "Personalized CLAUDE.md and live Nexus map"
  - "20-prompt library tuned to your tone"
  - "Lifetime access to the starter repo"
  - "Real humans on chat (14-min average)"
  - "Updates whenever Claude updates"
aside:
  - { k: "Refund", v: "30 days", small: "no questions" }
  - { k: "Time required", v: "60 minutes", small: "one sitting" }
  - { k: "What you keep", v: "Everything", small: "repo, spec, prompts" }
  - { k: "Support", v: "Real humans", small: "14-min avg" }
  - { k: "Updates", v: "Lifetime", small: "follows Claude releases" }
  - { k: "Cancellation", v: "Anytime", small: "keep what you built" }
---
```

This replaces the inline `Pricing.tsx` strings; `Pricing.tsx` becomes a content-driven component. `Pricing.tsx` should keep reading `STRIPE_PAYMENT_LINK` from env.

### 3. `content/landing/final-cta.mdx` — replace whole file

```mdx
---
headline_line_1: "It's time to"
headline_line_2: "finish what we started"
subhead: "One payment. Lifetime access. Empowering you."
button_text: "Begin onboarding"
footnote: "$49 once, 30-day refund, keep everything you build"
---
```

### 4. `content/landing/utility-bar.mdx` — new file

Used by the new `UtilityBar.tsx` strip across the top.

```mdx
---
left:
  - "SYSTEM ONLINE"
  - "Build 26.04 · stable"
right_static:
  - "v1.0.0"
clock: "utc"
---
```

## Component changes (`/components/landing/*.tsx`)

### New components

1. **`UtilityBar.tsx`** — fixed top strip, `position: sticky; top: 0; z-index: 60`. Mono caps, 10px, letter-spacing 0.14em. Left side has a tiny `cosmic-glow-soft` dot then `SYSTEM ONLINE · Build 26.04 · stable`. Right side has a UTC clock (client-side `useEffect` setInterval at 1s, shows `HH:MM:SS UTC` tabular). Color `var(--color-muted-dark)`, background `rgba(2,6,14,0.65)` with `backdrop-blur-md`. 28px tall.

2. **`OpsPanelGlobe.tsx`** — the right-side hero panel. Renders inline SVG: a 170-radius globe with 4 concentric latitude ellipses + 3 longitudes, `rgba(95, 217, 255, 0.18)` strokes, an outer ring at `rgba(95, 217, 255, 0.4)`, a dashed magenta orbit `rgba(255, 95, 179, 0.35)` rotating 40s linear (use SVG `<animateTransform>` like the prototype), 140 surface dots generated client-side (front-facing only, 18% chance of being cyan, otherwise muted blue), and 3 location pings (SF cyan, NYC magenta, LDN violet) with expanding-ring + fade animations on stagger. Below the SVG, a 3-cell stat strip (`Active builds 1,284 ↑12% · Hours saved 9k/mo · Anomalies ●34 active`). Wrapped in a `glass-card-static` panel with the `ops-panel-head` chip ("NEXUS · LIVE MAP" + animated `Tracking` dot).

3. **`NexusDashPreview.tsx`** — new full-width section between Hero and Plateau. Title: "The Nexus dashboard. *Live for every customer* from minute 60." Body is a glass-card containing:
   - `dash-tabbar` (Overview/Tools/Prompts/Decisions pills + ⌘K search chip on the right). Visual-only state.
   - 3-column grid: left rail (5 phase rail-cards + 3 workspace rail-cards), center (month strip + animated waveform chart), right side (anomaly stat block + 4 location sync stamps).
   - The chart is the only complex piece. Implementation: an SVG with 5 paths whose `d` attributes are recomputed every animation frame from `performance.now()` using the `genPath(ampBase, ampVar, freq1, freq2, phase, yBase, drift)` function from the prototype (lines ~720–760). Plus a sweeping probe line + dot + label. Wrap the RAF in a `useEffect` with cleanup, and gate the whole RAF behind `matchMedia('(prefers-reduced-motion: reduce)')` — when reduced, render five static paths from one fixed `t = 0` snapshot.
   - **Don't lift this into a generic chart abstraction.** It's intentionally a one-off visual. Inline it.

4. **`PhasesGrid.tsx`** — replaces / augments existing `SetupPreview`. Five `phase-card`s in a responsive grid (1 / 2 / 3 / 5 columns at sm/md/lg/xl). Each card: `PHASE · 0N` mono label, `<h3>` title, one-sentence description, footer row with `Duration / 5 min`. Cards use `.glass-card` (so the existing hover lift + amber halo applies). Content stays in `content/landing/setup-flow.mdx` (already exists from the prior handoff); add `phases` array to its frontmatter if it isn't there.

5. **`OutcomesGrid.tsx`** — new section. Eyebrow "Deliverables", headline "Four artifacts. *Yours forever.*", lead "Not a course. Not another video library. Things you'll actually use tomorrow." Four `outcome` cards, each with a 2-letter glyph badge (MD cyan, NX violet, PL magenta, NM amber), title, description, and a tag-row footer (`Format / Markdown` etc.). Glyph is a 56×56 rounded square with the corresponding cosmic color at ~12% opacity background, full-saturation text, mono caps. Content in `content/landing/outcomes.mdx`.

6. **`BeforeAfterCompare.tsx`** — new section, replaces / supplements existing `BeforeAfter.tsx`. Two side-by-side `compare-card`s. The `bad` panel uses `var(--color-muted)` text and ✕ markers; the `good` panel uses the amber/magenta gradient border and ✓ markers. Each panel is a `glass-card-static` with a header (`Before AI Catch Up · • STATE` / `After AI Catch Up · ● STATE`) and a 5-item checklist. Content is in `content/landing/before-after.mdx` (already exists; just read both `mode: "with"` and `mode: "without"` panels, no new schema needed).

7. **`PromptLibraryExplorer.tsx`** — new section between Outcomes and Testimonials. Two-column glass-card. Left: a scrollable list of prompts (`P01 / Weekly recap / tone · candid / 3 vars`, eight rows). Right: detail panel showing the active prompt's name, tag, formatted body in a mono `<pre>` with three syntax classes (`.cm` muted comment, `.kw` amber, `.var` cyan, `.str` magenta), and a 4-cell stat row (`Variables / Avg tokens / Used by / Updated`). Active prompt switches on click. Use the eight prompts from the prototype's `PROMPTS` object as initial content but **read from `/content/admin/prompts.json`** if entries with matching ids are present, so the library here is the same source of truth as the admin Prompts tab. Use `'use client'`. Hard cap to first 8 entries on the landing — the admin tab has all 20.

8. **`TestimonialsRow.tsx`** — three quote cards in a row. Body in editorial serif, attribution row with a 2-letter avatar circle (gradient amber→magenta with cosmic-glow-soft border), name, role. Three quotes, each `data-reveal`'d with stagger `0 / 80 / 160`. Content in `content/landing/testimonials.mdx`.

9. **`FAQ.tsx`** — new section. Title "Things people ask *before buying.*", lead "If your question isn't here, the chat icon up top works. A real human reads it." Then 7 `<details>` accordions (use the `chev` element from globals.css for the indicator). First one `open` by default. Content in `content/landing/faq.mdx`.

10. **`EmailCapture.tsx`** — replaces the inline form on `/`. Single glass-card centered, headline "Not ready yet? *We'll still teach you.*", lead, then email input + send button. Posts to existing `/api/subscribe`. Button text changes to "Sent ✓" on success (already the existing pattern).

### Existing components that need touch-ups

11. **`SiteHeader.tsx`** — add the 6-tab nav row (Overview / The flow / Nexus / Prompts / Pricing / FAQ) between the wordmark and the right-side actions, plus a search-icon button and a settings-icon button before the existing "Get access" CTA. Tabs are anchor links to in-page section ids. Active tab is whichever section is most visible; implement with a single IntersectionObserver across `[id]` sections, same pattern as the existing reveal observer. Keep the auto-hide-on-scroll-down behavior.

12. **`Hero.tsx`** — switch the layout to a 2-column grid on `md+` (text left, `<OpsPanelGlobe />` right). Mobile stays single-column with the globe stacked under the text. Add the `hero-eyebrow` chip styling: pill-shaped, 1px cyan border, 6×6 cyan-glow dot inside, mono caps. Add a price block under the CTA: `<strong>$49</strong> one-time, lifetime access` in mono.

13. **`Pricing.tsx`** — switch from inline strings to the new `pricing.mdx`. Layout becomes 2-column on `md+`: a `price-card` (large amount, feature list with ✓ markers, full-width CTA) and a `price-aside` panel (the 6-row k/v list with `¤` glyph). On mobile, the aside collapses below the card.

14. **`FinalCTA.tsx`** — minor: line 1 plain, line 2 with `headline-gradient`. Footnote uses the new copy. All other behavior (MagneticButton, Reveal stagger) stays.

15. **`app/page.tsx`** — new section order:
    ```
    UtilityBar
    SiteHeader  (with the new tab row)
    Hero        (with OpsPanelGlobe)
    NexusDashPreview
    PhasesGrid
    OutcomesGrid
    BeforeAfterCompare
    PromptLibraryExplorer
    TestimonialsRow
    Pricing
    FAQ
    EmailCapture
    FinalCTA
    Footer
    ```
    `LatestWriting`, `WhatYouGet`, `WhoItsFor`, `ThisIsForYou`, `VideoPlaceholder`, `Plateau` are removed from the landing page (don't delete the components — keep them for the `/preview` route and future blog use).

## CSS additions (append to `app/globals.css`, do not modify existing rules)

All listed in `DESIGN.md` with full source. Summary:

- `.utility-bar`, `.utility-bar .dot`, `.utility-bar .sep`
- `.hero-eyebrow`, `.hero-grid`
- `.ops-panel`, `.ops-panel-head`, `.ops-panel-head .live`, `.globe-wrap`, `.stat-strip`, `.stat-strip .stat`
- `.dash`, `.dash-tabbar`, `.dash-tabbar .pill`, `.dash-tabbar .search`, `.dash-grid`, `.dash-rail`, `.rail-h`, `.rail-card`, `.rail-card.active`, `.month-strip`, `.chart`, `.dash-side`, `.anomaly`, `.loc-list`, `.loc`
- `.phases-grid`, `.phase-card`, `.phase-card .num`, `.phase-card .time`
- `.outcomes`, `.outcome`, `.glyph`, `.glyph.cyan/.violet/.pink/.amber`
- `.compare`, `.compare-card`, `.compare-card.bad`, `.compare-card.good`, `.compare-list`, `.compare-list .ic`
- `.prompts`, `.prompt-list`, `.prompt-row`, `.prompt-row.active`, `.prompt-detail`, `.prompt-body`, `.prompt-body .cm/.kw/.var/.str`, `.prompt-meta`
- `.testis`, `.testi`, `.testi .avatar`, `.testi .who`
- `.pricing`, `.price-card`, `.price-card .amount`, `.features`, `.price-aside`, `.aside-row`
- `.faqs`, `.faq` (uses existing `.chev`), `.faq summary`, `.faq[open] summary .chev`, `.faq .a`
- `.capture`, `.capture-card`, `.capture-form`
- `.final` (final CTA stage), `.foot-grid`, `.foot-col`, `.foot-bot`

All cards inherit `.glass-card` or `.glass-card-static` so they share hover/halo behavior. **Do not duplicate the glass styling**, just compose on top.

## Animation notes (from the prototype, with their reasons)

These are the things most likely to be lost in translation. Worth preserving exactly.

- **Hero headline reveal stagger:** lines reveal at `40 / 120 / 220 ms`. Line 3 also gets `breath` (4.5s ease-in-out infinite). Don't change the timing — the rhythm reads as "thought arriving."
- **Globe orbit:** 40s linear rotation on the dashed magenta orbit. Linear, not ease — non-linear motion makes it feel mechanical. Pings stagger at 0.6s offsets, 2.4s pulse.
- **Chart waveforms:** five paths, each with its own `freq1 / freq2 / phase / drift`. Don't simplify to fewer waves; the visual density is the entire point. The probe line sweeps at `0.06` of period, slow enough to read but fast enough to feel alive. The `VYG1` label is recomputed every frame to suggest live telemetry.
- **Hot-wire pulse** (existing): keep the 4.5s pulse on `SetupPreview`'s connector. If `PhasesGrid` replaces `SetupPreview` on the landing, port the hot-wire to the divider between the rail and the chart in `NexusDashPreview` instead, so the motion isn't lost.
- **Magnetic CTA** (existing): preserve. Wrap the new "Begin onboarding" CTA in `MagneticButton`.
- **Reveal stagger inside grids:** outcomes, phases, testimonials, FAQ should each get sequential `delay` (0/80/160/240/...) on `Reveal`. Keep this — without it the grids feel "popped on" instead of "arrived."
- **`prefers-reduced-motion` respected on every new animation.** No exceptions: the chart RAF, the orbit, the pings, the magnetic pull, the reveal transforms.

## Hover states (the easy thing to half-implement)

- `.glass-card:hover` already gives `translateY(-2px)` + amber halo. All new cards should reach for `.glass-card`, not roll their own hover.
- `.rail-card:hover` should brighten the left border to `var(--color-terracotta)` and lift 1px. Active rail-card has a 3px amber left bar and brighter background.
- `.prompt-row:hover` brightens text and shows a faint left amber bar. Active row gets a full bar + amber-tinted background.
- `.phase-card:hover` raises 2px and the `PHASE · 0N` label shifts from `var(--color-muted)` to `var(--color-terracotta)` — small but reads as "this card is alive."
- `.faq summary:hover` shifts the chev to amber. Open state rotates the chev (existing `.chev.is-open`).
- All transitions use the existing easing token `cubic-bezier(0.22, 1, 0.36, 1)` and durations 180–260ms. Don't introduce new easings.

## Verification checklist (before marking handoff complete)

- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` green, all routes still emit
- [ ] `/` renders the new section order with no layout overflow at 360px / 768px / 1280px / 1920px
- [ ] All animations stop or stay at t=0 with `prefers-reduced-motion: reduce` set in DevTools
- [ ] No em dashes anywhere in the diff (`grep -R "—" app/ components/ content/landing/` returns nothing)
- [ ] Price reads `$49` everywhere (Pricing card, Hero subhead, FinalCTA footnote). The prototype's `$249` is **not** in the repo.
- [ ] Stripe link still wired through `STRIPE_PAYMENT_LINK` on every CTA
- [ ] `/admin/*`, `/login`, `/preview`, `/thank-you`, `/blog/*` all still render (untouched by this change)
- [ ] `/api/subscribe` still works from `EmailCapture.tsx`
- [ ] Lighthouse mobile performance >= 85 (the chart RAF is the most likely regression — verify)

## Rollout

Branch off `claude/ai-onboarding-v1-RTsDk`, push as `claude/aurora-command-reskin`, open a PR titled "Aurora Command landing reskin." Don't merge to `main` automatically; Tennyson will review the deploy preview on Vercel before merging.

## When this is done

Move this entire block to `## Completed handoffs` with a one-line entry per the protocol. Strategy Claude will pick up future tweaks from there.

---

## Companion: `DESIGN.md`

Sits alongside this file in the repo. It contains the full CSS source for every new class listed above (lifted from `Aurora Command - Landing.html` lines 1–700 of the source `aurora-command.css`, with no functional changes), plus the design rules in narrative form. Use it as the spec when implementing each component.

_(None. Paste new instructions from Strategy Claude above this line.)_

## Completed handoffs

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
