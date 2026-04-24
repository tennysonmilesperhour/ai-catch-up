import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  poweredByHeader: false,
  // Ensure the /content/ MDX and JSON files are bundled into the serverless
  // function so loadContent/loadJson can read them at request time on Vercel.
  outputFileTracingIncludes: {
    "/**/*": ["./content/**/*"],
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
