import type { Metadata } from "next";
import LeadLeakageCalculator from "@/components/LeadLeakageCalculator";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  title: "Free Lead Leakage Calculator — Find Your Revenue Leak in 2 Minutes",
  description:
    "Discover exactly where your sales pipeline is losing revenue. Enter four numbers and get an instant AI-generated Bottleneck Report — free, no call, no email required.",
  keywords: [
    "lead leakage calculator",
    "sales pipeline audit",
    "revenue leak calculator",
    "free CRM audit",
    "bottleneck report",
    "pipeline efficiency tool",
    "sales conversion rate calculator",
    "lead response time impact",
    "AI pipeline analysis",
    "free business audit",
  ],
  openGraph: {
    title: "Free Lead Leakage Calculator — Find Your Revenue Leak in 2 Minutes",
    description:
      "How much revenue is your pipeline leaking? Enter four numbers and get an instant AI Bottleneck Report — free and instant.",
    url: "/calculator",
    images: [{ url: "/og-image.png", width: 851, height: 315, alt: "Lead Leakage Calculator — The Start Up" }],
  },
  twitter: {
    title: "Free Lead Leakage Calculator — Find Your Revenue Leak",
    description:
      "Enter four numbers, get an instant AI Bottleneck Report. Free. No call required.",
  },
  alternates: {
    canonical: `${siteUrl}/calculator`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/calculator#webpage`,
      url: `${siteUrl}/calculator`,
      name: "Free Lead Leakage Calculator",
      description: "Discover exactly where your sales pipeline is losing revenue. Get an instant AI-generated Bottleneck Report in 2 minutes.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Lead Leakage Calculator", item: `${siteUrl}/calculator` },
        ],
      },
    },
    {
      "@type": "SoftwareApplication",
      name: "Lead Leakage Calculator",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "A free tool that calculates how much revenue your pipeline is losing to slow lead response times, then generates an AI-powered Bottleneck Report.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      provider: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LeadLeakageCalculator />
    </>
  );
}
