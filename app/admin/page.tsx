import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadJson } from "@/lib/content";
import { listPosts } from "@/lib/blog";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { Prompt } from "@/components/admin/PromptsList";
import { SuggestedMoves } from "@/components/admin/SuggestedMoves";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

type Connection = {
  label: string;
  status: "connected" | "configured" | "missing";
  detail: string;
  manageHref: string;
};

function checkConnections(): Connection[] {
  const env = process.env;
  return [
    {
      label: "Anthropic",
      status: env.ANTHROPIC_API_KEY ? "connected" : "missing",
      detail: env.ANTHROPIC_API_KEY ? "API key set" : "API key missing",
      manageHref: "https://console.anthropic.com/settings/keys",
    },
    {
      label: "GitHub",
      status: env.GITHUB_USERNAME || env.GITHUB_TOKEN ? "connected" : "missing",
      detail:
        env.GITHUB_USERNAME
          ? `synced as ${env.GITHUB_USERNAME}`
          : env.GITHUB_TOKEN
            ? "token set"
            : "username/token missing",
      manageHref: "https://github.com/settings/tokens",
    },
    {
      label: "Vercel",
      status: env.VERCEL ? "connected" : "configured",
      detail: env.VERCEL_GIT_COMMIT_SHA
        ? `deployed ${env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
        : env.VERCEL
          ? "deployed"
          : "local dev",
      manageHref: "https://vercel.com/dashboard",
    },
    {
      label: "Stripe",
      status: env.STRIPE_PAYMENT_LINK ? "configured" : "missing",
      detail: env.STRIPE_PAYMENT_LINK
        ? "payment link set"
        : "payment link missing",
      manageHref: "https://dashboard.stripe.com/payment-links",
    },
  ];
}

const STATUS_DOT_CLASS: Record<Connection["status"], string> = {
  connected: "bg-[var(--color-organic)] shadow-[0_0_8px_var(--color-organic)]",
  configured: "bg-[var(--color-cyan)] shadow-[0_0_8px_var(--color-cyan)]",
  missing: "bg-[var(--color-magenta)] shadow-[0_0_8px_var(--color-magenta)]",
};

// Tag colors keyed off the first three letters of the prompt category, so
// the same WRT/PLN/DBG pattern from the reference shows up automatically.
const TAG_PALETTE: Record<string, string> = {
  WRT: "var(--color-terracotta)",
  PLN: "var(--color-cyan)",
  DBG: "var(--color-magenta)",
  IDE: "var(--color-violet)",
  COD: "var(--color-organic)",
  PRO: "var(--color-rust)",
};

function tagColor(category: string): string {
  const key = category.slice(0, 3).toUpperCase();
  return TAG_PALETTE[key] ?? "var(--color-muted-dark)";
}

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // Buyers (non-admin authed users) get bounced to their own home
  // (Pulse). The Overview below is Tennyson's vendor-side workspace
  // dashboard; buyers shouldn't see project spec / connections / blog
  // post status. Middleware also handles this redirect, but having it
  // server-side here keeps the rule co-located with the page that
  // owns the role-specific content.
  if (session && session.role !== "admin") {
    redirect("/admin/pulse");
  }

  const handle = session?.email?.split("@")[0] ?? "admin";

  const prompts = loadJson<Prompt[] | { prompts: Prompt[] }>(
    "admin/prompts.json"
  );
  const promptsArr = Array.isArray(prompts) ? prompts : prompts.prompts;
  const recent = promptsArr.slice(0, 4);

  const decisions = loadJson<unknown[] | { decisions: unknown[] }>(
    "admin/decisions.json"
  );
  const decisionsCount = Array.isArray(decisions)
    ? decisions.length
    : decisions.decisions?.length ?? 0;

  const connections = checkConnections();
  const posts = listPosts();
  const lastPost = posts[0];

  return (
    <div className="max-w-7xl">
      <header className="mb-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
          AI Catch Up / Overview
        </p>
        <p className="label text-[var(--color-terracotta)] mt-8 mb-4">
          Welcome back, {handle}
        </p>
        <h1 className="font-display text-3xl md:text-5xl leading-[1.05] text-[var(--color-dark)]">
          Your workspace,{" "}
          <span className="headline-gradient">still warm.</span>
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl mt-4 leading-relaxed">
          Where you left off, what is connected, and the prompts you are most
          likely to reach for next.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Project spec */}
          <section className="glass-card p-6 md:p-7">
            <header className="flex items-baseline gap-2 mb-6">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-terracotta)]"
                aria-hidden
              />
              <h2 className="font-display text-base text-[var(--color-dark)]">
                Project spec
              </h2>
            </header>
            <dl className="flex flex-col gap-5">
              <SpecRow
                label="What you're building"
                value="AI Catch Up: a 60-minute onboarding for the de facto AI lead."
              />
              <SpecRow
                label="First user"
                value="Solo entrepreneurs and small-team leads, $49 one-time."
              />
              <SpecRow
                label="Heaviest right now"
                value="Marketing site + admin polish (v1.0)."
                accent
              />
              <SpecRow
                label="Stage"
                value="Pre-launch. Payment + content delivery in v1.1."
              />
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/admin/claude-md"
                className="font-mono text-[10px] uppercase tracking-[0.10em] px-4 py-2 rounded-[8px] border border-[var(--color-terracotta)] text-[var(--color-terracotta)] hover:bg-[rgba(251,191,36,0.08)] transition-colors"
              >
                Open CLAUDE.md &rarr;
              </Link>
              <Link
                href="/admin/plan"
                className="font-mono text-[10px] uppercase tracking-[0.10em] px-4 py-2 rounded-[8px] border border-[var(--color-border-dark)] text-[var(--color-muted-dark)] hover:text-[var(--color-dark)] hover:border-[var(--color-terracotta)] transition-colors"
              >
                Edit spec
              </Link>
            </div>
          </section>

          {/* Recent prompts */}
          <section className="glass-card p-6 md:p-7">
            <header className="flex items-baseline justify-between gap-2 mb-5">
              <div className="flex items-baseline gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-terracotta)]"
                  aria-hidden
                />
                <h2 className="font-display text-base text-[var(--color-dark)]">
                  Recent prompts
                </h2>
              </div>
            </header>
            <ul className="flex flex-col">
              {recent.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 py-2.5 first:pt-0 border-b border-[var(--color-border-light)] last:border-b-0"
                >
                  <div className="flex items-baseline gap-3 min-w-0 flex-1">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.10em] whitespace-nowrap w-8 shrink-0"
                      style={{ color: tagColor(p.category) }}
                    >
                      {p.category.slice(0, 3).toUpperCase()}
                    </span>
                    <Link
                      href="/admin/prompts"
                      className="text-[var(--color-dark)] truncate hover:text-[var(--color-terracotta)] transition-colors"
                    >
                      {p.title}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href="/admin/prompts"
              className="inline-block mt-5 font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted-dark)] hover:text-[var(--color-terracotta)] transition-colors"
            >
              Browse all {promptsArr.length} &rarr;
            </Link>
          </section>
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-6">
          {/* Connections */}
          <section className="glass-card p-6">
            <header className="flex items-baseline gap-2 mb-5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)]"
                aria-hidden
              />
              <h2 className="font-display text-base text-[var(--color-dark)]">
                Connections
              </h2>
            </header>
            <ul className="flex flex-col gap-3">
              {connections.map((c) => (
                <li
                  key={c.label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden
                      className={`w-2 h-2 rounded-full ${STATUS_DOT_CLASS[c.status]}`}
                    />
                    <span className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--color-dark)]">
                      {c.label}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.04em] text-[var(--color-muted)] truncate ml-2">
                    {c.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Next three moves — heuristic-driven via SuggestedMoves */}
          <section className="glass-card p-6">
            <header className="flex items-baseline gap-2 mb-5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)]"
                aria-hidden
              />
              <h2 className="font-display text-base text-[var(--color-dark)]">
                Next three moves
              </h2>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                heuristic
              </span>
            </header>
            <SuggestedMoves
              promptsCount={promptsArr.length}
              decisionsCount={decisionsCount}
            />
          </section>

          {/* This week stats */}
          <section className="glass-card p-6">
            <header className="flex items-baseline gap-2 mb-4">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)]"
                aria-hidden
              />
              <h2 className="font-display text-base text-[var(--color-dark)]">
                This week
              </h2>
            </header>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Prompts in library" value={String(promptsArr.length)} accent="amber" />
              <Stat
                label="Posts published"
                value={String(posts.length)}
                accent="cyan"
              />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] mt-5">
              Live tracking: TODO
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SpecRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "border-l-2 border-[var(--color-cyan)] pl-3 -ml-3" : ""}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1.5">
        {label}
      </dt>
      <dd className="text-[var(--color-dark)] leading-relaxed">{value}</dd>
    </div>
  );
}

function MoveRow({
  eyebrow,
  body,
  href,
}: {
  eyebrow: string;
  body: string;
  href: string;
}) {
  return (
    <li>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1">
        {eyebrow}
      </p>
      <Link
        href={href}
        className="text-sm text-[var(--color-dark)] leading-relaxed hover:text-[var(--color-terracotta)] transition-colors"
      >
        {body}
      </Link>
    </li>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "amber" | "cyan";
}) {
  const color =
    accent === "amber" ? "var(--color-terracotta)" : "var(--color-cyan)";
  return (
    <div>
      <p
        className="font-display text-3xl md:text-4xl font-bold leading-none"
        style={{ color }}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)] mt-2">
        {label}
      </p>
    </div>
  );
}
