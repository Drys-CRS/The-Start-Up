import type { Metadata } from "next";
import OfferPage from "@/components/OfferPage";
import { FAQS } from "@/lib/faqs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  title: "Business Systems & AI for Any Sector — Built in 30 Days",
  description:
    "We help businesses of every kind grow — through custom CRM systems, intelligent workflows, and AI built in 30 days. Fixed price. Free automated audit. No call required.",
  keywords: [
    "custom CRM system",
    "business systems AI",
    "workflow automation",
    "platform-agnostic CRM setup",
    "30-day app build",
    "business growth AI",
    "pipeline management",
    "custom software South Africa",
    "business process automation",
    "AI agents for business",
  ],
  openGraph: {
    title: "Business Systems & AI for Any Sector — Built in 30 Days",
    description:
      "Custom systems, workflows, and AI for any business — built in 30 days, fixed price. Free audit reveals exactly what to build.",
    url: "/",
    images: [{ url: "/og-image.png", width: 851, height: 315, alt: "The Start Up" }],
  },
  twitter: {
    title: "Business Systems & AI for Any Sector — Built in 30 Days",
    description:
      "Custom systems, workflows, and AI for any business — built in 30 days, fixed price. Free automated audit.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "The Start Up",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "The Start Up",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo-light.png`,
        width: 1920,
        height: 1080,
      },
      description:
        "We help businesses of every kind grow through custom systems, intelligent workflows, and AI — built in 30 days with a fixed price and 60–120 days of included support.",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        availableLanguage: ["English"],
      },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "30-Day Business System Build",
      provider: { "@id": `${siteUrl}/#organization` },
      serviceType: "Custom Software Development",
      areaServed: ["ZA", "US", "GB"],
      description:
        "A fully built CRM, custom app, or AI-backed workflow system delivered in 30 days with a fixed price and fixed scope. Includes team training, handover documentation, and 60–120 days of post-delivery support.",
      offers: [
        {
          "@type": "Offer",
          name: "Promotional",
          price: "1500",
          priceCurrency: "USD",
          availability: "https://schema.org/LimitedAvailability",
          description:
            "50% off special (was $3,000, ends 30 Sep 2026). 30-day build with 60 days of included support. Ideal for a single focused workflow.",
        },
        {
          "@type": "Offer",
          name: "Premium",
          price: "2500",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description:
            "50% off special (was $5,000, ends 30 Sep 2026). 30-day build with 120 days of included support. For complex or multi-system builds.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      })),
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
      <OfferPage />
    </>
  );
}
