import { SITE } from "../site";

export type LegalSection = { heading: string; paragraphs: string[]; bullets?: string[] };

/**
 * Baseline Australian-context legal copy.
 *
 * These are drafted as a sound starting point, not as legal advice. Have them
 * reviewed by your solicitor before launch, particularly the privacy policy
 * (Privacy Act 1988 / Australian Privacy Principles) and anything touching
 * real estate licensing obligations in your state.
 */

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "What this policy covers",
    paragraphs: [
      `This policy explains how ${SITE.legalName} ("we", "us") collects, uses, stores and discloses personal information collected through this website. We handle personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles.`,
    ],
  },
  {
    heading: "Information we collect",
    paragraphs: ["We collect the information you choose to give us, which typically includes:"],
    bullets: [
      "Your name, email address and phone number",
      "Your stated investment criteria — property type, budget range, preferred location, priorities, finance position and timeframe",
      "Any additional information you include in a message to us",
      "Technical information collected automatically, such as your IP address, browser type, referring page and the pages you visit on this site",
    ],
  },
  {
    heading: "How we use your information",
    paragraphs: ["We use the information you provide to:"],
    bullets: [
      "Identify commercial property opportunities that may be relevant to your stated criteria",
      "Contact you about those opportunities using the contact method you selected",
      "Respond to your enquiries",
      "Send you general commercial property information, where you have consented to receive it",
      "Improve this website and understand how visitors use it",
      "Meet our legal and regulatory obligations",
    ],
  },
  {
    heading: "Disclosure",
    paragraphs: [
      "We may disclose your personal information to service providers who help us operate this business — for example email delivery, customer relationship management and website hosting providers. These providers are engaged to handle your information only for the purposes we specify.",
      "Where an opportunity appears relevant to your criteria and you ask us to progress it, we may need to disclose your details to the relevant party in order to do so. We will make that clear to you at the time.",
      "We do not sell your personal information.",
    ],
  },
  {
    heading: "Analytics and cookies",
    paragraphs: [
      "This website may use analytics and advertising technologies, including Google Analytics and the Meta Pixel, to understand how visitors find and use the site. These tools set cookies or similar identifiers in your browser and may collect information about your visit.",
      "You can control cookies through your browser settings. Disabling cookies may affect how parts of this site function.",
    ],
  },
  {
    heading: "Storage and security",
    paragraphs: [
      "We take reasonable steps to protect personal information from misuse, interference, loss and unauthorised access, modification or disclosure. Access to investor records is restricted to authorised personnel and protected by authentication controls.",
      "No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "Access, correction and withdrawal",
    paragraphs: [
      `You may request access to the personal information we hold about you, ask us to correct it, or ask us to remove your details from our records at any time by contacting ${SITE.email}. We will respond within a reasonable period.`,
      "If you have consented to receive marketing communications, you can withdraw that consent at any time using the unsubscribe link in any email or by contacting us directly.",
    ],
  },
  {
    heading: "Complaints",
    paragraphs: [
      `If you believe we have breached the Australian Privacy Principles, please contact us at ${SITE.email} so we can investigate. If you are not satisfied with our response, you may complain to the Office of the Australian Information Commissioner at oaic.gov.au.`,
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance",
    paragraphs: [
      `By accessing or using this website you agree to these terms. If you do not agree, please do not use the site.`,
    ],
  },
  {
    heading: "Nature of this website",
    paragraphs: [
      "This website is an information and registration service. It does not publish individual property listings and it does not constitute an offer to sell, or a solicitation of an offer to buy, any property or financial product.",
      "Registering your investment criteria does not create any obligation on you to purchase anything, and does not create any obligation on us to present you with any particular opportunity.",
    ],
  },
  {
    heading: "No advice",
    paragraphs: [
      "Information on this website is general in nature. It does not take into account your objectives, financial situation or needs, and it does not constitute financial, legal, taxation or investment advice. You should obtain your own independent professional advice before making any investment decision.",
    ],
  },
  {
    heading: "Accuracy of information",
    paragraphs: [
      "We take care to ensure the general information on this website is accurate at the time of publication, but we do not warrant that it is complete, current or error-free. Market conditions, legislation and practice change.",
      "Any figures used in educational examples on this site are illustrative only. They are not tied to any specific property and should not be relied upon as an indication of any actual or expected outcome.",
    ],
  },
  {
    heading: "Information provided about opportunities",
    paragraphs: [
      "Where we provide you with information about a specific opportunity, that information is generally sourced from third parties. While we pass it on in good faith, you must verify it independently and conduct your own due diligence before making any decision.",
    ],
  },
  {
    heading: "Intellectual property",
    paragraphs: [
      `Content on this website is owned by or licensed to ${SITE.legalName} and may not be reproduced without permission, other than for your own personal, non-commercial use.`,
    ],
  },
  {
    heading: "Liability",
    paragraphs: [
      "To the maximum extent permitted by law, we exclude liability for any loss or damage arising from your use of, or reliance on, this website or its content. Nothing in these terms excludes any rights you have under the Australian Consumer Law that cannot lawfully be excluded.",
    ],
  },
  {
    heading: "Governing law",
    paragraphs: [
      "These terms are governed by the laws of Victoria, Australia, and you submit to the non-exclusive jurisdiction of the courts of that state.",
    ],
  },
];

export const DISCLAIMER_SECTIONS: LegalSection[] = [
  {
    heading: "General information only",
    paragraphs: [
      "All information on this website is general in nature. It does not take into account your objectives, financial situation or needs. It does not constitute financial, legal, taxation or investment advice and should not be relied upon as such.",
    ],
  },
  {
    heading: "No guarantees",
    paragraphs: [
      "We make no representation, warranty or guarantee that any particular outcome will be achieved. In particular, we do not guarantee:",
    ],
    bullets: [
      "That any property will produce rental income, or any particular level of rental income",
      "That any property will achieve any particular yield",
      "That any property will increase in value, or maintain its value",
      "That any tenant will remain in occupation, or continue to pay rent",
      "That any property will be able to be sold at a particular price, or within a particular timeframe",
    ],
  },
  {
    heading: "Risks",
    paragraphs: [
      "Commercial property investment involves risk. Risks include, but are not limited to: extended vacancy periods, tenant default, changes in market conditions, changes in interest rates and credit availability, unrecoverable outgoings and holding costs, capital expenditure requirements, changes in zoning or permitted use, limited liquidity, and loss of capital.",
    ],
  },
  {
    heading: "Illustrative figures",
    paragraphs: [
      "Any figures, examples or calculations shown in educational content on this website are illustrative only. They are not drawn from, and do not represent, any specific property. They should not be used as a basis for any decision.",
    ],
  },
  {
    heading: "Independent advice",
    paragraphs: [
      "You should conduct your own due diligence and obtain independent legal, financial and taxation advice appropriate to your circumstances before making any investment decision.",
    ],
  },
];
