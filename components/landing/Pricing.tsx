import { Button } from "@/components/shared/Button";

export function Pricing() {
  const paymentLink = process.env.STRIPE_PAYMENT_LINK || "#";

  return (
    <section className="px-6 md:px-12 py-16 md:py-20 max-w-5xl mx-auto">
      <div className="border border-[var(--color-border)] bg-white/40 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <p className="label text-[var(--color-muted-dark)] mb-3">Pricing</p>
          <p className="font-serif text-5xl md:text-6xl text-[var(--color-dark)] leading-none">
            $49
            <span className="text-xl md:text-2xl text-[var(--color-muted-dark)] ml-3 font-serif italic">
              one time
            </span>
          </p>
          <p className="mt-4 text-[var(--color-muted-dark)] max-w-md">
            No subscription, no upsell. Lifetime access to the onboarding and
            every update.
          </p>
        </div>
        <Button href={paymentLink} variant="primary">
          Get the onboarding
        </Button>
      </div>
    </section>
  );
}
