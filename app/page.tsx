import type { Metadata } from "next";
import OfferPage from "@/components/OfferPage";
import { getFaqs } from "@/lib/faqs";
import { EARLY_OFFER, PROMO_ENDS_LABEL, priceFor, usd } from "@/lib/pricing";
import { SITE_URL as siteUrl } from "@/lib/site";

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
    // Must be repeated: a page-level twitter block replaces the layout's, so
    // omitting card silently downgrades the preview to the small "summary" card.
    card: "summary_large_image",
    title: "Business Systems & AI for Any Sector — Built in 30 Days",
    description:
      "Custom systems, workflows, and AI for any business — built in 30 days, fixed price. Free automated audit.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

function buildJsonLd() {
  const build = priceFor("promo");
  return {
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
          name: "30-Day Build",
          price: String(build.total),
          priceCurrency: "USD",
          availability: "https://schema.org/LimitedAvailability",
          priceValidUntil: build.early
            ? new Date(EARLY_OFFER.endsAt).toISOString().slice(0, 10)
            : "2026-10-31",
          description: build.early
            ? `${usd(EARLY_OFFER.offUsd)} off the ${usd(build.standard)} half-price rate for agreements signed on or before ${EARLY_OFFER.deadlineLabel}. One flat build fee covering a 30-day build with 60 days of free support, with a payment plan included: ${usd(build.deposit)} to start, ${usd(build.mvp)} on MVP plan approval, ${usd(build.balance)} on delivery. An optional $150/month retainer and third-party tools are billed separately.`
            : `50% off special (was ${usd(build.list)}, ends ${PROMO_ENDS_LABEL}). One flat build fee covering a 30-day build with 60 days of free support, with a payment plan included: ${usd(build.deposit)} to start, ${usd(build.mvp)} on MVP plan approval, ${usd(build.balance)} on delivery. An optional $150/month retainer and third-party tools are billed separately.`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: getFaqs().map(({ q, a }) => ({
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
}

// Revalidate so the early-signing offer actually expires on a static page
// instead of staying frozen at whatever was true at build time.
export const revalidate = 900;

export default function Page() {
  const jsonLd = buildJsonLd();
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
