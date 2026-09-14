import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { COMPANY, LEGAL_UPDATED } from "@/lib/company";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `How cancellations and refunds work for projects with ${COMPANY.brand}.`,
  alternates: { canonical: `${SITE_URL}/refund-policy` },
};

export default function RefundPolicyPage() {
  const email = <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>;

  return (
    <LegalPage title="Refund Policy" updated={LEGAL_UPDATED}>
      <LegalSection title="Overview">
        <p>
          This policy explains how cancellations and refunds work for projects with {COMPANY.brand}, a service of{" "}
          {COMPANY.legalName}. It matches the cancellation terms in the Scope Lock Agreement you sign, and is part of
          our <Link href="/terms">Terms of Service</Link>.
        </p>
      </LegalSection>

      <LegalSection title="If you cancel before your build starts">
        <p>
          You receive a full refund of the amounts you’ve paid, minus a 10% scoping and administration fee.
        </p>
      </LegalSection>

      <LegalSection title="If you cancel after your build starts">
        <p>
          The deposit is non-refundable, and the work completed is invoiced at a pro-rata day rate.
        </p>
      </LegalSection>

      <LegalSection title="If we miss the 30-day delivery date">
        <p>
          If we miss your delivery date for reasons attributable solely to us, you receive an additional 30 days of
          support at no cost, as set out in your agreement.
        </p>
      </LegalSection>

      <LegalSection title="Monthly plan">
        <p>
          You can cancel the optional monthly plan at any time by emailing {email}. Cancellation stops charges from
          your next billing date; monthly charges already billed aren’t refunded.
        </p>
      </LegalSection>

      <LegalSection title="Third-party tools">
        <p>
          Subscriptions you pay directly to third-party providers (for example your CRM, hosting, or domain) are
          subject to those providers’ own refund policies.
        </p>
      </LegalSection>

      <LegalSection title="How to request a refund">
        <p>
          Email {email} with your reference number (it starts with “SL-”) and the email address on your agreement.
          Approved refunds are returned to your original payment method through Stripe. Banks typically take 5–10
          business days to post them.
        </p>
        <p>If you have a problem with a charge, please contact us before disputing it with your bank.</p>
      </LegalSection>
    </LegalPage>
  );
}
