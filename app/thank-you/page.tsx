import { EmailCaptureForm } from "@/components/shared/EmailCaptureForm";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata = {
  title: "Thank you",
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="px-6 md:px-12 py-16 md:py-24 max-w-3xl mx-auto">
        <p className="label text-[var(--color-terracotta)] mb-6">You are in</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.1] text-[var(--color-dark)] mb-8">
          Thank you. The video is coming soon.
        </h1>
        <div className="text-lg text-[var(--color-muted-dark)] space-y-5 leading-relaxed max-w-2xl mb-12">
          <p>
            Your payment is confirmed. The full onboarding video and companion
            materials will be delivered in v1.1.
          </p>
          <p>
            Drop your email below and you will be the first to know when it is
            ready. I will also send a note if anything meaningful changes in
            the meantime.
          </p>
        </div>

        <div className="aspect-video bg-[var(--color-darker)] border border-[var(--color-border-dark)] flex items-center justify-center mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--color-cream)]">
            Video placeholder &middot; product delivery coming in v1.1
          </p>
        </div>

        <div>
          <p className="label text-[var(--color-muted-dark)] mb-4">
            Get notified
          </p>
          <EmailCaptureForm
            placeholder="you@example.com"
            buttonLabel="Notify me"
            successMessage="Got it, I will reach out when the video is live."
          />
        </div>
      </div>
    </main>
  );
}
