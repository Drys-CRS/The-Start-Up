import type { Metadata } from "next";
import OfferPage from "@/components/OfferPage";
import { FAQS } from "@/lib/faqs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  title: "Custom CRM & Apps, Shipped in 30 Days — The Start Up",
  description:
    "We turn your worst pipeline bottleneck into a working CRM system in 30 days, then support your team for 60–120 days. Fixed price. Free automated audit. No call required.",
  openGraph: {
    title: "Custom CRM & Apps, Shipped in 30 Days",
    description:
      "We turn your worst pipeline bottleneck into a working CRM system in 30 days. Fixed price. Free automated audit. No call required to start.",
    url: "/",
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "The Start Up",
      url: siteUrl,
      description:
        "Custom CRM systems and apps, shipped in 30 days with 60–120 days of included support. Fixed price, fixed scope, no call required.",
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "30-Day CRM & Custom App Build",
      provider: { "@id": `${siteUrl}/#organization` },
      description:
        "A fully built CRM or custom app delivered in 30 days with a fixed price and fixed scope. Includes team training, handover documentation, and 60–120 days of post-delivery support.",
      offers: [
        {
          "@type": "Offer",
          name: "Promotional",
          price: "3000",
          priceCurrency: "USD",
          description:
            "30-day build with 60 days of included support. Ideal for a single focused workflow.",
        },
        {
          "@type": "Offer",
          name: "Premium",
          price: "5000",
          priceCurrency: "USD",
          description:
            "30-day build with 120 days of included support. For complex or multi-system builds.",
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
