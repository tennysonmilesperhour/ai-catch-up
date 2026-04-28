import { Reveal } from "@/components/shared/Reveal";
import { EmailCaptureForm } from "@/components/shared/EmailCaptureForm";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

export function EmailCapture() {
  return (
    <section
      id="email"
      className="px-6 md:px-12 py-16 md:py-20 max-w-3xl mx-auto"
    >
      <Reveal>
        <div className="glass-card capture capture-card">
          <SectionEyebrow>Stay in touch</SectionEyebrow>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight text-[var(--color-dark)]">
            Not ready yet?{" "}
            <span className="italic headline-gradient">
              We'll still teach you.
            </span>
          </h2>
          <p className="text-[var(--color-muted-dark)] max-w-xl">
            One email a week. New prompts, new tools, what changed in Claude
            this week. Unsubscribe anytime.
          </p>
          <div className="capture-form">
            <EmailCaptureForm
              buttonLabel="Send"
              successMessage="Sent ✓"
              tone="dark"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
