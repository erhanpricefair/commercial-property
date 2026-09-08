"use client";

import InvestorForm, { type InvestorFormPrefill } from "@/components/InvestorForm";

/**
 * The registration form, placed on the page a visitor is already reading.
 *
 * Every link to /register is a click that some proportion of people don't
 * make. On a site whose main job is capturing registrations, the form belongs
 * where the traffic lands — the campaign pages already work this way, and this
 * brings the homepage, SEO pages and articles into line.
 */
export default function InlineForm({
  source,
  prefill,
  heading = "See what may suit your criteria",
  subheading = "Six quick taps, then your details. About two minutes.",
  tone = "light",
}: {
  source: string;
  prefill?: InvestorFormPrefill;
  heading?: string;
  subheading?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div id="register">
      <div className="mb-4">
        <h2
          className={`font-display text-display-sm ${tone === "dark" ? "text-canvas" : "text-ink-900"}`}
        >
          {heading}
        </h2>
        <p className={`mt-1.5 text-sm ${tone === "dark" ? "text-ink-300" : "text-ink-500"}`}>
          {subheading}
        </p>
      </div>
      <InvestorForm source={source} prefill={prefill} compact />
    </div>
  );
}
