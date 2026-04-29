"use client";

import dynamic from "next/dynamic";
import { OpsPanelGlobeFallback } from "@/components/landing/OpsPanelGlobeFallback";

// Client-side wrapper that lazy-loads the Three.js globe AFTER hydration.
// Three.js + the scene weigh ~150KB minified; loading them dynamically
// drops the landing's First Load JS by that amount. The SVG fallback
// fills the same dimensions so the layout doesn't reflow.
export const OpsPanelGlobeClient = dynamic(
  () =>
    import("@/components/landing/OpsPanelGlobe").then((m) => m.OpsPanelGlobe),
  {
    ssr: false,
    loading: () => <OpsPanelGlobeFallback />,
  }
);
