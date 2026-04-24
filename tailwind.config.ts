import type { Config } from "tailwindcss";

// Tailwind v4 reads most design tokens from the `@theme` block in
// app/globals.css. This config is kept minimal on purpose.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
};

export default config;
