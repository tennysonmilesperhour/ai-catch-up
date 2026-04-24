# Handoff

This file is how Tennyson passes instructions from Strategy Claude (claude.ai web app) to Claude Code (this repo).

## How to use this file

1. Tennyson pastes instructions from Strategy Claude at the top of this file.
2. At the start of every session, Claude Code reads this file.
3. If there are pending instructions, Claude Code executes them, then deletes the processed instructions from this file and leaves a short note in the "Completed handoffs" section below.

## Pending instructions

_(None. Paste new instructions from Strategy Claude above this line.)_

## Completed handoffs

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
