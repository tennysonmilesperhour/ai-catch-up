import type { Metadata, Viewport } from "next";
import { Outfit, Cormorant_Garamond, Space_Mono } from "next/font/google";
import "./globals.css";
import { RefreshBanner } from "@/components/shared/RefreshBanner";

// Display: warm modern geometric sans for headings + UI labels.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Body: organic serif with more cosmic personality than Georgia.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

// Mono: cosmic monospace for labels, code, and technical UI.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono-display",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0820",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Catch Up",
    template: "%s | AI Catch Up",
  },
  description:
    "A 60-minute AI onboarding system for the solo entrepreneur or small-team lead who became the de facto AI person by default.",
  openGraph: {
    title: "AI Catch Up",
    description:
      "A 60-minute AI onboarding system for the solo entrepreneur or small-team lead who became the de facto AI person by default.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cormorant.variable} ${spaceMono.variable}`}
    >
      <body>
        {children}
        <RefreshBanner />
      </body>
    </html>
  );
}
