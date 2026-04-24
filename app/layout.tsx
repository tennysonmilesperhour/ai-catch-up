import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RefreshBanner } from "@/components/shared/RefreshBanner";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#faf7f2",
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
    <html lang="en">
      <body>
        {children}
        <RefreshBanner />
      </body>
    </html>
  );
}
