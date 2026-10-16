/**
 * Site-wide configuration. Everything visitor-facing is deliberately generic:
 * no developer, project, or property identity appears anywhere in this file,
 * and nothing here is derived from the private opportunity database.
 */

const BRAND = process.env.NEXT_PUBLIC_SITE_NAME ?? "NewPF";

/**
 * Who the business legally is. The owner holds an individual estate agent's
 * licence (not a company licence), so the business is the owner trading as
 * NewPF — not NewPF Business Group Pty Ltd. Set NEXT_PUBLIC_LICENSEE_NAME to
 * the name exactly as it appears on the licence; until then the site and
 * emails identify the business as the brand alone.
 */
const LICENSEE = process.env.NEXT_PUBLIC_LICENSEE_NAME || "Erhan Seyit";

export const SITE = {
  // Trading under the company's own name: no separate business name to
  // register, and nothing in the name implying the business is a builder.
  name: BRAND,
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME ?? "NewPF",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.newpfproperty.com.au").replace(/\/$/, ""),
  tagline: "Access selected commercial property investment opportunities.",
  description:
    "Register your investment criteria and we'll identify commercial property opportunities that may suit your budget, strategy and objectives.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "erhan@newpfproperty.com.au",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "0412 430 920",
  region: "Melbourne, Victoria",
  /** The licensed individual, when set. */
  licenseeName: LICENSEE,
  /** The name the business is identified by in policies, footers and emails. */
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME || LICENSEE || BRAND,
  /** How the business names itself in prose: "Jane Citizen trading as NewPF". */
  identity:
    LICENSEE && LICENSEE !== BRAND && !process.env.NEXT_PUBLIC_LEGAL_NAME
      ? `${LICENSEE} trading as ${BRAND}`
      : process.env.NEXT_PUBLIC_LEGAL_NAME || LICENSEE || BRAND,
  abn: process.env.NEXT_PUBLIC_ABN ?? "",
  /** Estate agent licence number, shown in the footer and on every email. */
  licence: process.env.NEXT_PUBLIC_AGENT_LICENCE || "092111L",
} as const;

export const DISCLAIMER_SHORT =
  "Information provided is general in nature and does not constitute financial, legal or investment advice.";

export const DISCLAIMER_FULL =
  "Information provided on this website is general in nature and does not constitute financial, legal or investment advice. It does not take into account your objectives, financial situation or needs. Commercial property involves risks, including vacancy, tenant default, changes in market conditions and changes in value. Investors should conduct their own due diligence and obtain independent professional advice before making an investment decision. No representation is made that any particular outcome, rental income, yield or capital growth will be achieved.";

/** Canonical primary and secondary calls to action, used site-wide. */
export const CTA = {
  primary: { label: "Register Your Criteria", href: "/register" },
  secondary: { label: "How It Works", href: "/how-it-works" },
  register: { label: "Register for Investor Access", href: "/register" },
  guide: { label: "Get the Investor Starter Guide", href: "/guide" },
} as const;
