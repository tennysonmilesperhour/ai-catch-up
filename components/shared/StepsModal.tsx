"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  content: string;
  onClose: () => void;
};

export function StepsModal({ content, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13, 10, 8, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1612",
          border: "1px solid #3a342c",
          borderLeft: "3px solid #d97757",
          padding: "32px 36px",
          maxWidth: 640,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          color: "#f5efe0",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 15,
          lineHeight: 1.6,
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1
                style={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 14,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#d97757",
                  marginBottom: 16,
                }}
              >
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2
                style={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#a99c87",
                  marginTop: 20,
                  marginBottom: 10,
                }}
              >
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p style={{ margin: "0 0 12px", color: "#e5ddd0" }}>{children}</p>
            ),
            ol: ({ children }) => (
              <ol
                style={{
                  margin: "0 0 12px 20px",
                  paddingLeft: 10,
                  color: "#e5ddd0",
                }}
              >
                {children}
              </ol>
            ),
            ul: ({ children }) => (
              <ul
                style={{
                  margin: "0 0 12px 20px",
                  paddingLeft: 10,
                  color: "#e5ddd0",
                }}
              >
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li style={{ marginBottom: 6 }}>{children}</li>
            ),
            code: ({ children }) => (
              <code
                style={{
                  background: "#2a2520",
                  padding: "2px 6px",
                  fontSize: 13,
                  fontFamily: "ui-monospace, Menlo, monospace",
                  color: "#e5a08a",
                }}
              >
                {children}
              </code>
            ),
            strong: ({ children }) => (
              <strong style={{ color: "#f5efe0" }}>{children}</strong>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        <button
          onClick={onClose}
          style={{
            marginTop: 24,
            background: "transparent",
            color: "#8a7f6b",
            border: "1px solid #3a342c",
            padding: "8px 16px",
            fontSize: 12,
            fontFamily: "ui-monospace, Menlo, monospace",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
