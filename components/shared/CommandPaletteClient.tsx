"use client";

import dynamic from "next/dynamic";
import type { PaletteItem } from "@/components/shared/CommandPalette";

// Client-side wrapper that dynamically imports the CommandPalette
// (~5KB modal code + listener). Lazy-loading drops shared-bundle weight
// on every page; the trade-off is a tiny window after hydration where
// ⌘K isn't bound yet. Acceptable for v1.x.
const CommandPaletteInner = dynamic(
  () =>
    import("@/components/shared/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);

export function CommandPaletteClient({ items }: { items: PaletteItem[] }) {
  return <CommandPaletteInner items={items} />;
}
