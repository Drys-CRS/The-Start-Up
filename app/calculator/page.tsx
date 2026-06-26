import type { Metadata } from "next";
import LeadLeakageCalculator from "@/components/LeadLeakageCalculator";

export const metadata: Metadata = {
  title: "Free Lead Leakage Calculator — Find Your Revenue Leak",
  description:
    "Discover exactly where your sales pipeline is losing revenue. Run our free automated audit and get an AI-generated Bottleneck Report in 2 minutes — no call, no email required.",
  openGraph: {
    title: "Free Lead Leakage Calculator — Find Your Revenue Leak",
    description:
      "Discover exactly where your sales pipeline is losing revenue. Get an AI-generated Bottleneck Report in 2 minutes — no call, no email required.",
    url: "/calculator",
  },
};

export default function Page() { return <LeadLeakageCalculator />; }
