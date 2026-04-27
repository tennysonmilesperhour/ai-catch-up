import Link from "next/link";
import { cookies } from "next/headers";
import { loadJson } from "@/lib/content";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { Prompt } from "@/components/admin/PromptsList";

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

const STATUS_PILL_CLASS: Record<Connection["status"], string> = {
  connected: "is-done",
  configured: "is-in-progress",
  missing: "is-blocked",
};

const STATUS_LABEL: Record<Connection["status"], string> = {
  connected: "Connected",
  configured: "Configured",
  missing: "Missing",
};

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const handle = session?.email?.split("@")[0] ?? "admin";

  const prompts = loadJson<Prompt[] | { prompts: Prompt[] }>(
    "admin/prompts.json"
  );
  const promptsArr = Array.isArray(prompts) ? prompts : prompts.prompts;
  const recent = promptsArr.slice(0, 4);

  const connections = checkConnections();

  return (
    <div>
      <header className="admin-header">
        <p className="label text-[var(--color-terracotta)] mb-3">
          Welcome back, {handle}
        </p>
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Workspace overview
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl">
          Where you left off, what is connected, and the prompts you are most
          likely to reach for next.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="glass-card p-6 md:p-7">
            <header className="flex items-baseline justify-between gap-4 mb-5">
              <p className="label text-[var(--color-terracotta)]">
                Project spec
              </p>
              <Link
                href="/admin/claude-md"
                className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
              >
                Open CLAUDE.md &rarr;
              </Link>
            </header>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1">
                  What you are building
                </dt>
                <dd className="text-[var(--color-dark)]">
                  AI Catch Up: a 60-minute onboarding for the de facto AI lead.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1">
                  First user
                </dt>
                <dd className="text-[var(--color-dark)]">
                  Solo entrepreneurs and small-team leads, $49 one-time.
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1">
                  Heaviest right now
                </dt>
                <dd className="text-[var(--color-dark)]">
                  Marketing site + admin polish (v1.0).
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] mb-1">
                  Stage
                </dt>
                <dd className="text-[var(--color-dark)]">
                  Pre-launch (payment + content delivery in v1.1).
                </dd>
              </div>
            </dl>
          </section>

          <section className="glass-card p-6 md:p-7">
            <header className="flex items-baseline justify-between gap-4 mb-5">
              <p className="label text-[var(--color-terracotta)]">
                Recent prompts
              </p>
              <Link
                href="/admin/prompts"
                className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
              >
                Browse all {promptsArr.length} &rarr;
              </Link>
            </header>
            <ul className="divide-y divide-[var(--color-border-light)]">
              {recent.map((p) => (
                <li
                  key={p.id}
                  className="py-3 flex items-baseline justify-between gap-4"
                >
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-terracotta)] whitespace-nowrap">
                      {p.category.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-[var(--color-dark)] truncate">
                      {p.title}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section className="glass-card p-6">
            <p className="label text-[var(--color-terracotta)] mb-4">
              Connections
            </p>
            <ul className="flex flex-col gap-3">
              {connections.map((c) => (
                <li
                  key={c.label}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-[0.10em] text-[var(--color-dark)]">
                      {c.label}
                    </p>
                    <p className="text-xs text-[var(--color-muted)] truncate">
                      {c.detail}
                    </p>
                  </div>
                  <a
                    href={c.manageHref}
                    target="_blank"
                    rel="noreferrer"
                    className={`status-pill ${STATUS_PILL_CLASS[c.status]} hover:opacity-80 transition-opacity`}
                  >
                    {STATUS_LABEL[c.status]}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card p-6">
            <p className="label text-[var(--color-terracotta)] mb-4">
              Next three moves
            </p>
            <p className="text-sm text-[var(--color-muted)] italic leading-relaxed">
              Strategy Claude has not handed off the next-three-moves widget
              yet. The Schedule and Launch Checklist tabs are the source of
              truth for now.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/admin/schedule"
                className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
              >
                Schedule &rarr;
              </Link>
              <Link
                href="/admin/checklist"
                className="font-mono text-[10px] uppercase tracking-[0.10em] text-[var(--color-muted)] hover:text-[var(--color-dark)] transition-colors"
              >
                Checklist &rarr;
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
