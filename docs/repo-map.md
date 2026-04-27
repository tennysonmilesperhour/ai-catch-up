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
