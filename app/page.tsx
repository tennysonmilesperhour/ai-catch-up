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

// CommandPalette is mounted in app/layout.tsx so ⌘K works on every page.

export default function LandingPage() {
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
    </main>
  );
}
