import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

// CSP allows Anthropic (BYOK browser fetch), GitHub (blog publish + connections
// test), Stripe (payment link redirect target), Google fonts (next/font).
// 'unsafe-inline' on script-src is required for Next.js hydration scripts;
// nonce-based CSP is a v1.2+ tightening. The other restrictions still cut
// the attack surface meaningfully (frame-ancestors, form-action, connect-src).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.anthropic.com https://api.github.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://buy.stripe.com",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Vercel sets HSTS at the edge for *.vercel.app; setting it here is
  // belt-and-suspenders that also covers custom domains. 1 year + preload
  // is the standard "stay HTTPS forever" stance.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CSP },
];

// Build identifier baked into the client bundle. RefreshBanner compares
// this constant (frozen at build time) against /api/version (live at
// request time) to know when the user's page is older than the server.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  `local-${Date.now()}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  poweredByHeader: false,
  // Ensure the /content/ MDX and JSON files are bundled into the serverless
  // function so loadContent/loadJson can read them at request time on Vercel.
  outputFileTracingIncludes: {
    "/**/*": ["./content/**/*"],
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withMDX(nextConfig);
