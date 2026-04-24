import { EmailCaptureForm } from "@/components/shared/EmailCaptureForm";

export function Footer() {
  return (
    <footer className="bg-[var(--color-darker)] text-[var(--color-cream)] py-16 md:py-20">
      <div className="px-6 md:px-12 max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
        <div>
          <p className="label text-[var(--color-terracotta)] mb-4">
            Stay in the loop
          </p>
          <p className="font-serif text-2xl md:text-3xl leading-snug max-w-md">
            New updates, new lessons, a short note when something meaningful
            changes.
          </p>
        </div>
        <div className="flex items-end">
          <EmailCaptureForm
            tone="dark"
            placeholder="you@example.com"
            buttonLabel="Subscribe"
            successMessage="Thanks, you are on the list."
          />
        </div>
      </div>
      <div className="px-6 md:px-12 max-w-5xl mx-auto mt-16 pt-6 border-t border-[var(--color-border-dark)] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-mono text-xs text-[var(--color-muted)]">
        <p>&copy; {new Date().getFullYear()} AI Catch Up. All rights reserved.</p>
        <p>Made with care, not hype.</p>
      </div>
    </footer>
  );
}
