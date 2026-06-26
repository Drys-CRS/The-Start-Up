import type { Metadata } from "next";
import ScopeLockForm from "@/components/ScopeLockForm";

export const metadata: Metadata = {
  title: "Start Your Scope Lock — Fixed Quote in 24 Hours",
  description:
    "Complete our short async questionnaire to lock in your scope, ship date, and price. Takes 10 minutes. We return a fixed-price proposal within 24 hours. No call required.",
  openGraph: {
    title: "Start Your Scope Lock — Fixed Quote in 24 Hours",
    description:
      "Complete our short async questionnaire to lock in your scope, ship date, and price. No call required.",
    url: "/scope-lock",
  },
};

export default function Page() { return <ScopeLockForm />; }
