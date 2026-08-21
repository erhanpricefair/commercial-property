import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { DISCLAIMER_SECTIONS } from "@/lib/content/legal";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Information on this website is general in nature. Commercial property involves risks and investors should obtain independent professional advice.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      intro="Please read this disclaimer carefully before relying on any information on this website."
      sections={DISCLAIMER_SECTIONS}
      updated="August 2026"
    />
  );
}
