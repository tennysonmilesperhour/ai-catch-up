import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

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
        <div className="mb-4">
          <SectionEyebrow>The difference</SectionEyebrow>
        </div>
      </Reveal>
      <div className="section-head">
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] max-w-3xl">
            What it feels like,{" "}
            <span className="headline-gradient">before and after.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="section-subhead">
            The 60 minutes that breaks the loop of half-finished setups.
          </p>
        </Reveal>
      </div>

      <div className="compare">
        <Reveal>
          <article className="glass-card-static compare-card bad">
            <div className="h">
              <span>Before AI Catch Up</span>
              <span className="state">State drifting</span>
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
              <span className="state">State synced</span>
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
