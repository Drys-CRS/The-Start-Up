import type { Metadata } from "next";
import CRMSimulator from "@/components/CRMSimulator";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thestartup.app";

export const metadata: Metadata = {
  title: "Live System Demo — See What We Build for Your Industry",
  description:
    "Explore an interactive demo of the CRM, pipeline, and AI systems we build. Pick your industry and see exactly how your data would flow, automate, and report — before committing to anything.",
  keywords: [
    "CRM demo",
    "Monday.com CRM example",
    "pipeline management demo",
    "business system example",
    "CRM for SaaS",
    "CRM for agencies",
    "CRM for professional services",
    "recruitment CRM demo",
    "financial services CRM",
    "AI workflow demo",
    "custom business system demo",
  ],
  openGraph: {
    title: "Live System Demo — See What We Build for Your Industry",
    description:
      "Pick your industry and explore an interactive demo of the systems we build — pipeline, reporting, automation, and AI — before committing.",
    url: "/crm-demo",
    images: [{ url: "/og-image.png", width: 851, height: 315, alt: "Live System Demo — The Start Up" }],
  },
  twitter: {
    title: "Live System Demo — See What We Build for Your Industry",
    description:
      "Pick your industry and see exactly how your pipeline, automations, and AI would work. Interactive demo, no signup required.",
  },
  alternates: {
    canonical: `${siteUrl}/crm-demo`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/crm-demo#webpage`,
      url: `${siteUrl}/crm-demo`,
      name: "Live System Demo — The Start Up",
      description: "Interactive demo of the CRM, pipeline, and AI systems built by The Start Up. Select your industry to see a live example.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "System Demo", item: `${siteUrl}/crm-demo` },
        ],
      },
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
      <CRMSimulator />
    </>
  );
}
