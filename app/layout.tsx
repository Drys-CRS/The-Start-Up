import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Start Up — Business Systems & AI, Shipped in 30 Days",
    template: "%s | The Start Up",
  },
  description:
    "We help businesses of every kind grow — through custom systems, intelligent workflows, and AI built in 30 days. Fixed price. Free automated audit. No call required to start.",
  keywords: [
    "custom CRM development",
    "platform-agnostic implementation",
    "business systems development",
    "workflow automation",
    "AI business tools",
    "custom app development",
    "30-day build",
    "business process automation",
    "pipeline management system",
    "CRM setup South Africa",
    "business growth systems",
    "AI workflow automation",
  ],
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  authors: [{ name: "The Start Up" }],
  creator: "The Start Up",
  publisher: "The Start Up",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "The Start Up",
    title: "The Start Up — Business Systems & AI, Shipped in 30 Days",
    description:
      "We help businesses of every kind grow through custom systems, intelligent workflows, and AI — built in 30 days, fixed price. No call required to start.",
    images: [
      {
        url: "/og-image.png",
        width: 851,
        height: 315,
        alt: "The Start Up — Business Systems & AI, Shipped in 30 Days",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Start Up — Business Systems & AI, Shipped in 30 Days",
    description:
      "Custom systems, workflows, and AI for any business — built in 30 days, fixed price. Free automated audit. No call required.",
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
