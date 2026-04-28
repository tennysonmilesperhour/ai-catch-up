import { Reveal } from "@/components/shared/Reveal";

// STRATEGY CLAUDE: refine. The Aurora handoff said BeforeAfterCompare reads
// existing before-after.mdx with no schema change, but the existing schema
// is chat-bubble scenarios, not 5-item compare checklists. Placeholder
// checklists live here until you decide whether to extend the mdx schema.
const BAD = [
  "Forty-five minutes of setup questions before any work starts",
  "Every chat begins with re-explaining your project",
  "Five tools open, three of them duplicate, one forgotten",
  "Prompts copy-pasted from Twitter that don't fit your tone",
  "No idea what to build next, so the tabs sit open",
];
const GOOD = [
  "Claude already knows your stack, your tone, your decisions",
  "First message of every session goes straight to the work",
  "One workspace, mapped, with the tools you actually use",
  "Twenty prompts tuned to your project, organized by job",
  "A next-three-moves memo refreshed monthly",
];

export function BeforeAfterCompare() {
  return (
    <section className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto">
      <Reveal>
        <p className="label text-[var(--color-muted-dark)] mb-3">The difference</p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3 max-w-3xl">
          Same tools.{" "}
          <span className="italic headline-gradient">Different outcome.</span>
        </h2>
      </Reveal>
      <Reveal delay={160}>
        <p className="text-[var(--color-muted-dark)] mb-8 md:mb-12 max-w-3xl leading-relaxed">
          The gap between "I tried Claude" and "Claude works for me" is not the
          tool. It's the context you hand it.
        </p>
      </Reveal>

      <div className="compare">
        <Reveal>
          <article className="glass-card-static compare-card bad">
            <div className="h">
              <span>Before AI Catch Up</span>
              <span>· State drifting</span>
            </div>
            <ul className="compare-list">
              {BAD.map((item, i) => (
                <li key={i}>
                  <span className="ic" aria-hidden>
                    ✕
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
        <Reveal delay={80}>
          <article className="glass-card-static compare-card good">
            <div className="h">
              <span>After AI Catch Up</span>
              <span>· State synced</span>
            </div>
            <ul className="compare-list">
              {GOOD.map((item, i) => (
                <li key={i}>
                  <span className="ic" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
