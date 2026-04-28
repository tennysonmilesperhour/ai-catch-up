import { SettingsPanel } from "@/components/admin/SettingsPanel";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const VERCEL_ENV_URL =
  "https://vercel.com/tennysonmilesperhour/ai-catch-up/settings/environment-variables";

export default function SettingsPage() {
  const env = process.env;
  const connections = [
    {
      label: "Anthropic",
      configured: Boolean(env.ANTHROPIC_API_KEY),
      manageHref: "https://console.anthropic.com/settings/keys",
      provider: "anthropic" as const,
      envVar: "ANTHROPIC_API_KEY",
      vercelEnvUrl: VERCEL_ENV_URL,
      connectHint:
        "Paste a key that starts with sk-ant-. We will call /v1/models with it to confirm it works. The key is not stored here.",
    },
    {
      label: "GitHub",
      configured: Boolean(env.GITHUB_USERNAME || env.GITHUB_TOKEN),
      manageHref: "https://github.com/settings/tokens",
      provider: "github" as const,
      envVar: "GITHUB_TOKEN",
      vercelEnvUrl: VERCEL_ENV_URL,
      connectHint:
        "Paste a fine-grained personal access token (classic tokens also work). We will call /user with it to confirm it works.",
    },
    {
      label: "Vercel",
      configured: Boolean(env.VERCEL),
      manageHref: "https://vercel.com/dashboard",
    },
    {
      label: "Stripe",
      configured: Boolean(env.STRIPE_PAYMENT_LINK),
      manageHref: "https://dashboard.stripe.com/payment-links",
      provider: "stripe" as const,
      envVar: "STRIPE_SECRET_KEY",
      vercelEnvUrl: VERCEL_ENV_URL,
      connectHint:
        "If you ever add a Stripe secret key (starts with sk_test_ or sk_live_) we can validate it here. The payment link itself is just a URL and lives in STRIPE_PAYMENT_LINK.",
    },
  ];

  return (
    <div>
      <header className="admin-header">
        <p className="label text-[var(--color-terracotta)] mb-3">Settings</p>
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Tune everything.
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl">
          Changes save automatically to this device. Nothing here syncs across
          browsers in v1.0.
        </p>
      </header>
      <SettingsPanel connections={connections} />
    </div>
  );
}
