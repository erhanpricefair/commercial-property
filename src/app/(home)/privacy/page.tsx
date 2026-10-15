import type { Metadata } from "next";
import LegalDocument from "@/components/brand/LegalDocument";
import { PRIVACY_SECTIONS } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, store and disclose personal information collected through this website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro="We handle personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles."
      sections={PRIVACY_SECTIONS}
      updated="October 2026"
    />
  );
}
