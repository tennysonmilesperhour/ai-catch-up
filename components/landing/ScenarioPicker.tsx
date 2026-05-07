"use client";

import { useState } from "react";
import { NexusDashPreview } from "@/components/landing/NexusDashPreview";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";
import { SCENARIOS } from "@/lib/dashboard-scenarios";

const DEFAULT_ID = "baseline";

export function ScenarioPicker() {
  const [activeId, setActiveId] = useState<string>(DEFAULT_ID);
  const scenario =
    SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[1];

  return (
    <div className="px-6 md:px-12 max-w-7xl mx-auto">
      <Reveal>
        <div className="mb-3">
          <SectionEyebrow>Pick a scenario</SectionEyebrow>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <p className="text-[var(--color-muted-dark)] mb-5 max-w-3xl leading-relaxed text-sm md:text-base">
          The Workspace Pulse evolves with you. Below are three curated
          datasets covering early, established, and mature use. Click any
          scenario to swap the chart, signals, rail counts, and activity
          feed live.
        </p>
      </Reveal>
      <Reveal delay={160}>
        <div className="scenario-picker">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className={`scenario-card ${activeId === s.id ? "is-active" : ""}`}
              aria-pressed={activeId === s.id}
            >
              <span className="scenario-num">0{i + 1}</span>
              <span className="scenario-body">
                <span className="scenario-label">{s.label}</span>
                <span className="scenario-desc">{s.desc}</span>
              </span>
              {activeId === s.id && (
                <span className="scenario-active-dot" aria-hidden />
              )}
            </button>
          ))}
        </div>
      </Reveal>

      <NexusDashPreview scenario={scenario} />
    </div>
  );
}
