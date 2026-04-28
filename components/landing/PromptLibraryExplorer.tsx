"use client";

import { useMemo, useState } from "react";
import promptsData from "@/content/admin/prompts.json";
import { Reveal } from "@/components/shared/Reveal";

type Prompt = {
  id: number | string;
  category: string;
  title: string;
  prompt: string;
  whyItWorks?: string;
  variables?: string;
  avg_tokens?: string;
  used_by_pct?: string;
  updated_at?: string;
};

const PROMPTS: Prompt[] = (promptsData as Prompt[]).slice(0, 8);

function highlight(body: string): string {
  const escape = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escape
    .replace(/(\[[A-Z_][A-Z0-9_ \-,/]*\])/g, '<span class="var">$1</span>')
    .replace(/(^|\n)(##\s+[^\n]+)/g, '$1<span class="kw">$2</span>')
    .replace(/(^|\n)(\d+\.\s)/g, '$1<span class="kw">$2</span>')
    .replace(/("[^"]+")/g, '<span class="str">$1</span>')
    .replace(/(^|\n)(\/[A-Za-z0-9.\-_]+)/g, '$1<span class="cm">$2</span>');
}

function countVariables(prompt: string): number {
  const matches = prompt.match(/\[[A-Z_][A-Z0-9_ \-,/]*\]/g);
  return matches ? new Set(matches).size : 0;
}

export function PromptLibraryExplorer() {
  const [activeId, setActiveId] = useState<number | string>(PROMPTS[0]?.id ?? 1);
  const [copied, setCopied] = useState(false);

  const active = useMemo(
    () => PROMPTS.find((p) => p.id === activeId) ?? PROMPTS[0],
    [activeId]
  );

  const onCopy = async () => {
    if (!active) return;
    try {
      await navigator.clipboard.writeText(active.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard rejection: silently no-op */
    }
  };

  if (!active) return null;
  const vars = active.variables ?? String(countVariables(active.prompt));

  return (
    <section
      id="prompts"
      className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto"
    >
      <Reveal>
        <p className="label text-[var(--color-muted-dark)] mb-3">Prompt library</p>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] mb-3 max-w-3xl">
          Twenty prompts.{" "}
          <span className="italic headline-gradient">Tuned to your tone.</span>
        </h2>
      </Reveal>
      <Reveal delay={160}>
        <p className="text-[var(--color-muted-dark)] mb-8 md:mb-12 max-w-3xl leading-relaxed">
          A preview of the live library. The full set ships with the onboarding
          and stays in your admin tab. Click any row to inspect.
        </p>
      </Reveal>

      <Reveal delay={240}>
        <div className="glass-card-static prompts">
          <div className="prompt-list">
            {PROMPTS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={`prompt-row ${p.id === active.id ? "active" : ""}`}
              >
                <span className="id">P{String(i + 1).padStart(2, "0")} · {p.category}</span>
                <span className="ttl">{p.title}</span>
                <span className="meta">
                  {countVariables(p.prompt)} vars
                </span>
              </button>
            ))}
          </div>

          <div className="prompt-detail">
            <div className="head">
              <h3>{active.title}</h3>
              <button
                type="button"
                onClick={onCopy}
                className="glass-button px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre
              className="prompt-body"
              dangerouslySetInnerHTML={{ __html: highlight(active.prompt) }}
            />
            <div className="prompt-meta">
              <div className="cell">
                <span className="v num-tab">{vars}</span>
                <span>Variables</span>
              </div>
              <div className="cell">
                <span className="v num-tab">{active.avg_tokens ?? "-"}</span>
                <span>Avg tokens</span>
              </div>
              <div className="cell">
                <span className="v num-tab">{active.used_by_pct ?? "-"}</span>
                <span>Used by</span>
              </div>
              <div className="cell">
                <span className="v num-tab">{active.updated_at ?? "-"}</span>
                <span>Updated</span>
              </div>
            </div>
            {active.whyItWorks && (
              <p className="text-[var(--color-muted-dark)] italic text-sm leading-relaxed">
                Why it works: {active.whyItWorks}
              </p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
