import type { Metadata } from "next";
import CRMSimulator from "@/components/CRMSimulator";

export const metadata: Metadata = {
  title: "Live CRM System Demo — Monday.com Pipeline in Action",
  description:
    "See an interactive demo of the CRM and pipeline systems we build. Watch how leads flow from capture to close in a real Monday.com workflow — before you commit to anything.",
  openGraph: {
    title: "Live CRM System Demo — Monday.com Pipeline in Action",
    description:
      "See an interactive demo of the CRM and pipeline systems we build. Watch how leads flow from capture to close.",
    url: "/crm-demo",
  },
};

export default function Page() { return <CRMSimulator />; }
