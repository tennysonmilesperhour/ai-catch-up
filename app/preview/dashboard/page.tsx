import Link from "next/link";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { UtilityBar } from "@/components/landing/UtilityBar";
import { Footer } from "@/components/landing/Footer";
import { ScenarioPicker } from "@/components/landing/ScenarioPicker";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { MagneticButton } from "@/components/shared/MagneticButton";
import { Reveal } from "@/components/shared/Reveal";
import { resolveCheckout } from "@/lib/checkout";

export const metadata = {
  title: "Workspace Pulse · Preview",
  description:
    "An interactive preview of the Workspace Pulse dashboard. Sessions, commits, prompts, decisions, hours saved.",
};

const STREAM_NOTES = [
  {
    name: "Sessions",
    color: "var(--color-cyan)",
    desc: "Counts the times you opened Claude Code in your project. Trends down when you stop using it; that's the leading indicator we watch.",
  },
  {
    name: "Commits",
    color: "var(--color-organic)",
    desc: "Pulled from the GitHub events API for every connected repo. Pairs with Sessions to show ratio: are you using Claude and shipping, or just chatting?",
  },
  {
    name: "Prompts",
    color: "var(--color-magenta)",
    desc: "Increments when you click 'Run' on a prompt in the admin Prompts tab. Stuck patterns are computed from prompts you used a lot then stopped.",
  },
  {
    name: "Decisions",
    color: "var(--color-violet)",
    desc: "Reads from the decisions log. New entries mean you're locking choices instead of re-debating them.",
  },
  {
    name: "Hours saved",
    color: "var(--color-terracotta)",
    desc: "Derived. prompts × baseline_minutes_per_prompt + sessions_avoided_via_CLAUDE_md. Tunable in Settings.",
  },
];

export default function DashboardPlaygroundPage() {
  const checkout = resolveCheckout();

  return (
    <main className="aurora-page">
      <UtilityBar />
      <SiteHeader />

      {/* Page header */}
      <section className="px-6 md:px-12 pt-12 md:pt-16 pb-4 max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-4">
            <SectionEyebrow>Playground</SectionEyebrow>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="font-serif text-3xl md:text-5xl xl:text-6xl leading-tight tracking-[-0.02em] text-[var(--color-dark)] max-w-4xl mb-4">
            Poke at the dashboard.{" "}
            <span className="headline-gradient">No purchase needed.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-[var(--color-muted-dark)] max-w-3xl leading-relaxed text-base md:text-lg mb-2">
            This is the same Workspace Pulse buyers see on day 61. Pick a
            scenario below to watch the dashboard evolve from week one to
            year one. Hover the phase rail or stream chips for live tooltips;
            the chart sweeps regardless. The data is illustrative until you
            connect your own repos.
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            ⌘K · Search the page · ↑↓ navigate · ↵ open
          </p>
        </Reveal>
      </section>

      {/* Scenario picker swaps the demo dataset live; the dashboard
          re-renders the chart, rail badges, signals, and activity feed
          when you click. */}
      <ScenarioPicker />

      {/* Stream-by-stream legend with full descriptions. */}
      <section className="px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto">
        <Reveal>
          <p className="label text-[var(--color-muted-dark)] mb-4">
            What each stream means
          </p>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STREAM_NOTES.map((s, i) => (
            <Reveal key={s.name} delay={i * 60}>
              <article className="glass-card-static p-5 h-full flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: s.color,
                      boxShadow: `0 0 8px ${s.color}`,
                    }}
                    aria-hidden
                  />
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-dark)]">
                    {s.name}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-muted-dark)]">
                  {s.desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA stage */}
      <section className="px-6 md:px-12 py-16 md:py-24 max-w-4xl mx-auto text-center">
        <Reveal>
          <div className="mb-4 inline-block">
            <SectionEyebrow>Want this in your workspace?</SectionEyebrow>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-5">
            Sixty minutes from now,{" "}
            <span className="headline-gradient">this is yours.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="text-[var(--color-muted-dark)] mb-10 max-w-2xl mx-auto leading-relaxed">
            One payment, lifetime access. Your dashboard goes live the moment
            you finish the onboarding, fed by your real repos, sessions, and
            prompts.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <MagneticButton href={checkout.href}>
              <span className="glass-button-primary inline-flex items-center justify-center px-7 py-3.5 font-mono text-sm uppercase tracking-[0.12em]">
                {checkout.ready ? "Begin onboarding →" : checkout.fallbackLabel}
              </span>
            </MagneticButton>
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-muted-dark)] hover:text-[var(--color-cyan)] transition-colors"
            >
              ← Back to the full pitch
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
