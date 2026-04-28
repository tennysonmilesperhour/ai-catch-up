"use client";

import { useMemo, useState } from "react";
import promptsData from "@/content/admin/prompts.json";
import { Reveal } from "@/components/shared/Reveal";
import { SectionEyebrow } from "@/components/shared/SectionEyebrow";

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

// Tone tags derived from prompt category, placeholder until prompts.json
// gains a real `tone` field.
function toneFor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("unstuck")) return "candid";
  if (c.includes("setup")) return "clear";
  if (c.includes("building")) return "firm";
  if (c.includes("prompting")) return "honest";
  if (c.includes("research")) return "patient";
  if (c.includes("marketing")) return "warm";
  if (c.includes("operations")) return "sober";
  if (c.includes("brand")) return "considered";
  if (c.includes("hard")) return "kind";
  return "neutral";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(body: string): string {
  // Comments first (lines starting with `# `), then headers (## / ###),
  // then strings ("..." quoted text), then variables [PLACEHOLDERS] and
  // {{var}} templates. Order matters; escape html upfront.
  let h = escapeHtml(body);
  h = h.replace(
    /(^|\n)(#\s+[^\n]+)/g,
    (_m, p, line) => `${p}<span class="cm">${line}</span>`
  );
  h = h.replace(
    /(^|\n)(##\s+[^\n]+)/g,
    (_m, p, line) => `${p}<span class="kw">${line}</span>`
  );
  h = h.replace(
    /(\{\{[A-Za-z0-9_]+\}\})/g,
    '<span class="var">$1</span>'
  );
  h = h.replace(
    /(\[[A-Z_][A-Z0-9_ \-,/]*\])/g,
    '<span class="var">$1</span>'
  );
  h = h.replace(/("[^"\n]+")/g, '<span class="str">$1</span>');
  return h;
}

function countVariables(prompt: string): number {
  const a = prompt.match(/\[[A-Z_][A-Z0-9_ \-,/]*\]/g) || [];
  const b = prompt.match(/\{\{[A-Za-z0-9_]+\}\}/g) || [];
  return new Set([...a, ...b]).size;
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
  const activeIdx = PROMPTS.findIndex((p) => p.id === active.id);
  const promptIdLabel = `P${String(activeIdx + 1).padStart(2, "0")}`;

  return (
    <section
      id="prompts"
      className="px-6 md:px-12 py-12 md:py-20 max-w-7xl mx-auto"
    >
      <Reveal>
        <div className="mb-4">
          <SectionEyebrow>Inside the workspace</SectionEyebrow>
        </div>
      </Reveal>
      <div className="section-head">
        <Reveal delay={80}>
          <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-dark)] max-w-3xl">
            {PROMPTS.length} prompts,{" "}
            <span className="headline-gradient">tuned to your voice.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="section-subhead">
            Ships with variables, runtime hints, and the rationale.
          </p>
        </Reveal>
      </div>

      <Reveal delay={240}>
        <div className="glass-card-static prompts">
          <div className="prompt-list">
            <div className="prompts-head">
              <span>Library</span>
              <span>{PROMPTS.length} · Curated</span>
            </div>
            {PROMPTS.map((p, i) => {
              const id = `P${String(i + 1).padStart(2, "0")}`;
              const tone = toneFor(p.category);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={`prompt-row ${p.id === active.id ? "active" : ""}`}
                >
                  <span className="id-num">{id}</span>
                  <span className="body">
                    <span className="ttl">{p.title}</span>
                    <span className="meta">Tone · {tone}</span>
                  </span>
                  <span className="vars-pill num-tab">
                    {countVariables(p.prompt)} vars
                  </span>
                </button>
              );
            })}
          </div>

          <div className="prompt-detail">
            <div className="head">
              <h3>
                {active.title}
                <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-cyan)]">
                  · {promptIdLabel}
                </span>
              </h3>
              <button type="button" onClick={onCopy} className="copy-pill">
                <span aria-hidden>⧉</span>
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
