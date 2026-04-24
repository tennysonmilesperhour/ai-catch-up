import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  // Ensure the /content/ MDX and JSON files are bundled into the serverless
  // function so loadContent/loadJson can read them at request time on Vercel.
  outputFileTracingIncludes: {
    "/**/*": ["./content/**/*"],
  },
};

export default withMDX(nextConfig);
