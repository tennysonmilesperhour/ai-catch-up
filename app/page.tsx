import { SiteHeader } from "@/components/landing/SiteHeader";
import { UtilityBar } from "@/components/landing/UtilityBar";
import { Hero } from "@/components/landing/Hero";
import { NexusDashPreview } from "@/components/landing/NexusDashPreview";
import { PhasesGrid } from "@/components/landing/PhasesGrid";
import { OutcomesGrid } from "@/components/landing/OutcomesGrid";
import { BeforeAfterCompare } from "@/components/landing/BeforeAfterCompare";
import { PromptLibraryExplorer } from "@/components/landing/PromptLibraryExplorer";
import { TestimonialsRow } from "@/components/landing/TestimonialsRow";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { EmailCapture } from "@/components/landing/EmailCapture";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import {
  CommandPalette,
  type PaletteItem,
} from "@/components/shared/CommandPalette";
import { loadContent, loadJson } from "@/lib/content";

type PromptRecord = {
  id: number | string;
  category: string;
  title: string;
};
type FAQItem = { q: string; a: string };

function buildPaletteItems(): PaletteItem[] {
  const sections: PaletteItem[] = [
    { kind: "section", id: "sec-overview", title: "Overview", subtitle: "Hero · the offer", href: "#overview" },
    { kind: "section", id: "sec-flow",     title: "The flow", subtitle: "Five phases · 60 minutes", href: "#flow" },
    { kind: "section", id: "sec-nexus",    title: "Nexus dashboard", subtitle: "Workspace Pulse preview", href: "#nexus" },
    { kind: "section", id: "sec-prompts",  title: "Prompt library", subtitle: "Tuned to your voice", href: "#prompts" },
    { kind: "section", id: "sec-pricing",  title: "Pricing", subtitle: "$49 · one-time", href: "#pricing" },
    { kind: "section", id: "sec-faq",      title: "FAQ", subtitle: "Things people ask", href: "#faq" },
    { kind: "section", id: "sec-email",    title: "Stay in touch", subtitle: "Email capture", href: "#email" },
    { kind: "section", id: "sec-playground", title: "Dashboard playground", subtitle: "Standalone Workspace Pulse preview", href: "/preview/dashboard" },
  ];

  const promptsRaw = loadJson<PromptRecord[] | { prompts: PromptRecord[] }>(
    "admin/prompts.json"
  );
  const promptsArr = Array.isArray(promptsRaw) ? promptsRaw : promptsRaw.prompts;
  const prompts: PaletteItem[] = promptsArr.slice(0, 8).map((p, i) => ({
    kind: "prompt",
    id: `prompt-${p.id}`,
    title: p.title,
    subtitle: `P${String(i + 1).padStart(2, "0")} · ${p.category}`,
    href: "#prompts",
  }));

  const { frontmatter: faqFm } = loadContent<{ items?: FAQItem[] }>(
    "landing/faq.mdx"
  );
  const faqs: PaletteItem[] = (faqFm.items || []).map((f, i) => ({
    kind: "faq",
    id: `faq-${i}`,
    title: f.q,
    subtitle: f.a.length > 80 ? f.a.slice(0, 77) + "…" : f.a,
    href: "#faq",
  }));

  return [...sections, ...prompts, ...faqs];
}

export default function LandingPage() {
  const paletteItems = buildPaletteItems();

  return (
    <main className="aurora-page">
      <UtilityBar />
      <SiteHeader />
      <Hero />
      <NexusDashPreview />
      <PhasesGrid />
      <OutcomesGrid />
      <BeforeAfterCompare />
      <PromptLibraryExplorer />
      <TestimonialsRow />
      <Pricing />
      <FAQ />
      <EmailCapture />
      <FinalCTA />
      <Footer />
      <CommandPalette items={paletteItems} />
    </main>
  );
}
