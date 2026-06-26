import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Start Up — Custom CRM & Apps, Shipped in 30 Days",
    template: "%s | The Start Up",
  },
  description:
    "We turn your worst pipeline bottleneck into a working CRM system in 30 days — then support your team for 60–120 days. Fixed price. Free automated audit. No call required to start.",
  keywords: [
    "CRM development",
    "Monday.com implementation",
    "custom app development",
    "30-day build",
    "lead management system",
    "business automation",
    "pipeline bottleneck",
    "CRM setup South Africa",
  ],
  authors: [{ name: "The Start Up" }],
  creator: "The Start Up",
  publisher: "The Start Up",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "The Start Up",
    title: "The Start Up — Custom CRM & Apps, Shipped in 30 Days",
    description:
      "We turn your worst pipeline bottleneck into a working CRM system in 30 days — then support your team for 60–120 days. Fixed price. No call required to start.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Start Up — Custom CRM & Apps, Shipped in 30 Days",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Start Up — Custom CRM & Apps, Shipped in 30 Days",
    description:
      "We turn your worst pipeline bottleneck into a working CRM system in 30 days. Fixed price. No call required to start.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <ThemeToggle />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
