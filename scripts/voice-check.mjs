#!/usr/bin/env node
// Voice-check linter for content/**/*.{md,mdx}.
// Flags em-dashes, corporate softeners, and italics per docs/brand/anti-engineer-brief.md.
// Reports only by default (exit 0). Pass --strict to exit 1 on any finding.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");
const STRICT = process.argv.includes("--strict");

const SOFTENERS = [
  "leverage",
  "unlock",
  "elevate",
  "empower",
  "ecosystem",
  "journey",
  "solutions",
  "transform",
  "thought leader",
  "best-in-class",
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if ([".md", ".mdx"].includes(extname(entry))) out.push(full);
  }
  return out;
}

function stripFences(src) {
  return src.replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " "));
}

function findHits(file) {
  const raw = readFileSync(file, "utf8");
  const text = stripFences(raw);
  const lines = text.split("\n");
  const hits = [];

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    if (/[—–]/.test(line)) {
      hits.push({ line: lineNum, kind: "em-dash", excerpt: line.trim().slice(0, 120) });
    }

    for (const word of SOFTENERS) {
      const re = new RegExp(`\\b${word.replace(/-/g, "\\-")}\\b`, "i");
      if (re.test(line)) {
        hits.push({ line: lineNum, kind: `softener:${word}`, excerpt: line.trim().slice(0, 120) });
      }
    }

    // JSX <em>
    if (/<em\b[^>]*>/i.test(line)) {
      hits.push({ line: lineNum, kind: "italic:jsx-em", excerpt: line.trim().slice(0, 120) });
    }

    // Markdown italics: *word* or _word_, ignoring **bold** and __bold__
    // Strip bold first, then look for surviving emphasis pairs on the same line.
    const noBold = line.replace(/\*\*[^*]+\*\*/g, "").replace(/__[^_]+__/g, "");
    if (/(^|[^*\w])\*[^\s*][^*]*[^\s*]\*(?=$|[^*\w])/.test(noBold) ||
        /(^|[^_\w])_[^\s_][^_]*[^\s_]_(?=$|[^_\w])/.test(noBold)) {
      hits.push({ line: lineNum, kind: "italic:markdown", excerpt: line.trim().slice(0, 120) });
    }
  });

  return hits;
}

function main() {
  const files = walk(CONTENT);
  let total = 0;

  for (const f of files) {
    const hits = findHits(f);
    if (!hits.length) continue;
    total += hits.length;
    const rel = relative(ROOT, f);
    console.log(`\n${rel}`);
    for (const h of hits) {
      console.log(`  ${String(h.line).padStart(4)}  ${h.kind.padEnd(22)}  ${h.excerpt}`);
    }
  }

  console.log(`\nVoice-check: ${total} finding(s) across ${files.length} file(s).`);
  console.log(`Reference: docs/brand/anti-engineer-brief.md (§3 Voice).`);

  if (STRICT && total > 0) process.exit(1);
}

main();
