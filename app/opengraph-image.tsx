import { ImageResponse } from "next/og";
import promptsData from "@/content/admin/prompts.json";

export const runtime = "edge";
export const alt = "AI Catch Up — a 60-minute onboarding for the de facto AI lead";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PROMPT_COUNT = Array.isArray(promptsData)
  ? promptsData.length
  : Array.isArray((promptsData as { prompts?: unknown[] }).prompts)
    ? ((promptsData as { prompts: unknown[] }).prompts.length)
    : 0;

// Generated at build time. Stays in sync with the Aurora theme: deep
// midnight bg, cyan-hairline grid, cyan→violet→magenta gradient on the
// emphasized headline, brand-mark icon box, three honest stat cells.
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #02060e 0%, #06101e 50%, #0d1c34 100%)",
          color: "#f0f4ff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Hairline grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(0deg, rgba(95, 217, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(95, 217, 255, 0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            display: "flex",
          }}
        />
        {/* Faint corner glows */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 95, 179, 0.18), transparent 65%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(95, 255, 215, 0.14), transparent 65%)",
            display: "flex",
          }}
        />

        {/* Brand mark + utility */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1.5px solid rgba(95, 255, 215, 0.55)",
              background: "rgba(2, 6, 14, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#5fffd7",
                boxShadow: "0 0 12px #5fffd7",
                display: "flex",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 16,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#f0f4ff",
              display: "flex",
            }}
          >
            AI · Catch · Up
          </div>
          <div
            style={{
              marginLeft: "auto",
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 13,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#5fffd7",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#5fffd7",
                boxShadow: "0 0 10px #5fffd7",
                display: "flex",
              }}
            />
            Live · 60-minute onboarding · v1.0
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 70,
            gap: 4,
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              color: "#f0f4ff",
              display: "flex",
            }}
          >
            You became the AI
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              color: "#f0f4ff",
              display: "flex",
            }}
          >
            person by default.
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              backgroundImage:
                "linear-gradient(110deg, #5fffd7 0%, #b9a4ff 45%, #ff5fb3 100%)",
              backgroundClip: "text",
              color: "transparent",
              display: "flex",
            }}
          >
            Build a workspace that already works.
          </div>
        </div>

        {/* Bottom stat strip */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            gap: 16,
            zIndex: 2,
          }}
        >
          {[
            { k: "Setup time", v: "60 min", d: "one sitting" },
            { k: "Prompt library", v: String(PROMPT_COUNT), d: "tuned to your voice" },
            { k: "Updates", v: "lifetime", d: "with Claude" },
          ].map((c) => (
            <div
              key={c.k}
              style={{
                flex: 1,
                padding: "16px 22px",
                borderRadius: 14,
                border: "1px solid rgba(95, 255, 215, 0.22)",
                background: "rgba(2, 6, 14, 0.55)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#7d8aad",
                  display: "flex",
                }}
              >
                {c.k}
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "#f0f4ff",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                }}
              >
                {c.v}
                <span
                  style={{
                    fontFamily: "ui-monospace, Menlo, monospace",
                    fontSize: 14,
                    letterSpacing: "0.06em",
                    color: "#5fffd7",
                  }}
                >
                  {c.d}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
