"use client";

import { useState } from "react";

type Props = {
  content: string;
  filename: string;
  editUrl: string;
};

export function ClaudeMdViewer({ content, filename, editUrl }: Props) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-[14px] overflow-hidden border border-[var(--color-border)] bg-[rgba(2,6,14,0.85)] shadow-2xl">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[rgba(13,28,52,0.55)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] truncate">
            {filename}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={editUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-border-dark)] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] hover:border-[var(--color-terracotta)] transition-colors"
          >
            Edit
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className={`font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border transition-colors cursor-pointer ${
              copyState === "copied"
                ? "border-[var(--color-organic)] text-[var(--color-organic)]"
                : copyState === "error"
                  ? "border-[var(--color-magenta)] text-[var(--color-magenta)]"
                  : "border-[var(--color-border-dark)] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] hover:border-[var(--color-terracotta)]"
            }`}
          >
            {copyState === "copied"
              ? "Copied"
              : copyState === "error"
                ? "Failed"
                : "Copy"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="font-mono text-[10px] uppercase tracking-[0.10em] px-3 py-1.5 rounded-[8px] border border-[var(--color-border-dark)] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] hover:border-[var(--color-terracotta)] transition-colors cursor-pointer"
          >
            Download
          </button>
        </div>
      </div>
      <pre className="px-5 md:px-7 py-6 md:py-7 font-mono text-[13px] leading-[1.65] text-[var(--color-muted-dark)] overflow-auto whitespace-pre-wrap break-words max-h-[72vh]">
        {renderMarkdown(content)}
      </pre>
    </div>
  );
}

// Lightweight inline syntax-color pass: tints headings and inline code.
// Not a full markdown parser; we keep the file as plain pre text and
// apply line-level color hints.
function renderMarkdown(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const key = `l-${i}`;
    if (/^#{1,6}\s/.test(line)) {
      return (
        <span
          key={key}
          className="text-[var(--color-cyan)] font-semibold"
        >
          {line}
          {"\n"}
        </span>
      );
    }
    if (/^```/.test(line) || /^\s{2,}/.test(line)) {
      return (
        <span key={key} className="text-[var(--color-violet)]">
          {line}
          {"\n"}
        </span>
      );
    }
    if (/^\s*[-*]\s/.test(line)) {
      return (
        <span key={key}>
          <span className="text-[var(--color-terracotta)]">
            {line.match(/^\s*[-*]/)?.[0] ?? ""}
          </span>
          {line.replace(/^\s*[-*]/, "")}
          {"\n"}
        </span>
      );
    }
    return (
      <span key={key}>
        {line}
        {"\n"}
      </span>
    );
  });
}
