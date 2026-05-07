// Centralizes the buy-now CTA target so every "Begin onboarding" /
// "Get access" / "Unlock" button on the site behaves the same way and
// degrades gracefully when STRIPE_PAYMENT_LINK isn't configured (preview
// deploys, local dev, before Tennyson sets the prod env var).

export type CheckoutResolution = {
  /** Where the CTA should link to. */
  href: string;
  /** Whether real checkout is wired (env is set). */
  ready: boolean;
  /** Suggested button copy when checkout isn't ready (for callers that
   *  want to swap the label). */
  fallbackLabel: string;
};

export function resolveCheckout(): CheckoutResolution {
  const link = process.env.STRIPE_PAYMENT_LINK;
  if (link && /^https?:\/\//.test(link)) {
    return { href: link, ready: true, fallbackLabel: "Begin onboarding →" };
  }
  // Fallback: scroll the user to the email capture so the CTA is never
  // a dead link. The label switch hints that checkout isn't live yet.
  return { href: "/#email", ready: false, fallbackLabel: "Notify me when live" };
}
