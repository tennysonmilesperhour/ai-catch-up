import { Hero } from "@/components/landing/Hero";
import { VideoPlaceholder } from "@/components/landing/VideoPlaceholder";
import { Pricing } from "@/components/landing/Pricing";
import { Plateau } from "@/components/landing/Plateau";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { SetupPreview } from "@/components/landing/SetupPreview";
import { WhoItsFor } from "@/components/landing/WhoItsFor";
import { ThisIsForYou } from "@/components/landing/ThisIsForYou";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <VideoPlaceholder />
      <Pricing />
      <Plateau />
      <BeforeAfter />
      <WhatYouGet />
      <SetupPreview />
      <WhoItsFor />
      <ThisIsForYou />
      <FinalCTA />
      <Footer />
    </main>
  );
}
