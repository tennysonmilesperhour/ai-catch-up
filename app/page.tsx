import { Hero } from "@/components/landing/Hero";
import { VideoPlaceholder } from "@/components/landing/VideoPlaceholder";
import { Pricing } from "@/components/landing/Pricing";
import { Plateau } from "@/components/landing/Plateau";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { WhoItsFor } from "@/components/landing/WhoItsFor";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <VideoPlaceholder />
      <Pricing />
      <Plateau />
      <WhatYouGet />
      <WhoItsFor />
      <FinalCTA />
      <Footer />
    </main>
  );
}
