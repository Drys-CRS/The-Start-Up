import type { Metadata } from "next";
import ScopeLockForm from "@/components/ScopeLockForm";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  title: "Start Your Scope Lock — Fixed Quote in 24 Hours, No Call",
  description:
    "Answer a few questions about your business and what you need built. We'll return a fixed scope, fixed price, and start date within 24 hours — fully async, no call required.",
  keywords: [
    "scope lock",
    "fixed price software quote",
    "custom CRM quote",
    "business system quote",
    "no call software development",
    "async software proposal",
    "fixed scope development",
    "Monday.com setup quote",
    "30-day build quote",
    "AI workflow quote",
  ],
  openGraph: {
    title: "Start Your Scope Lock — Fixed Quote in 24 Hours, No Call",
    description:
      "Answer a few questions and get a fixed scope, fixed price, and start date within 24 hours. Fully async — no calls required.",
    url: "/scope-lock",
    images: [{ url: "/og-image.png", width: 851, height: 315, alt: "Start Your Scope Lock — The Start Up" }],
  },
  twitter: {
    title: "Start Your Scope Lock — Fixed Quote in 24 Hours",
    description:
      "Answer a few questions, get a fixed price and start date in 24 hours. No call, no meetings.",
  },
  alternates: {
    canonical: `${siteUrl}/scope-lock`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/scope-lock#webpage`,
      url: `${siteUrl}/scope-lock`,
      name: "Start Your Scope Lock — The Start Up",
      description: "Short async questionnaire that fixes your project scope, price, and start date. Fixed-price proposal returned within 24 hours.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Scope Lock", item: `${siteUrl}/scope-lock` },
        ],
      },
    },
    {
      "@type": "ContactPage",
      "@id": `${siteUrl}/scope-lock#contactpage`,
      url: `${siteUrl}/scope-lock`,
      name: "Project Scope Lock Form",
      description: "Submit your project requirements to receive a fixed-price quote within 24 hours.",
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
      <ScopeLockForm />
    </>
  );
}
