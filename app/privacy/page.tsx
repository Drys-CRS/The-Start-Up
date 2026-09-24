import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { COMPANY, LEGAL_UPDATED } from "@/lib/company";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What information ${COMPANY.brand} collects, how it’s used, and the choices you have.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  const email = <a href={`mailto:${COMPANY.supportEmail}`}>{COMPANY.supportEmail}</a>;

  return (
    <LegalPage title="Privacy Policy" updated={LEGAL_UPDATED}>
      <LegalSection title="Who we are">
        <p>
          {COMPANY.brand} is a service of {COMPANY.legalName} (“we”, “us”, “our”). This policy explains what
          information we collect through this website and our services, how we use it, and the choices you have.
        </p>
      </LegalSection>

      <LegalSection title="Information you give us">
        <ul>
          <li>
            <strong>Lead Leakage Calculator:</strong> your company name, industry, email address, and the sales figures
            you enter (monthly leads, deal value, close rate, response time).
          </li>
          <li>
            <strong>Homepage tailoring:</strong> the description of your business you type in.
          </li>
          <li>
            <strong>Build Plan:</strong> your company and contact name, email address, goals, current bottleneck,
            workflow, required features, integrations, and preferred start date. If you ask us to pre-fill it from your
            website, we read that site’s publicly available text.
          </li>
          <li>
            <strong>Agreements:</strong> the name you type to sign, the resulting signature image, and when you signed.
          </li>
          <li>
            <strong>Payments:</strong> handled by Stripe. We receive your email address, the amount, and whether the
            payment succeeded. We never receive or store your full card details.
          </li>
          <li>
            <strong>Messages:</strong> anything you send us, including update requests from the status page and
            email you send to our support address. We keep a copy of our email correspondence with you, so the
            team can see the full history of your project in one place.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Information collected automatically">
        <ul>
          <li>
            <strong>Analytics:</strong> we use Vercel Web Analytics to count page views and a few steps in our sign-up
            flow (such as completing the audit or signing an agreement). It doesn’t use cookies.
          </li>
          <li>
            <strong>Security:</strong> your IP address is used briefly to limit abusive traffic, and our hosting
            provider keeps standard server logs.
          </li>
          <li>
            <strong>Preferences:</strong> your light or dark theme choice is saved in your browser.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <ul>
          <li>To generate your audit, report, and tailored content.</li>
          <li>To prepare your Build Plan, proposal, and agreement, and to deliver the project.</li>
          <li>To process payments and send receipts and status updates.</li>
          <li>
            To send a small number of follow-up reminders about a Build Plan or agreement you started. Every reminder
            includes a link to unsubscribe.
          </li>
          <li>To keep the website secure and improve it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>We share information only with the service providers that run our business on our behalf:</p>
        <ul>
          <li><strong>Vercel</strong> for hosting and analytics.</li>
          <li><strong>monday.com</strong> for storing leads and project records.</li>
          <li><strong>Supabase</strong> for our own database of submissions, project history and correspondence.</li>
          <li><strong>Stripe</strong> for payments.</li>
          <li><strong>Resend</strong> for sending email.</li>
          <li><strong>Microsoft 365</strong> for our support mailbox.</li>
          <li>
            <strong>AI model providers</strong> (currently OpenRouter, Google, and Anthropic through Vercel’s AI
            Gateway), which process the text you submit to generate reports, tailored content, and Build Plan
            suggestions.
          </li>
        </ul>
        <p>
          We may also disclose information if required by law, or as part of a merger or sale of our business. We
          don’t sell your personal information, and we don’t share it for cross-context behavioral advertising.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep lead and project records for as long as we need them to respond to you and deliver our services, and
          afterward as required for accounting, tax, and legal purposes.
        </p>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <ul>
          <li>You can ask us to access, correct, or delete your personal information by emailing {email}.</li>
          <li>You can stop reminder emails at any time using the unsubscribe link in any reminder.</li>
          <li>
            Depending on the state you live in (for example California), you may have additional rights, including the
            right to know what we’ve collected and to opt out of the sale or sharing of your information. We don’t sell
            or share it, and we won’t treat you differently for exercising your rights.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use encrypted connections and restrict access to your information to the people and providers who need it.
          No method of transmission or storage is completely secure, but we work to protect your information.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>Our website and services are for businesses and aren’t directed to children under 13.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We may update this policy from time to time. The date at the top shows the current version.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions or requests about your information? Email {email}.</p>
      </LegalSection>
    </LegalPage>
  );
}
