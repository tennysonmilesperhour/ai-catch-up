# Repo map

A reference for Claude Code working in this repo. Source of truth for structure, copy locations, and existing patterns. Updated as the repo evolves.

This file is built in sections. Sections after this one will be appended in follow-up passes.

## 1. Stack and styling

### Framework

- **Next.js 15** (App Router), as `next` `^15.1.0` in `package.json:18`.
- **React 19** (`^19.0.0`).
- **TypeScript 5.7** with `tsc --noEmit` available as `npm run typecheck`.
- `next.config.mjs` enables MDX as a page extension (`pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"]`) and uses `outputFileTracingIncludes` to bundle `./content/**/*` into the serverless function so the content loaders can read MDX and JSON at request time on Vercel.
- Security headers (X-Frame-Options DENY, nosniff, Referrer-Policy, restrictive Permissions-Policy, X-DNS-Prefetch-Control) are set in `next.config.mjs:7`.

### Key dependencies

- **MDX pipeline:** `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`. The repo uses MDX mostly as a frontmatter container, not for JSX-in-content.
- **`gray-matter`** parses frontmatter inside `lib/content.ts`.
- **`react-markdown`** is installed (used inside the admin Nexus / steps modal flows for rendering markdown payloads).
- **`react-force-graph-3d`** + **`three`** power the 3D Nexus visualization on `/admin/nexus`.
- No test framework, no Prettier, no ESLint config beyond the Next.js default. `npm run lint` runs `next lint`.

### Styling

- **Tailwind CSS v4.** `tailwind.config.ts` is intentionally minimal and only sets `content` globs. Almost all design tokens live in the `@theme` block at the top of `app/globals.css`.
- Color palette is defined as CSS custom properties (`--color-cream`, `--color-terracotta`, `--color-cyan`, `--color-magenta`, `--color-organic`, etc.) in `app/globals.css:3`. Components reference them via Tailwind arbitrary values like `text-[var(--color-terracotta)]`.
- Note: the variable names in `globals.css` are kept from an earlier palette ("cream", "terracotta", "rust"), but the values were reskinned to a "deep midnight navy + amber/cyan/magenta cosmic" palette. The names no longer describe the colors. Comments in `globals.css:10` call this out explicitly.
- Typography is loaded via `next/font/google` in `app/layout.tsx:7`: **Outfit** (display, headings), **Inter** (body), **Space Mono** (labels, nav, technical). Exposed as `--font-display`, `--font-body`, `--font-mono` and consumed through `--font-serif`, `--font-display`, `--font-mono` aliases in `globals.css`.
- Custom utility classes defined in `globals.css`: `.glass-card`, `.glass-card-static`, `.glass-button`, `.glass-button-primary`, `.cosmic-glow`, `.cosmic-glow-soft`, `.cyan-glow`, `.organic-glow`, `.breath`, `.star`, `.orbit-ring`. Use these instead of recreating the gradients and shadows inline.
- The page background is a multi-layer animated radial-gradient nebula plus pinpoint "stars," set on `body` in `globals.css:69` with a `nebula-drift` keyframe animation.
- A `.label` class (used as eyebrow text) in `globals.css:117` sets uppercase mono with `0.14em` letter-spacing and `0.7rem` size. This is the dominant eyebrow pattern across components.

## 2. Folder structure

Top-level layout. One line per folder.

```
ai-catch-up/
├── app/          Next.js App Router. Pages, layouts, API routes, sitemap, robots.
├── components/   React components, split by surface area: landing, admin, shared.
├── content/      Editable copy and data: MDX, JSON, and a few TS data modules.
├── data/         Runtime file-based storage (currently just .gitkeep; subscribers.json is written here at runtime).
├── lib/          Server-side utilities: content loader, session/HMAC, GitHub fetch, Nexus helpers, checklist storage.
├── docs/         Documentation for Claude Code and humans (this file lives here).
├── CLAUDE.md     Persistent project context loaded at session start.
├── HANDOFF.md    Channel for content edits passed from Strategy Claude (claude.ai web) to Claude Code.
├── README.md     Human-facing readme.
├── .env.example  Documented env vars; copy to .env.local for development.
├── middleware.ts Edge middleware that gates /admin/* via signed session cookie.
├── mdx-components.tsx  MDX provider hook (per Next 15 convention).
├── next.config.mjs     Next config: MDX, security headers, content tracing.
├── tailwind.config.ts  Tailwind v4 minimal config (most tokens live in globals.css).
├── postcss.config.mjs  Tailwind v4 PostCSS plugin.
├── tsconfig.json
├── package.json
└── package-lock.json
```

Inside the larger folders:

- `app/` has top-level pages (`page.tsx`, `thank-you/`, `login/`, `preview/`, `not-found.tsx`), an `admin/` subtree with one folder per tab, and `api/` with route handlers. Also `layout.tsx`, `globals.css`, `sitemap.ts`, `robots.ts`.
- `components/landing/` has one component per landing-page section (Hero, Plateau, BeforeAfter, WhatYouGet, SetupPreview, WhoItsFor, ThisIsForYou, Pricing, FinalCTA, VideoPlaceholder, SiteHeader, Footer).
- `components/admin/` has the admin-only widgets (NexusAdmin, Nexus, Nexus3D, PromptsList, LaunchChecklist).
- `components/shared/` has cross-surface widgets (Button, ActionButton, EmailCaptureForm, CommunityCTA, RefreshBanner, StepsModal, TabNav).
- `content/landing/` has 9 MDX files driving the landing-page sections.
- `content/admin/` has plan.mdx, decisions.json, schedule.json, prompts.json, launch-checklist.ts, nexus-data.ts.

## 3. Where user-facing copy lives (part 1: MDX with frontmatter)

This is the most important section to internalize before editing copy. Four distinct patterns coexist. This subsection covers the dominant one.

### Pattern: MDX with frontmatter, loaded at request time

Most landing-page section copy lives in `content/landing/*.mdx`. Each file is paired with a single component in `components/landing/` that imports it via `loadContent()` from `lib/content.ts`. The component reads `frontmatter` (typed in the component file) and, in some cases, the `body` paragraphs underneath. This is the preferred pattern. Edits here do not require touching components.

Files that follow this pattern:

| File | Component that reads it | Copy shape |
|---|---|---|
| `content/landing/hero.mdx` | `components/landing/Hero.tsx` | `eyebrow`, `headline_line_1..3`, plus 2 body paragraphs |
| `content/landing/plateau.mdx` | `components/landing/Plateau.tsx` | `eyebrow`, `headline`, plus body paragraphs |
| `content/landing/before-after.mdx` | `components/landing/BeforeAfter.tsx` | `eyebrow`, `headline`, `intro`, `scenarios[]` (each: `when`, `mode`, `user_prompt`, `ai_response`, `outcome`). No body. |
| `content/landing/what-you-get.mdx` | `components/landing/WhatYouGet.tsx` | `eyebrow`, `headline`, `intro`, `layers[]` (each: `label`, `title`, `subtitle`, `items[]`). No body. |
| `content/landing/setup-preview.mdx` | `components/landing/SetupPreview.tsx` | `eyebrow`, `headline`, `intro`, `phases[]` (each: `number`, `title`, `time`, `description`). No body. |
| `content/landing/who-its-for.mdx` | `components/landing/WhoItsFor.tsx` | `eyebrow`, `headline`, plus body paragraphs |
| `content/landing/this-is-for-you.mdx` | `components/landing/ThisIsForYou.tsx` | `eyebrow`, `headline`, `scenarios[]` (each: `text`), `counterpoint` (`label`, `items[]`). No body. |
| `content/landing/final-cta.mdx` | `components/landing/FinalCTA.tsx` | `eyebrow`, `headline_line_1..2`, `subhead`, `button_text`, `footnote`. No body. |
| `content/landing/community.mdx` | `components/shared/CommunityCTA.tsx` | `eyebrow`, `headline`, `url`, `button_text`, `disclosure`, plus a body paragraph |
| `content/admin/plan.mdx` | `app/admin/plan/page.tsx` | `title`, `subtitle`, `sections[]` (each: `title`, `content`). No body used. |

### How the loader works

- `lib/content.ts` exposes two helpers used everywhere:
  - `loadContent<T>(relativePath)` reads `content/<path>`, runs `gray-matter` over it, and returns `{ frontmatter, body }`. Body is trimmed.
  - `loadJson<T>(relativePath)` reads and `JSON.parse()`s a file under `content/`.
- Both are synchronous filesystem reads at request time. They work because `next.config.mjs:24` whitelists `./content/**/*` for output file tracing, so the files ship with the serverless function on Vercel.
- Because reads happen per request, content edits go live on the next deploy without a rebuild concern beyond the normal Vercel pipeline.

### Frontmatter shape conventions

- Eyebrow text uses the field name `eyebrow` and renders through the `.label` class (uppercase mono). Some live components style it `text-[var(--color-muted-dark)]` (default) and some `text-[var(--color-terracotta)]` (admin/dark surfaces). The MDX file does not pick the color; the component does.
- Headlines split across multiple visual lines use `headline_line_1`, `headline_line_2`, etc. The italic terracotta accent line in Hero and FinalCTA is the last numbered line.
- A few components handle missing frontmatter gracefully by rendering a "TODO: ... pending from Strategy Claude" placeholder italic. See `Plateau.tsx:33`, `WhoItsFor.tsx:33`. This signals the section is wired up but content is not in.

## 4. Where user-facing copy lives (part 2: JSON, TS data, hardcoded)

### Pattern: structured data in JSON

Used for admin tables and lists where each row has a known schema. Loaded via `loadJson<T>()`.

| File | Loaded by | Shape |
|---|---|---|
| `content/admin/decisions.json` | `app/admin/decisions/page.tsx` | Array of `{ decision, rationale }` |
| `content/admin/schedule.json` | `app/admin/schedule/page.tsx` | Array of weeks: `{ week, focus, items[{ type, title, status, owner }] }` |
| `content/admin/prompts.json` | `app/admin/prompts/page.tsx` | Either an array of prompts or `{ categories?, prompts[] }`. Each prompt: `{ id, category, title, prompt, whyItWorks }` |

### Pattern: typed data in TypeScript modules

Used for content with executable types or richer behaviors (action handlers, embedded markdown, references).

| File | Loaded by | Notes |
|---|---|---|
| `content/admin/launch-checklist.ts` | `components/admin/LaunchChecklist.tsx` | Exports `LAUNCH_CHECKLIST` (3 phases, 24 items). Each item can have actions of kind `open-url`, `copy-prompt`, `copy-commands`, `view-steps`. Several payloads are multi-line markdown with embedded prompt copy. This file is heavy in user-facing language. |
| `content/admin/nexus-data.ts` | `app/admin/nexus/page.tsx` (via `mergeNexus`) | Exports `NEXUS_NODES`, `NEXUS_LINKS`, `DOMAINS`. Each node has a `desc` field that is user-visible on hover. ~385 lines. |

### Pattern: hardcoded copy inside components or pages

Significant landing-page and shell copy is not externalized. Edits here require touching code, not just content.

Public surfaces:

- `app/layout.tsx:42` site `<title>` and meta `description` ("A 60-minute AI onboarding system for the solo entrepreneur or small-team lead who became the de facto AI person by default.")
- `app/thank-you/page.tsx:14` headlines, paragraphs, video placeholder text, email-form labels
- `app/login/page.tsx:18` page label, headline, helper paragraph, error strings, footnote ("We keep you signed in for 30 days on this device.")
- `app/preview/page.tsx:7` `tabs[]` array of preview blurbs for Plan / Schedule / Nexus / Prompts / Decisions / Launch Checklist, plus the unlock CTA copy
- `app/not-found.tsx:11` 404 headline and body
- `components/landing/SiteHeader.tsx:7` brand wordmark "AI Catch Up", "Log in" link
- `components/landing/Footer.tsx:10` "Stay in the loop", subscribe headline, "Made with care, not hype.", copyright
- `components/landing/Pricing.tsx:11` price "$49", "one time", "No subscription, no upsell. Lifetime access to the onboarding and every update.", button "Get the onboarding"
- `components/landing/VideoPlaceholder.tsx:17` "The Plateau · 6 min"
- `components/shared/EmailCaptureForm.tsx:14` default `placeholder`, `buttonLabel`, `successMessage` (each is overrideable from the parent)
- `components/shared/RefreshBanner.tsx:118` "Updates available", "This page is out of date. Refresh to pick up the latest.", "Refresh"

Admin surfaces:

- `app/admin/layout.tsx:4` tab labels (`Plan`, `Schedule`, `Nexus`, `Prompts`, `Decisions`, `Launch Checklist`), brand wordmark, "View site", "Log out"
- `app/admin/schedule/page.tsx:43` page heading and subtitle ("Schedule" / "Week-by-week view of what is happening.")
- `app/admin/decisions/page.tsx:16` page heading and subtitle ("Decisions" / "Locked decisions and why...")
- `app/admin/prompts/page.tsx:20` page heading, subtitle, and the empty-state body copy
- `app/admin/checklist/page.tsx:9` page heading and subtitle
- `app/admin/nexus/page.tsx:34` page heading and the descriptive paragraph below it

### Practical implication

When the user says "update the headline on the schedule page," that lives in `app/admin/schedule/page.tsx`, not in any content file. When the user says "update the hero headline," that lives in `content/landing/hero.mdx`. Always check before opening a file.

## 5. Routes (part 1: public pages)

Composition pattern: each public page composes shared components from `components/landing/` and `components/shared/`.

| Path | File | What it is |
|---|---|---|
| `/` | `app/page.tsx` | Landing page. Composes 12 sections in this order: SiteHeader, Hero, VideoPlaceholder, Pricing, Plateau, BeforeAfter, WhatYouGet, SetupPreview, WhoItsFor, ThisIsForYou, FinalCTA, Footer. |
| `/thank-you` | `app/thank-you/page.tsx` | Post-payment landing. Confirms purchase, captures email for "video coming soon," shows the affiliate community CTA. No auth. |
| `/login` | `app/login/page.tsx` | Email-entry form that POSTs to `/api/login`. Sets session cookie. Redirects admin emails to `/admin`, others to `/preview`. Returns to `?next=` if it points inside `/admin`. |
| `/preview` | `app/preview/page.tsx` | Locked preview shown to signed-in non-admins. Lists the 6 admin tabs as locked cards with descriptions, plus the unlock CTA pointing at the Stripe payment link. |
| (catch-all) | `app/not-found.tsx` | Custom 404 with a link back home and to `/login`. |
| `/sitemap.xml` | `app/sitemap.ts` | Lists `/`, `/thank-you`, `/login`. |
| `/robots.txt` | `app/robots.ts` | Allows `/`, disallows `/admin`, `/admin/`, `/api`, `/api/`, `/preview`. Points at the sitemap. |

The `RefreshBanner` (rendered in `app/layout.tsx:67`) polls `/api/version` every 15 seconds and pops a toast when a new build is detected. Lives on every page.

## 6. Routes (part 2: admin and API)

### Admin

Gated by `middleware.ts:4`. The middleware reads the `ac_session` cookie, verifies the HMAC signature, and:
- Redirects unauthenticated users to `/login?next=<path>`.
- Redirects signed-in non-admin users to `/preview`.
- Lets through users whose email matches the `ADMIN_EMAIL` env var.

| Path | File | What it is |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Redirects to `/admin/plan`. |
| `/admin/plan` | `app/admin/plan/page.tsx` | One-page strategy summary, sourced from `content/admin/plan.mdx`. |
| `/admin/schedule` | `app/admin/schedule/page.tsx` | Week-by-week task table sourced from `content/admin/schedule.json`. |
| `/admin/nexus` | `app/admin/nexus/page.tsx` | Interactive 3D + 2D map of tools and projects. Curated nodes from `content/admin/nexus-data.ts` merged with live GitHub repos via `lib/github.ts` + `lib/nexus-merge.ts`. Cached 15 min. |
| `/admin/prompts` | `app/admin/prompts/page.tsx` | Filterable prompt library from `content/admin/prompts.json` (currently 20 prompts in 7 categories). |
| `/admin/decisions` | `app/admin/decisions/page.tsx` | Locked decisions list from `content/admin/decisions.json`. |
| `/admin/checklist` | `app/admin/checklist/page.tsx` | Three-phase 24-item launch checklist from `content/admin/launch-checklist.ts`, persisted per-device in `localStorage`. |

Admin shell layout (`app/admin/layout.tsx`) provides the dark header, brand wordmark, "View site" link, "Log out" form, and the tab nav.

### API routes

| Path | File | What it does |
|---|---|---|
| `POST /api/login` | `app/api/login/route.ts` | Validates email, mints a signed session cookie via `lib/session.ts`, redirects to `/admin` (admin) or `/preview` (user). Validates `next` against same-origin `/admin` paths. |
| `POST /api/logout` | `app/api/logout/route.ts` | Clears `ac_session` cookie, redirects to `/`. |
| `POST /api/subscribe` | `app/api/subscribe/route.ts` | Validates email, logs to stdout (always), best-effort appends to `data/subscribers.json` (will silently fail on Vercel's read-only FS). |
| `GET /api/version` | `app/api/version/route.ts` | Returns build identifier (Vercel commit SHA, deployment id, public build id, or per-process timestamp). Used by the RefreshBanner. `force-dynamic` and `no-store`. |

## 7. Existing patterns to preserve

When making changes, match these patterns rather than introducing new ones.

### Content access

- Always go through `lib/content.ts` (`loadContent`, `loadJson`). Do not re-implement frontmatter parsing in components.
- Frontmatter fields stay typed in the importing component, not in a shared types file. Each component declares its own `*Frontmatter` interface inline. Match this.
- New section copy belongs in `content/landing/<section>.mdx` (or `content/admin/<page>.mdx|.json`), not in component code, unless the copy is structural shell text (page chrome, errors, button labels with logic). When in doubt, externalize.

### Component conventions

- One component per landing-page section. Filename = component name = exported symbol. The component reads its own MDX file at the top.
- Composition happens in `app/page.tsx` (and `app/thank-you/page.tsx` for the post-pay surface).
- Sections share a vertical rhythm: `eyebrow` (`.label` class) -> `headline` (font-serif, large) -> optional `intro` -> body or grid. Maintain this for new sections.
- Buttons go through `components/shared/Button.tsx` (variants: `primary`, `secondary`, `ghost`). The Stripe payment link is read from `process.env.STRIPE_PAYMENT_LINK || "#"` at call sites.

### Visual language

- Use the CSS variables in `globals.css` (`var(--color-*)`), never hex literals in component code.
- Use the `.glass-card`, `.glass-card-static`, `.glass-button`, `.glass-button-primary`, and `.cosmic-glow*` utility classes for cards, buttons, and accents.
- Eyebrow text: `text-[var(--color-muted-dark)]` on light/cream surfaces, `text-[var(--color-terracotta)]` on dark surfaces or to draw attention.
- Italic terracotta is reserved for emphasis lines in headlines (Hero last line, FinalCTA accent, "for you" eyebrow on dark sections).

### Brand voice (locked rules)

- **No em dashes.** This is a hard rule, codified in `content/admin/decisions.json:9`, called out in the existing `CLAUDE.md`, and enforced in the launch checklist (`launch-checklist.ts:124`). Use commas, parentheses, periods, or rewrite. Apply this to every user-facing string anywhere in the repo.
- The launch checklist also flags AI-tell phrases to scrub: `unlock`, `harness`, `transform`, `unleash`, `leverage`, `journey`, `seamless`, `robust`, `in today's world`, `at the end of the day`. See `content/admin/launch-checklist.ts:133`. (Note: "Unlock" appears in `app/preview/page.tsx:48` and `app/preview/page.tsx:80` "Unlock for $49" / "Unlock the onboarding"; either grandfathered or pending audit. Flag in the copy audit.)
- Prompt #11 in `content/admin/prompts.json` ("Writing landing page copy that doesn't sound like AI wrote it") encodes the same banned phrases.

### Handoff protocol (from existing CLAUDE.md)

- `HANDOFF.md` is the channel by which Strategy Claude (claude.ai web) hands content edits to Claude Code (this repo).
- Existing rule: do not edit files in `/content/` based on Claude Code's own judgment. Edit `/content/` only when Tennyson asks directly or when `HANDOFF.md` instructs.
- Files outside `/content/` (components, app, middleware, config) are freely editable.
- This repo-map is itself an artifact for Claude Code, not a content edit, so it lives in `/docs/` instead of `/content/`.

## 8. Build, deploy, environment

### Scripts

- `npm run dev` -> `next dev` (default port 3000)
- `npm run build` -> `next build`
- `npm run start` -> `next start`
- `npm run lint` -> `next lint`
- `npm run typecheck` -> `tsc --noEmit`

There are no tests, no Prettier config, no Husky hooks. Linting and typechecking are the gates.

### Deploy target

- **Vercel.** GitHub repo connected to Vercel; pushes to the active branch trigger preview deploys; merges to `main` trigger production.
- The active development branch noted in the existing `CLAUDE.md` is `claude/ai-onboarding-v1-RTsDk`. The current working branch is `claude/repo-setup-guided-spxC7`.
- `next.config.mjs:24` ensures `/content/**/*` files are bundled into the serverless function via `outputFileTracingIncludes`. Do not move content out of that folder without updating the trace pattern.
- `data/subscribers.json` writes are best-effort. The serverless filesystem is read-only, so in production the email is captured via `console.log` and surfaces in Vercel logs. v1.1 will route this to a real email service.

### Environment variables

Documented in `.env.example`:

| Variable | Purpose | Required |
|---|---|---|
| `STRIPE_PAYMENT_LINK` | The Stripe payment link URL pasted into the CTA buttons | Yes for live purchases |
| `ADMIN_EMAIL` | Email that resolves to admin role; everyone else becomes a "user" with access only to `/preview` | Yes for admin access |
| `SESSION_SECRET` | 32+ random chars used to HMAC-sign session cookies | Yes in production (falls back to a per-process random value with a warning if missing) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used in metadata, sitemap, robots | Recommended |
| `GITHUB_USERNAME` | Drives the Nexus auto-sync. Without it, Nexus falls back to curated data | Optional |
| `GITHUB_TOKEN` | Optional read-only token, raises rate limits and includes private repos | Optional |

Note: the existing `CLAUDE.md` and `README.md` mention `ADMIN_PASSWORD`, but the actual auth uses `ADMIN_EMAIL` + `SESSION_SECRET`. The `.env.example` is correct; the docs are stale. (See section 9.)

## 9. Notable items, drift, and in-progress

Things future edits should be aware of. None are fixed in this pass; they are flagged so they can be triaged separately.

### The existing CLAUDE.md is significantly out of date

Multiple specifics in the root `CLAUDE.md` no longer match the code:

- **Auth model.** It describes "password-only via `middleware.ts`, password in `ADMIN_PASSWORD`" and lists `app/admin/login/page.tsx` and `app/api/admin/login/route.ts`. Reality: email-based auth with a signed cookie (`ac_session`), pages at `app/login/page.tsx` and `app/api/login/route.ts`, env vars `ADMIN_EMAIL` + `SESSION_SECRET`.
- **File tree.** Missing entries for `app/admin/checklist/`, `app/preview/`, `app/login/`, `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/api/version/`, `app/api/logout/`. Lists files that do not exist (e.g., `app/admin/login/page.tsx`).
- **Design tokens.** Says background `#faf7f2` (cream), terracotta `#d97757`. Reality (`app/globals.css:33`): background `#06101e` (deep midnight), `--color-terracotta` is `#fbbf24` (amber-gold), full cosmic palette. The variable names were kept; the values were swapped.
- **Typography.** Says "Primary font: Georgia serif." Reality: Outfit (display), Inter (body), Space Mono (mono), all loaded via `next/font/google` in `app/layout.tsx`.
- **README.md** has the same drift around env vars and admin auth.

### Two coexisting copy patterns

Roughly half of the public-facing copy is externalized to MDX/JSON; the rest is hardcoded inside components or pages (see section 4). This is not necessarily wrong, but any audit of "all the copy" must visit both places. Newly added sections should default to externalizing.

### Curriculum framing in current copy

Every reference in the current copy assumes a single offering: a "60-minute setup" / "five-phase flow" sold as a $49 one-time purchase with a $149 upsell. References, non-exhaustive:

- `content/landing/hero.mdx` ("60-minute AI onboarding system")
- `content/landing/setup-preview.mdx` (5 phases titled and described)
- `content/landing/final-cta.mdx` ("Start your setup - $49 ... 60 minutes. One-time payment.")
- `content/landing/what-you-get.mdx` ("Three layers. One working setup.")
- `app/layout.tsx` metadata description ("60-minute AI onboarding system...")
- `components/landing/Pricing.tsx` (hardcoded `$49`, "Lifetime access to the onboarding")
- `components/landing/VideoPlaceholder.tsx` ("The Plateau · 6 min")
- `app/preview/page.tsx` ("60-minute setup", "Unlock the onboarding")
- `content/admin/plan.mdx` ("The Five Phases")
- `content/admin/decisions.json` decisions #5, #7, #11 ("$49 one-time + $149 upsell", "60-minute setup time as core promise", "v1.0 ships with admin-facing checklist only")

This will be the largest source of structural mismatch when the new "three-part quickstart + six-week deep dive" framing arrives. Flagged here; will be enumerated in `docs/copy-audit.md`.

### Brand wordmark and audience framing

- The brand wordmark in code is "AI Catch Up" (`SiteHeader.tsx`, `Footer.tsx`, `app/admin/layout.tsx:25`, plus metadata `app/layout.tsx:43`). The user reference in the prompt is "AI Catchup Nexus." If the brand name has shifted, these are the touchpoints.
- Current audience framing is "the solo entrepreneur or small-team person who has become the de facto AI lead by default." The user reference in the prompt is "total beginners." If the audience has been re-positioned, this affects almost every section of copy.

### Banned-phrase exceptions

The locked decision and launch-checklist both flag the word "unlock" implicitly (via the "AI-tell phrases" list), but `app/preview/page.tsx:48` and `app/preview/page.tsx:80` use "Unlock for $49" / "Unlock the onboarding." Either grandfathered or pending audit. Worth a decision when the audit runs.

### Nexus auto-sync bundles real GitHub state

`/admin/nexus` reads live data from GitHub via `lib/github.ts` and merges it with the curated nodes. Auto-added nodes are flagged `synced: true` and rendered with a dashed ring. This is working as intended; calling it out so future edits to `content/admin/nexus-data.ts` know that GitHub is doing some of the work.

### Refresh banner is global

The refresh banner mounts on every page and polls every 15s. If you add a route that should not show it, mount the banner more selectively in `app/layout.tsx:67` instead of disabling per-page.

### HANDOFF.md is empty

No pending instructions at the time of this audit. The Strategy/Code split as described in `CLAUDE.md` has been bypassed for this session (the user is directly instructing edits in chat). That is fine for this setup phase, but it means the prior workflow assumption (Strategy Claude owns `/content/`, Claude Code does not edit it without an explicit handoff) is suspended for now. The new `CLAUDE.md` written in step 2 should clarify the new working agreement.
