/**
 * "Commercial Property Investor Starter Guide" — the lead magnet.
 *
 * Entirely generic education. It contains no development name, no address, no
 * developer, no price tied to an identifiable property and no stock
 * information of any kind. It is served as a web page behind an email capture
 * rather than a downloadable PDF, so the content can be updated in one place
 * and nothing is ever distributed as a file we can't recall.
 */

export type GuideSection = {
  id: string;
  title: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const GUIDE_TITLE = "Commercial Property Investor Starter Guide";

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "understanding-commercial-property",
    title: "1. Understanding commercial property",
    paragraphs: [
      "Commercial property is property used for business purposes rather than housing — warehouses, industrial units, offices, shops and storage space among them. The investment case is different to residential because the income comes from a business tenant operating under a negotiated lease.",
      "That single difference drives almost everything else. The lease sets the rent, the term, who pays the outgoings and what happens at expiry. Two physically identical units with different leases can be quite different investments.",
      "Commercial property also tends to be valued on its income. Where a residential valuation leans heavily on comparable sales, a commercial valuation leans heavily on what the property earns and how secure that income looks.",
    ],
  },
  {
    id: "types",
    title: "2. Types of commercial property",
    intro: "The main categories investors encounter, and what distinguishes them.",
    bullets: [
      "Industrial and warehouse — space used for manufacturing, logistics, trades and storage. Building specification (clearance height, roller door access, power supply, parking) drives tenant demand.",
      "Small commercial units — smaller-footprint commercial space, often strata-titled within a larger complex. Frequently a lower entry price than standalone assets.",
      "Storage — smaller units used for storage rather than active business operation. Usually the smallest capital commitment in the sector.",
      "Retail — shops and food premises. Highly location-dependent and sensitive to foot traffic and surrounding tenancies.",
      "Office — from suburban suites to CBD floors. Demand patterns have shifted considerably in recent years.",
    ],
  },
  {
    id: "rental-income",
    title: "3. Rental income",
    paragraphs: [
      "Commercial rent is usually quoted annually, either as a gross figure or a net figure. Gross rent includes the outgoings; net rent excludes them. Comparing a gross figure on one property to a net figure on another will mislead you every time.",
      "Rent reviews are set out in the lease. They may be fixed percentage increases, CPI-linked, market reviews at set intervals, or a combination. The mechanism matters: a fixed 3% review behaves very differently to a market review in a soft market.",
      "Income is only as reliable as the tenant paying it. A long lease to a business under pressure is not more secure than a shorter lease to a strong one.",
    ],
  },
  {
    id: "outgoings",
    title: "4. Outgoings",
    intro: "The running costs of the property. Whether you or the tenant pays them is set by the lease.",
    bullets: [
      "Council rates",
      "Water rates and usage",
      "Building insurance",
      "Owners corporation / body corporate fees",
      "Land tax (treatment varies by state and by lease)",
      "Repairs and maintenance",
      "Management fees",
    ],
    paragraphs: [
      "Recoverable outgoings are those the tenant is required to reimburse under the lease. Non-recoverable outgoings come out of your return. Always work out the net position, and check what happens to outgoings during a vacancy — they don't stop.",
    ],
  },
  {
    id: "leases",
    title: "5. Lease considerations",
    intro: "Read the lease before you fall in love with the building.",
    bullets: [
      "Term remaining and any options to renew, and who holds them",
      "Rent review mechanism and frequency",
      "Which outgoings are recoverable and how they're apportioned",
      "Repair and maintenance obligations — particularly structural items",
      "Make-good obligations at the end of the lease",
      "Permitted use, and whether it limits your future tenant pool",
      "Bank guarantee or security deposit held, and personal guarantees",
      "Assignment and subletting rights",
      "Whether the lease is subject to retail leasing legislation, which changes the rules",
    ],
  },
  {
    id: "due-diligence",
    title: "6. Due diligence",
    bullets: [
      "Building and pest inspection appropriate to the asset type",
      "Zoning and permitted use confirmation with the local council",
      "Owners corporation records, budget, sinking fund and any special levies",
      "Lease documentation, rent roll and arrears history",
      "Title search, easements and any registered interests",
      "Compliance items — essential safety measures, fire services, disability access",
      "Environmental considerations, particularly on industrial sites",
      "Recent comparable sales and current market rents in the area",
    ],
  },
  {
    id: "finance",
    title: "7. Finance considerations",
    paragraphs: [
      "Commercial lending is assessed differently to residential lending. Deposit requirements are typically higher, loan terms are often shorter, and lenders will look closely at the lease and the tenant as well as at you.",
      "Some lenders take a different view of specialised assets — smaller storage units, for example, may attract different terms to a standard industrial unit. Talk to a broker or lender who works in commercial lending before you start looking seriously, not after you've found something.",
      "GST also works differently. Commercial property transactions commonly involve GST, and the going-concern provisions may apply where a property is sold with a tenant in place. Get advice from your accountant on this before signing.",
    ],
  },
  {
    id: "questions",
    title: "8. Questions to ask",
    bullets: [
      "What is the current rent, and is it gross or net?",
      "How long is left on the lease, and are there options?",
      "How is the rent reviewed, and when is the next review?",
      "Which outgoings are recoverable from the tenant?",
      "What are the total annual outgoings, recoverable and not?",
      "Who is the tenant and how long have they been there?",
      "What security is held under the lease?",
      "What is the permitted use, and how wide is the tenant pool if this tenant leaves?",
      "What is the owners corporation levy, and are any special levies planned?",
      "How long do comparable properties take to re-let in this area?",
      "What capital works might be required in the next five years?",
    ],
  },
  {
    id: "mistakes",
    title: "9. Common mistakes",
    bullets: [
      "Comparing a gross yield on one property to a net yield on another",
      "Treating the advertised yield as a return that will continue indefinitely",
      "Not budgeting for a vacancy period, or for the cost of re-letting",
      "Skimming the lease and focusing only on the building",
      "Assuming commercial finance works like residential finance",
      "Underestimating outgoings, particularly land tax and owners corporation levies",
      "Buying a specialised property without checking how many other tenants could use it",
      "Not obtaining independent advice because the numbers looked obvious",
    ],
  },
  {
    id: "checklist",
    title: "10. Investor checklist",
    bullets: [
      "I know my budget and I've confirmed my finance position with a lender or broker",
      "I understand whether I'm being quoted gross or net figures",
      "I've calculated the net position after all outgoings",
      "I've read the lease in full, or had it reviewed",
      "I've confirmed zoning and permitted use with the council",
      "I've reviewed the owners corporation records and budget",
      "I've considered how long I could hold the property with no tenant",
      "I understand the GST position and have spoken to my accountant",
      "I've obtained independent legal advice on the contract",
      "I understand what I'd do if the tenant left tomorrow",
    ],
  },
];

export const GUIDE_DISCLAIMER =
  "This guide is general information only. It does not take into account your objectives, financial situation or needs, and it does not constitute financial, legal, taxation or investment advice. Commercial property involves risks including vacancy, tenant default and changes in market value. You should conduct your own due diligence and obtain independent professional advice before making any investment decision.";
