# DESIGN.md — Aurora Command landing direction

Companion spec for the reskin handoff. This document captures the *why* behind the design decisions, the exact tokens and timings, and the bits most likely to lose nuance in translation. It is meant to live in the repo permanently (alongside `CLAUDE.md`) so future iterations stay anchored.

---

## Direction in one paragraph

The landing page presents AI Catch Up as an **operations console** for the solo entrepreneur — not a course landing, not a SaaS marketing page. The visual language is observatory + cockpit + cosmic nebula: deep midnight navy background, amber/magenta/teal accents, hairline cyan grid lines, mono-caps system labels, glassy cards lifted on cosmic glow. The copy stays warm and editorial; the chrome carries the technical weight. The promise: "this is already running for you."

## Tokens (already in `app/globals.css`, do not change)

| Role | Token | Value |
|---|---|---|
| Background | `--color-cream` | `#06101e` |
| Foreground | `--color-dark` | `#f0f4ff` |
| Deepest panel | `--color-darker` | `#02060e` |
| Card surface | `--color-surface` | `#0d1c34` |
| Primary accent | `--color-terracotta` | `#fbbf24` (amber) |
| Secondary accent | `--color-rust` | `#f59e0b` |
| Cybernetic | `--color-cyan` | `#5fffd7` |
| Depth highlight | `--color-violet` | `#c084fc` |
| Nebula | `--color-magenta` | `#ff5fb3` |
| Living green | `--color-organic` | `#4ade80` |
| Low emphasis | `--color-muted` | `#7d8aad` |
| Body on dark | `--color-muted-dark` | `#c8d3ee` |
| Border | `--color-border` | `#1c3046` |

Note: variable names predate the cosmic palette swap, so `--color-terracotta` is now amber-gold. Don't rename — too many class names depend on it.

## Type scale

- Display (headlines): Outfit, 600. Letter-spacing -0.015em.
- Body: Inter, 400/500. Line-height 1.55–1.75 in prose.
- Mono (labels, technical chrome, code, prompts): Space Mono, 400/700. Letter-spacing 0.10–0.14em, uppercase for system labels.

## The cosmic chrome vocabulary

This is what makes the page feel like a console, not a landing. Use it consistently.

- **System labels** (`.label`, `.lbl`, sec-eyebrow): mono, uppercase, 10–11px, letter-spacing 0.14em, color `--color-muted-dark`. Often paired with a cyan dot (`6×6`, `cyan-glow`) to suggest "live signal."
- **Tabular numerals**: every number that updates (UTC clock, stats, anomaly counts) uses `font-variant-numeric: tabular-nums` so digit columns don't jiggle.
- **Hairline strokes**: `rgba(95, 217, 255, 0.18)` for grid lines, `rgba(95, 217, 255, 0.4)` for emphasis, `rgba(255, 95, 179, 0.35)` for orbit traces. Always 1–1.2px stroke width.
- **Glyph badges** (outcomes): 2-letter monogram in mono caps, 56×56 rounded-12 background tinted to the section color at ~12% opacity, with the full-saturation color as text.
- **`¤` and `·` glyphs**: used as bullet substitutes in technical lists. They feel "engineering manual" rather than "marketing site." Don't replace with `•`.

## Motion — the contract

Motion in this design is mostly *latent*: things drift, breathe, sweep. They don't bounce, don't pop, don't shake. If a new animation feels punchy, it's wrong.

| Element | Property | Easing | Duration |
|---|---|---|---|
| Reveal on scroll | `opacity + translateY(18px → 0)` | `cubic-bezier(0.22, 1, 0.36, 1)` | 700ms |
| Reveal stagger | `delay` per child | — | 0/80/160/240ms |
| Card hover lift | `translateY(-2px)` + halo | same easing | 220ms |
| Magnetic CTA | `translate(mx, my)` | same easing | 220ms |
| Hot-wire pulse | gradient sweep | `ease-in-out` | 4.5s loop |
| Headline breath | `scale(1 → 1.012) + opacity` | `ease-in-out` | 4.5s loop |
| Nebula drift | `background-position` | `ease-in-out alternate` | 90s loop |
| Globe orbit | `rotate(-15° → 345°)` | `linear` | 40s loop |
| Globe pings | `r 3 → 22, opacity 0.9 → 0` | default | 2.4s loop, 0.6s offsets |
| Chart waveforms | RAF-driven `d` recompute | — | continuous |
| Chart probe sweep | `x` walk | — | period of `1 / 0.06` ≈ 16.6s |

**Reduced motion fallback**: every animation either ceases (`animation: none`) or holds at `t = 0`. Reveals become `opacity: 1; transform: none`. Magnetic translation pegs at `0,0`. Chart paths render once from one fixed `t` and stop.

## The five visual hierarchies (top to bottom of the page)

1. **Telemetry** — utility bar, hero eyebrow chip, ops-panel header. Smallest type, mono caps. Sets the "system on" mood without taking visual weight.
2. **Editorial** — hero h1, section h2s, testimonials body. Largest type, serif/display, gradient on the emphasized line. Carries the message.
3. **Console** — Nexus dashboard preview, prompt library, comparison panels. Mid-density, glass-cards with sub-grids and animated detail. The "show, don't tell" of the product.
4. **Catalog** — phases, outcomes, FAQ. Repeated card patterns, regular rhythm, easy to scan.
5. **Action** — pricing card, final CTA, email capture. Singular focus, magnetic button, gradient highlight on the verb.

When in doubt about how a new element should look, ask which hierarchy it belongs to. They don't mix.

## Component-by-component nuance notes

### UtilityBar

Sticky top, never animates in/out (unlike the SiteHeader which auto-hides). Reads as the page's permanent system status. The `dot` to the left of "SYSTEM ONLINE" pulses subtly via the existing `.cosmic-glow-soft` — do not animate it harder, it would feel like an alert.

### SiteHeader

Already auto-hides on scroll-down per the prior polish-pass. Add the 6-tab strip between wordmark and CTA. Active tab gets the amber underline (1px tall, 24px wide, `cosmic-glow-soft`). Determine active via a single IntersectionObserver across all `<section id>` elements; same pattern as `Reveal`. Don't use `scrollIntoView` — use anchor links and let the browser handle it.

### Hero + OpsPanelGlobe

The two-column hero is what shifts the page from "marketing" to "console." On mobile the globe stacks below the text and shrinks to ~280px tall — keep it visible, don't hide it. The globe's surface dots are generated client-side once on mount; do not regenerate on resize. The dashed magenta orbit and the three pings are pure SVG `<animateTransform>` / `<animate>` — no JS — which means they run even before hydration. Keep it that way.

### NexusDashPreview (Workspace Pulse)

The most visually expensive section, and the one that does the most marketing work. Concept: this is the *same surface* that buyers will see in v1.1+ as their post-purchase Workspace Pulse — only the data source changes. On the marketing page it animates from a curated demo dataset; on the buyer's view it reads from real connectors.

**Five streams.** Sessions, Commits, Prompts, Decisions, Hours saved. Each `WAVES[i]` carries a `name`, a `unit` (/wk or /mo), and a one-line `desc` that surfaces in the chip tooltip. Don't add a sixth stream — the visual density was tuned for five and the colors deliberately reuse the existing palette tokens (cyan / organic / magenta / violet / amber).

**Probe label.** The sweeping probe reads `Sessions 12 /wk` in the lead wave's color, recomputed every frame. The reading number is a presentational mapping `(220 - yProbe) / 4` so the value stays in the 10-40 range no matter how the y-base shifts.

**Stream legend.** Below the chart, one chip per wave: color dot + name + unit. Hover any chip to see the description. Without the legend the colors read as decorative; with it, the colors carry meaning.

**Demo pill.** The dash-tabbar carries a `Demo · live for buyers` violet-dashed pill so visitors understand the data is illustrative and the buyer view will be live. This intentionally contrasts the "marketing demo" frame with the "real product" promise.

**Pattern signals box** (replaces the old SaaS-cosplay anomaly metrics). Three rows of stuck-signals AI Catch Up actually solves: stuck patterns, drift, plateau risk. Each maps to a real heuristic the v1.1+ engine will run over the buyer's workspace. Active alerts count is the actionable tail.

**Activity feed** (replaces the old city sync stamps). Four workspace events with kind-colored dots: edit (cyan), use (magenta), log (violet), sync (amber). Each is `{label} → {detail}` followed by a HH:MM timestamp. Demo data is a curated single-day slice ("today") rather than a clock.

**Performance.**
- Use `requestAnimationFrame` (not `setInterval`) so the browser can pause it on hidden tabs.
- Stop the RAF when the section scrolls off-screen using an IntersectionObserver. Restart when it comes back.
- On mobile (≤ 640px), reduce `samples` from 240 to 100. Visual fidelity is fine, perf is much better.
- The `genPath` function is intentionally not extracted into a hook — keep it inline at the top of the component.

**v1.1+ data sources** (the connector spec for when this becomes a live buyer dashboard):
- *Sessions*: a small client log emitted by Claude Code on session start, posted to a `/api/pulse/session` endpoint. Falls back to GitHub PR/commit cadence if the local log isn't installed.
- *Commits*: GitHub API `users/{username}/events?type=PushEvent` aggregated to a weekly count. Reuses the existing `lib/github.ts` plumbing and `GITHUB_USERNAME` env var.
- *Prompts*: increment when the Prompts admin tab's `Run` action fires, persisted to a per-user `pulse.json`. Matches the existing localStorage pattern in `LaunchChecklist`.
- *Decisions*: file-stat on `content/admin/decisions.json` gives the count and the most recent entry's timestamp.
- *Hours saved*: derived. `prompts_run * baseline_minutes_saved_per_prompt + sessions_avoided_via_claude_md`. Tunable in Settings.
- *Pattern signals* (stuck/drift/plateau): a once-per-day cron in v1.2 reads the buyer's prompts.json + sessions log + claude.md mtime and emits the heuristic outputs. v1.1 ships a static "rules of thumb" version computed at request time.
- *Activity feed*: union of file-watch events on the buyer's content + admin tab actions, capped at the last 6 entries.

**Don't lift any of this into a generic chart abstraction.** It's intentionally a one-off visual.

### PhasesGrid

Each card has its own subtle hover state: lift 2px, the `PHASE · 0N` label shifts from `--color-muted` to `--color-terracotta`. The Duration footer row is separated by a 1px hairline border at 30% opacity. Card height should be uniform — set `align-items: stretch` on the grid.

### PromptLibraryExplorer

The most "interactive" piece on the page. Implementation notes:
- Use `'use client'`. Initial active prompt is P01.
- The mono `<pre>` body is rendered with `dangerouslySetInnerHTML` because the syntax classes (`.cm`, `.kw`, `.var`, `.str`) are inline spans. Sanitize at the content boundary — the prompts come from `prompts.json` which is repo-trusted.
- Copy button: clipboard write, "Copied" confirmation for 2s, same pattern as Nexus tooltip's `copy-prompt` action. Use the same `ActionButton` if possible; if not, replicate the timing.
- The 4-cell stat row at the bottom (Variables / Avg tokens / Used by / Updated) is illustrative — values come from each prompt's record in `prompts.json`. Schema: add optional `variables`, `avg_tokens`, `used_by_pct`, `updated_at` fields. If missing, fall back to `—` (regular dash).

### Pricing

Two-column on `md+`. The `price-aside` is not a "compare plans" panel — there is only one plan. It's a reassurance panel: refund, time, what you keep, support, updates, cancellation. Reading it should feel like reading the fine print and finding only good news.

The amount is `$49` not `$249`. The prototype HTML has `$249` because it explored a higher price point during the visual exploration. **Keep `$49`** per the locked decision in `decisions.json`.

### FAQ

7 entries. First is `open` by default so the user lands on a fully-formed answer ("Who is this for?"). The chev rotates 180° on `[open]` via the existing `.chev.is-open` class — apply it via a `useEffect` that watches each `<details>` element's `open` attribute. Or, simpler: use `:has()` — `details[open] summary .chev { transform: rotate(225deg); }` — modern browser support is fine for v1.0.

### EmailCapture

POST to `/api/subscribe`. On success the button text becomes "Sent ✓" with the existing organic-green color (`--color-organic`). On error, gracefully fall back to a mailto link in the footnote. Don't show toast notifications — they don't fit the visual language.

### FinalCTA

Already 95% there. Just swap the copy per `final-cta.mdx` and confirm the magnetic-pull range stays at the default 14px / 80px (it should — same component, no override).

## What "ship the nuance" means

The most common failure mode of a reskin is that the *frame* lands but the *details* don't. For this design, the details that matter are:

1. **The motion is slow.** Almost everything except hover and reveal is on a 4.5s+ loop. If a reviewer says "feels static," resist adding faster motion. The slowness is the message.
2. **Mono labels are everywhere, in small doses.** Every section has a tiny mono caps eyebrow. Removing them collapses the console feel.
3. **Glyph badges are 2 letters, not icons.** The outcomes section uses `MD / NX / PL / NM`, not Lucide icons. SVG icons would shift the page to "SaaS landing"; letterforms keep it "ops manual."
4. **Stats are tabular.** Every number has `font-variant-numeric: tabular-nums`. This matters during animation (chart probe label) but it should be applied universally to numbers in the dash, the price, the stamps.
5. **The cyan grid is hairline.** `rgba(95, 217, 255, 0.18)` with 0.8–1px stroke. Anything thicker reads as a chart, not a console.
6. **No em dashes.** Per CLAUDE.md, hard rule.
7. **The page never bounces.** All easing is `cubic-bezier(0.22, 1, 0.36, 1)` (a smooth single-curve), `linear` (for the orbit), or `ease-in-out` (for the breathing loops). No spring physics, no overshoot.

## "Live mirror" workflow (how this stays in sync)

The Strategy Claude prototype (`Aurora Command - Landing.html`) and this repo are not auto-synced. They mirror each other through this process:

1. Visual / copy / interaction changes are made in the prototype first.
2. Strategy Claude writes a new entry in this repo's `HANDOFF.md` describing the diff.
3. Claude Code applies the diff, runs `npx tsc --noEmit && npm run build`, opens a PR.
4. Once merged, the corresponding Strategy Claude prototype version is tagged in its filename (`Aurora Command - Landing v2.html`) so the trail is visible.
5. Code-only changes (perf fixes, accessibility, security) happen in the repo without a prototype counterpart and don't need a Strategy Claude round-trip. They're noted in the repo's `HANDOFF.md` "Completed handoffs" section so Strategy Claude can read state.

This is the same protocol that's been working for the prior handoffs (the polish pass, the security audit, the Nexus tooltips). It scales. Don't try to automate it further until the design surface has stopped moving.

---

## CSS source — paste into `app/globals.css` (append, do not modify existing rules)

> The full CSS source for every new class listed in the handoff lives in the prototype's `aurora-command.css` file. When you implement, copy that file's contents into `app/globals.css` after the existing rules (preserve the section comment headers). The prototype file uses raw values rather than CSS variables in a few places — convert these to the existing tokens during paste:
>
> - `#5fd9ff` (cyan-glow accent) → `var(--color-cyan)` *only where used as a foreground color*; keep the raw hex inside the SVG gradients and the chart strokes since those are scoped to the chart only.
> - `#ff5fb3` → `var(--color-magenta)` (same caveat for SVG strokes).
> - `#b9a4ff` → `var(--color-violet)`.
> - `#fbbf24` / `#f59e0b` → `var(--color-terracotta)` / `var(--color-rust)` for non-SVG usage.
> - Background `#06101e` → `var(--color-cream)`.
> - Card surfaces using `rgba(13, 28, 52, ...)` are already aligned with `--color-surface`; leave the rgbas as-is so the alpha channel works.
>
> **Do not duplicate** the existing `.glass-card`, `.glass-button-primary`, `.glass-button`, `.headline-gradient`, `.orbit-stack`, `.magnetic`, `.hotwire`, or `[data-reveal]` rules — they're already in the file and they already match the design.
