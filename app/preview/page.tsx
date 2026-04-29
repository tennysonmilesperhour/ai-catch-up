import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata = { title: "Preview" };

const tabs = [
  {
    name: "Plan",
    blurb:
      "A one-page overview of your project: who it's for, positioning, price, timeline, and the five-phase setup flow.",
  },
  {
    name: "Schedule",
    blurb:
      "Week-by-week breakdown of what's in progress, blocked, and shipping next. Kept honest, not padded.",
  },
  {
    name: "Nexus",
    blurb:
      "A living map of your tooling: real repos, forks, the gaps you haven't filled, and the must-have tools you're missing. Drag to explore, click any node for action buttons.",
  },
  {
    name: "Prompts",
    blurb:
      "20 prompts organized across nine situations (Getting unstuck, Project setup, Building, Prompting Claude, Research, Marketing, Operations, Brand, When things feel hard). Each one tested in real sessions, with a 'why it works' note.",
  },
  {
    name: "Decisions",
    blurb:
      "Locked decisions with rationale. Not up for re-debate unless there's new information.",
  },
  {
    name: "Launch Checklist",
    blurb:
      "Three phases, 24 items. Infrastructure, Content, Launch Readiness. Each item has action buttons that copy the prompt you need or walk you through the setup.",
  },
];

export default function PreviewPage() {
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";

  return (
    <main className="aurora-page min-h-screen">
      <SiteHeader />
      <div className="px-6 md:px-12 py-16 md:py-20 max-w-5xl mx-auto">
        <p className="label text-[var(--color-terracotta)] mb-6">
          Preview
        </p>
        <h1 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-5">
          This is what you get inside.
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-muted-dark)] mb-10 max-w-3xl leading-relaxed">
          You are signed in, but you haven't unlocked the full onboarding yet.
          Here is what the admin dashboard looks like once you do. Everything
          below is real, not a mockup.
        </p>

        <div className="grid gap-4 mb-12">
          {tabs.map((t) => (
            <article
              key={t.name}
              className="relative glass-card p-5 md:p-6"
            >
              <div className="absolute top-4 right-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                Locked
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-[var(--color-dark)] mb-2">
                {t.name}
              </h2>
              <p className="text-[var(--color-muted-dark)] leading-relaxed max-w-3xl">
                {t.blurb}
              </p>
            </article>
          ))}
        </div>

        <div className="bg-[var(--color-dark)] text-[var(--color-cream)] p-8 md:p-12">
          <p className="label text-[var(--color-terracotta)] mb-4">
            Unlock for $49
          </p>
          <h2 className="font-serif text-2xl md:text-4xl mb-5 leading-tight">
            One-time payment. Lifetime access.
          </h2>
          <p className="text-[var(--color-muted)] mb-8 max-w-2xl leading-relaxed">
            No subscription. No upsell. You get the video, the setup flow,
            the prompt library, the Nexus map, and the ongoing personalized
            checklist. Start your 60-minute setup the moment you buy.
          </p>
          <Button href={paymentLink} variant="primary">
            Unlock the onboarding
          </Button>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 font-mono text-xs text-[var(--color-muted-dark)]">
          <Link
            href="/"
            className="hover:text-[var(--color-dark)] transition-colors"
          >
            &larr; Back to the landing page
          </Link>
          <form method="POST" action="/api/logout">
            <button
              type="submit"
              className="font-mono text-xs hover:text-[var(--color-dark)] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
