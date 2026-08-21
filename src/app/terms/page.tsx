import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { TERMS_SECTIONS } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply to your use of this website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="These terms apply to your access to and use of this website."
      sections={TERMS_SECTIONS}
      updated="August 2026"
    />
  );
}
