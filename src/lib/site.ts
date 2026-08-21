/**
 * Site-wide configuration. Everything visitor-facing is deliberately generic:
 * no developer, project, or property identity appears anywhere in this file,
 * and nothing here is derived from the private opportunity database.
 */

export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Commercial Investor Access",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME ?? "Investor Access",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com.au").replace(/\/$/, ""),
  tagline: "Access selected commercial property investment opportunities.",
  description:
    "Register your investment criteria and we'll identify commercial property opportunities that may suit your budget, strategy and objectives.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "invest@example.com.au",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  region: "Melbourne, Victoria",
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "Commercial Investor Access",
  abn: process.env.NEXT_PUBLIC_ABN ?? "",
} as const;

export const DISCLAIMER_SHORT =
  "Information provided is general in nature and does not constitute financial, legal or investment advice.";

export const DISCLAIMER_FULL =
  "Information provided on this website is general in nature and does not constitute financial, legal or investment advice. It does not take into account your objectives, financial situation or needs. Commercial property involves risks, including vacancy, tenant default, changes in market conditions and changes in value. Investors should conduct their own due diligence and obtain independent professional advice before making an investment decision. No representation is made that any particular outcome, rental income, yield or capital growth will be achieved.";

/** Canonical primary and secondary calls to action, used site-wide. */
export const CTA = {
  primary: { label: "See Current Opportunities", href: "/register" },
  secondary: { label: "How It Works", href: "/how-it-works" },
  register: { label: "Register for Investor Access", href: "/register" },
  guide: { label: "Get the Investor Starter Guide", href: "/guide" },
} as const;
