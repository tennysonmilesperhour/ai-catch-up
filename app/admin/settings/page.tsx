import { SettingsPanel } from "@/components/admin/SettingsPanel";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const env = process.env;
  const connections = [
    {
      label: "Anthropic",
      configured: Boolean(env.ANTHROPIC_API_KEY),
      manageHref: "https://console.anthropic.com/settings/keys",
    },
    {
      label: "GitHub",
      configured: Boolean(env.GITHUB_USERNAME || env.GITHUB_TOKEN),
      manageHref: "https://github.com/settings/tokens",
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
