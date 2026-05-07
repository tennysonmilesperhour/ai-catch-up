// JSON-LD builders. Keep these as pure data functions so the components
// that render them stay tiny. We escape `</script>` defensively in the
// JsonLd component, so values can include arbitrary user-ish text without
// breaking out of the inline <script>.

import type { BlogPost } from "@/lib/blog";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ai-catch-up.vercel.app";

export const SITE_NAME = "AI Catch Up";

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    description:
      "A 60-minute AI onboarding system for the solo entrepreneur or small-team lead who became the de facto AI person by default.",
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function productJsonLd(opts: {
  price: string;
  features: string[];
  refundDays?: number;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: SITE_NAME,
    description:
      "60-minute AI onboarding for solo entrepreneurs and small-team leads. Personalized CLAUDE.md, Nexus map, 20-prompt library, starter repo, lifetime updates.",
    brand: { "@type": "Brand", name: SITE_NAME },
    url: SITE_URL,
    offers: {
      "@type": "Offer",
      price: opts.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: SITE_URL,
    },
    additionalProperty: opts.features.map((f) => ({
      "@type": "PropertyValue",
      name: "feature",
      value: f,
    })),
    ...(opts.refundDays
      ? {
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "US",
            returnPolicyCategory:
              "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: opts.refundDays,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
          },
        }
      : {}),
  };
}

export function faqPageJsonLd(
  items: { q: string; a: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function howToJsonLd(opts: {
  name: string;
  description: string;
  totalTimeIso?: string;
  steps: { name: string; text: string }[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.name,
    description: opts.description,
    ...(opts.totalTimeIso ? { totalTime: opts.totalTimeIso } : {}),
    step: opts.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function articleJsonLd(post: BlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary || undefined,
    datePublished: post.date,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };
}

// Slugify a question for use as an anchor id. Lowercases, strips
// non-alphanumerics, collapses dashes. Stable for the same input.
export function faqSlug(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
