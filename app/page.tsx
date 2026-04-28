import { SiteHeader } from "@/components/landing/SiteHeader";
import { UtilityBar } from "@/components/landing/UtilityBar";
import { PageBackdrop } from "@/components/shared/PageBackdrop";
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

export default function LandingPage() {
  return (
    <main>
      <PageBackdrop variant="stars" />
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
