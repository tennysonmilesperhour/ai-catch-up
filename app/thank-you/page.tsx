import Link from "next/link";
import { EmailCaptureForm } from "@/components/shared/EmailCaptureForm";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { CommunityCTA } from "@/components/shared/CommunityCTA";

export const metadata = {
  title: "Thank you",
};

export default function ThankYouPage() {
  return (
    <main className="aurora-page min-h-screen">
      <SiteHeader />
      <div className="px-6 md:px-12 py-16 md:py-24 max-w-3xl mx-auto">
        <p className="label text-[var(--color-cyan)] mb-6">You are in</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] text-[var(--color-dark)] mb-8">
          Welcome.{" "}
          <span className="headline-gradient">
            Your 60 minutes start now.
          </span>
        </h1>
        <div className="text-lg text-[var(--color-muted-dark)] space-y-5 leading-relaxed max-w-2xl mb-10">
          <p>
            Payment confirmed. The guided setup is ready: five phases, each
            ending with a working artifact in your workspace. Bring your
            Anthropic API key (you'll paste it in Settings on the way) and
            sixty uninterrupted minutes if you have them.
          </p>
          <p>
            You can pause and pick up any time. Progress saves to this
            browser.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-16">
          <Link
            href="/setup"
            className="glass-button-primary inline-flex items-center justify-center px-7 py-3.5 font-mono text-sm uppercase tracking-[0.12em]"
          >
            Begin Phase 01 →
          </Link>
          <Link
            href="/admin/settings"
            className="setup-action-ghost"
          >
            Add API key first
          </Link>
        </div>

        <div className="mb-12 pt-8 border-t border-[rgba(95,255,215,0.14)]">
          <p className="label text-[var(--color-muted-dark)] mb-4">
            Want a heads-up when there are major updates?
          </p>
          <EmailCaptureForm
            placeholder="you@example.com"
            buttonLabel="Notify me"
            successMessage="Got it, I'll reach out when something meaningful ships."
          />
        </div>

        <CommunityCTA tone="light" />
      </div>
    </main>
  );
}
