import type { ReactNode } from "react";
import { SetupShell } from "@/components/setup/SetupShell";

export const metadata = {
  title: "Setup",
  description: "The 60-minute guided onboarding for AI Catch Up.",
};

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <main className="aurora-page">
      <SetupShell>{children}</SetupShell>
    </main>
  );
}
