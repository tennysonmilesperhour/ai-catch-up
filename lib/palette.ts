import { loadContent, loadJson } from "@/lib/content";
import type { PaletteItem } from "@/components/shared/CommandPalette";

type PromptRecord = {
  id: number | string;
  category: string;
  title: string;
};
type FAQItem = { q: string; a: string };

// Server-side helper that builds the unified item list for the global ⌘K
// command palette. Uses absolute hrefs ("/#section", "/preview/dashboard")
// so the palette works identically from the landing, the playground, the
// auth pages, and admin.
export function buildPaletteItems(): PaletteItem[] {
  const sections: PaletteItem[] = [
    { kind: "section", id: "sec-overview",   title: "Overview",            subtitle: "Hero · the offer",                       href: "/#overview" },
    { kind: "section", id: "sec-flow",       title: "The flow",            subtitle: "Five phases · 60 minutes",               href: "/#flow" },
    { kind: "section", id: "sec-nexus",      title: "Nexus dashboard",     subtitle: "Workspace Pulse preview",                href: "/#nexus" },
    { kind: "section", id: "sec-prompts",    title: "Prompt library",      subtitle: "Tuned to your voice",                    href: "/#prompts" },
    { kind: "section", id: "sec-pricing",    title: "Pricing",             subtitle: "$49 · one-time",                         href: "/#pricing" },
    { kind: "section", id: "sec-faq",        title: "FAQ",                 subtitle: "Things people ask",                      href: "/#faq" },
    { kind: "section", id: "sec-email",      title: "Stay in touch",       subtitle: "Email capture",                          href: "/#email" },
    { kind: "section", id: "sec-playground", title: "Dashboard playground", subtitle: "Standalone Workspace Pulse preview",     href: "/preview/dashboard" },
    { kind: "section", id: "sec-blog",       title: "Writing",             subtitle: "Recent posts",                           href: "/blog" },
    { kind: "section", id: "sec-login",      title: "Log in",              subtitle: "Existing customers + admins",            href: "/login" },
    // Single onboarding entry, the rail on /setup itself shows the 5
    // phases visually, so collapsing the per-phase palette rows keeps
    // the search results cleaner without losing reachability.
    { kind: "section", id: "sec-setup",      title: "Begin onboarding",    subtitle: "5-phase guided setup (60 minutes)",      href: "/setup" },
    { kind: "section", id: "sec-coding-guide", title: "Coding guide",      subtitle: "Plan First, Act Second workflow",        href: "/admin/coding-guide" },
    { kind: "section", id: "sec-pulse",        title: "Workspace Pulse",   subtitle: "Pattern signals + suggested moves",      href: "/admin/pulse" },
    { kind: "section", id: "sec-invocations",  title: "Invocations",       subtitle: "Last 30 prompt runs with token cost",    href: "/admin/invocations" },
    { kind: "section", id: "sec-memo",         title: "Monthly memo",      subtitle: "30-day distillation generator",          href: "/admin/memo" },
  ];

  let prompts: PaletteItem[] = [];
  try {
    const promptsRaw = loadJson<PromptRecord[] | { prompts: PromptRecord[] }>(
      "admin/prompts.json"
    );
    const promptsArr = Array.isArray(promptsRaw)
      ? promptsRaw
      : promptsRaw.prompts;
    prompts = promptsArr.slice(0, 8).map((p, i) => ({
      kind: "prompt",
      id: `prompt-${p.id}`,
      title: p.title,
      subtitle: `P${String(i + 1).padStart(2, "0")} · ${p.category}`,
      href: "/#prompts",
    }));
  } catch {
    // prompts.json missing or malformed, palette degrades gracefully.
  }

  let faqs: PaletteItem[] = [];
  try {
    const { frontmatter: faqFm } = loadContent<{ items?: FAQItem[] }>(
      "landing/faq.mdx"
    );
    faqs = (faqFm.items || []).map((f, i) => ({
      kind: "faq",
      id: `faq-${i}`,
      title: f.q,
      subtitle: f.a.length > 80 ? f.a.slice(0, 77) + "…" : f.a,
      href: "/#faq",
    }));
  } catch {
    // faq.mdx missing, palette degrades gracefully.
  }

  return [...sections, ...prompts, ...faqs];
}
