"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

type Props = {
  placeholder?: string;
  buttonLabel?: string;
  successMessage?: string;
  tone?: "light" | "dark";
};

export function EmailCaptureForm({
  placeholder = "you@example.com",
  buttonLabel = "Notify me",
  successMessage = "Thanks, you are on the list.",
  tone = "light",
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isDark = tone === "dark";
  const inputBorder = isDark
    ? "border-[var(--color-border-dark)]"
    : "border-[var(--color-border)]";
  const inputBg = isDark
    ? "bg-[rgba(26,18,64,0.45)]"
    : "bg-[rgba(26,18,64,0.35)]";
  const inputText =
    "text-[var(--color-dark)] placeholder:text-[var(--color-muted)]";

  if (status === "success") {
    return (
      <p className="font-mono text-sm text-[var(--color-dark)]">
        {successMessage}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 px-4 py-3 border ${inputBorder} ${inputBg} ${inputText} font-serif text-base rounded-md focus:outline-none focus:border-[var(--color-terracotta)]`}
        disabled={status === "submitting"}
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="glass-button-primary px-6 py-3 font-mono text-sm uppercase tracking-[0.08em] disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : buttonLabel}
      </button>
      {error && (
        <p className="font-mono text-xs text-[var(--color-rust)] mt-1 sm:ml-2 sm:mt-3">
          {error}
        </p>
      )}
    </form>
  );
}
