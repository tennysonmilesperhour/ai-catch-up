# Handoff

This file is how Tennyson passes instructions from Strategy Claude (claude.ai web app) to Claude Code (this repo).

## How to use this file

1. Tennyson pastes instructions from Strategy Claude at the top of this file.
2. At the start of every session, Claude Code reads this file.
3. If there are pending instructions, Claude Code executes them, then deletes the processed instructions from this file and leaves a short note in the "Completed handoffs" section below.

## Pending instructions

_(None. Paste new instructions from Strategy Claude above this line.)_

## Completed handoffs

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
