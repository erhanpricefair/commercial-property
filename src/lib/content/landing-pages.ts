/**
 * SEO landing pages — one entry per intent-targeted URL.
 *
 * Every page here targets a SEARCH INTENT, never an individual property. The
 * copy is generic education plus a registration CTA. Nothing on these pages is
 * read from the private opportunity database, and no development name, address
 * or stock figure appears in any of it.
 *
 * Any numeric example is explicitly labelled as illustrative and is not tied to
 * a real property.
 */

export type FaqItem = { q: string; a: string };

export type LandingPage = {
  slug: string;
  art: "warehouse" | "industrial" | "storage" | "commercial" | "streetscape";
  eyebrow: string;
  h1: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  /** Editorial body, rendered in order. */
  sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
  faqs: FaqItem[];
  related: string[];
};

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "commercial-property-investment-melbourne",
    art: "streetscape",
    eyebrow: "Melbourne",
    h1: "Commercial Property Investment in Melbourne",
    intro:
      "Melbourne's commercial market covers everything from small strata units in the suburbs to large industrial facilities in the outer growth corridors. What suits you depends on your budget, your objectives and how hands-on you want to be.",
    metaTitle: "Commercial Property Investment Melbourne | Investor Access",
    metaDescription:
      "Considering commercial property investment in Melbourne? Understand the market, the asset types and the risks — then register your criteria to receive opportunities that may suit.",
    sections: [
      {
        heading: "What the Melbourne commercial market looks like",
        paragraphs: [
          "Melbourne's commercial property market is not one market. Industrial and warehouse space in the north and west behaves differently to suburban retail, which behaves differently again to office space in the inner city. Demand drivers, tenant profiles and price points vary considerably between them.",
          "For investors entering the sector, the industrial and small-commercial segments tend to be where the accessible price points sit. Smaller strata units — warehouses, workshops and storage-style space within a larger complex — can be found at entry prices closer to a residential investment, while standalone industrial facilities require considerably more capital.",
          "Location within Melbourne matters as much as asset type. Access to freeways and ports, proximity to established industrial precincts, and the depth of the local business base all influence how easily a property can be tenanted.",
        ],
      },
      {
        heading: "What Melbourne investors typically consider",
        bullets: [
          "Which precinct suits the tenant type they want to attract",
          "How the property is zoned and what uses are permitted",
          "Whether the building specification matches what local tenants actually need",
          "The owners corporation position where the property is strata-titled",
          "How long comparable properties in the area take to lease",
          "Land tax and outgoings, which vary considerably by property and by holding structure",
        ],
      },
      {
        heading: "Entry price points",
        paragraphs: [
          "Investors are often surprised by how wide the range is. Smaller storage-style and compact commercial units can sit at the lower end of the market, while larger warehouse and industrial facilities move well past the seven-figure mark.",
          "Rather than guessing, it is usually more productive to state your budget and let someone who is watching the market tell you what is realistic within it. That is what the registration form on this site is for.",
        ],
      },
      {
        heading: "Risks specific to commercial",
        paragraphs: [
          "Commercial property in Melbourne carries the same risks as commercial property anywhere: vacancy, tenant default, unrecoverable outgoings, capital expenditure and changes in market value. Re-letting a commercial property typically takes longer than re-letting a house, and a specialised property may suit a narrower pool of tenants.",
          "Investors should consider how long they could comfortably hold a property with no rental income at all, and should obtain independent advice before committing.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do I need to invest in commercial property in Melbourne?",
        a: "There is no single answer — entry prices vary widely by asset type, size and location. Smaller storage and compact commercial units sit at the lower end of the market, while larger industrial facilities require substantially more capital. Your lending capacity and deposit requirements will also shape what is realistic, and commercial lending terms differ from residential lending.",
      },
      {
        q: "Is commercial property better than residential property?",
        a: "Neither is inherently better. They behave differently — different lease structures, different tenant pools, different vacancy patterns, different finance. Which suits you depends on your objectives, your risk tolerance and your circumstances. You should obtain independent advice.",
      },
      {
        q: "Do you publish a list of available properties?",
        a: "No. We don't publish listings or distribute stock lists. Register your criteria and we'll contact you if something currently available appears relevant to what you're looking for.",
      },
    ],
    related: ["/warehouse-investment-melbourne", "/commercial-property-under-500k", "/commercial-property-melbourne"],
  },
  {
    slug: "commercial-property-under-500k",
    art: "commercial",
    eyebrow: "Entry Price",
    h1: "Commercial Property Investment Opportunities Under $500,000",
    intro:
      "A common starting question: what can you actually buy in commercial property under half a million dollars? The honest answer is that it depends on the asset type and the location — but the segment does exist, and it's where many investors make their first commercial purchase.",
    metaTitle: "Commercial Property Under $500,000 | Investment Opportunities",
    metaDescription:
      "What can you buy in commercial property under $500,000? Understand the asset types, the trade-offs and the risks, then register your criteria to receive relevant opportunities.",
    sections: [
      {
        heading: "What sits in this price bracket",
        paragraphs: [
          "Under $500,000, investors are generally looking at smaller-footprint assets rather than standalone buildings. In practice that usually means strata-titled units within a larger complex — compact warehouses, workshops, storage-style units and small commercial suites.",
          "These properties are typically part of an owners corporation, which changes what you're buying. You own your unit and share the common property, the insurance and the maintenance obligations with the other owners. The owners corporation records are as worth reading as the lease.",
        ],
      },
      {
        heading: "The trade-offs at this price point",
        bullets: [
          "Smaller units usually mean smaller absolute rental income, though the yield may or may not differ from larger assets",
          "Strata means owners corporation levies, and potentially special levies for capital works",
          "The tenant pool for a small specialised unit can be narrower than for a flexible general-purpose space",
          "Some lenders treat smaller and more specialised commercial assets differently, which can affect deposit requirements and loan terms",
          "Entry cost is lower, but transaction costs — stamp duty, legal, due diligence — do not scale down proportionally",
        ],
      },
      {
        heading: "What to check before you buy at this level",
        bullets: [
          "The owners corporation budget, sinking fund and any planned special levies",
          "Total annual outgoings, and which of them are recoverable from a tenant",
          "The permitted use and how wide the resulting tenant pool is",
          "Access, parking and clearance — the practical things a tenant actually needs",
          "How long comparable units in the same complex or precinct take to lease",
          "Whether the complex is dominated by owner-occupiers or investors, and what that means at resale",
        ],
      },
      {
        heading: "A note on advertised yields",
        paragraphs: [
          "At this price point you will often see attractive-looking yield figures quoted. Treat them carefully. A yield is simply income divided by price at a point in time — it says nothing about whether the income will continue, whether the figure is gross or net, or what happens when the current lease expires.",
          "Always work out the net position after all outgoings, and always ask what happens if the tenant leaves.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can you really buy commercial property under $500,000?",
        a: "Yes, that segment exists — typically smaller strata-titled units rather than standalone buildings. What is available at any given time varies. Register your criteria and we'll tell you whether anything currently available fits your budget.",
      },
      {
        q: "Is a cheaper commercial property riskier?",
        a: "Not automatically, but the risks are different. Smaller and more specialised properties can have a narrower tenant pool, and owners corporation obligations add a layer that standalone assets don't have. Assess each property on its own merits and obtain independent advice.",
      },
      {
        q: "What deposit do I need?",
        a: "Commercial lending typically requires a larger deposit than residential lending, and terms vary by lender and by asset type. Speak to a broker or lender who works in commercial lending before you start looking seriously.",
      },
    ],
    related: ["/small-commercial-property-investment", "/storage-property-investment", "/commercial-property-investment-melbourne"],
  },
  {
    slug: "warehouse-investment-melbourne",
    art: "warehouse",
    eyebrow: "Warehouse",
    h1: "Warehouse Investment in Melbourne",
    intro:
      "Warehouses are among the most straightforward commercial assets to understand: functional space, leased to a business, valued largely on its income. That simplicity is part of the appeal — but the detail still decides whether a particular warehouse is a good investment.",
    metaTitle: "Warehouse Investment Melbourne | Commercial Property for Investors",
    metaDescription:
      "Considering a warehouse investment in Melbourne? Understand building specification, lease structures, tenant demand and the risks — then register your criteria.",
    sections: [
      {
        heading: "Why investors look at warehouses",
        paragraphs: [
          "Warehouse and industrial space is used by businesses that need to store, make, distribute or service something. Demand is tied to activity in those sectors rather than to housing demand, which is part of why investors consider it as a diversification play.",
          "Warehouses are also relatively simple buildings. There is less to go wrong in a shed than in a multi-tenanted office, and maintenance obligations under an industrial lease often sit more heavily with the tenant. That said, structural obligations usually remain with the owner, and roofs are expensive.",
        ],
      },
      {
        heading: "Building specification drives tenant demand",
        bullets: [
          "Internal clearance height — determines what racking and equipment can be used",
          "Roller door size and access — whether a truck can actually get in and out",
          "Floor loading capacity",
          "Three-phase power, and how much of it",
          "Office or amenities component, and its proportion of the total area",
          "Hardstand, turning circle and parking",
          "Whether the site allows the tenant's intended use under the planning scheme",
        ],
      },
      {
        heading: "What the lease determines",
        paragraphs: [
          "In an industrial lease, the terms shape the investment as much as the building does. The term remaining, the rent review mechanism, which outgoings are recoverable, who carries structural repairs, the make-good obligation at expiry and the security held — all of it affects both your income and your risk.",
          "A long lease to a weak tenant is not more secure than a shorter lease to a strong one. Understand who is paying the rent, not just how long they've promised to pay it.",
        ],
      },
      {
        heading: "Risks worth weighing",
        bullets: [
          "Vacancy — industrial re-letting periods can run to several months or longer",
          "Specialised fit-out that suits the current tenant and few others",
          "Capital expenditure, particularly roofing, concrete and compliance items",
          "Environmental issues on sites with a history of industrial use",
          "Concentration risk if a single tenant represents all of your income",
        ],
      },
    ],
    faqs: [
      {
        q: "What size warehouse should I look at?",
        a: "It depends on your budget and on what tenants in your target area actually need. Smaller units generally have a broader tenant pool of small businesses; larger facilities suit fewer but often more established tenants. Look at what's leasing in the precinct rather than at the property in isolation.",
      },
      {
        q: "Who pays the outgoings on an industrial lease?",
        a: "It varies and it is set by the lease. Many industrial leases make most outgoings recoverable from the tenant, but this is not universal and structural items usually remain with the owner. Always read the lease and work out the net position.",
      },
      {
        q: "How long does it take to lease a warehouse?",
        a: "It varies considerably by precinct, size and specification. Ask local agents what comparable properties are taking, and budget for a vacancy period rather than assuming continuous income.",
      },
    ],
    related: ["/industrial-property-investment-melbourne", "/commercial-property-under-500k", "/commercial-property-for-investors"],
  },
  {
    slug: "industrial-property-investment-melbourne",
    art: "industrial",
    eyebrow: "Industrial",
    h1: "Industrial Property Investment in Melbourne",
    intro:
      "Industrial property covers a wide span — from small workshop units in established suburbs to large distribution facilities in the growth corridors. What they share is a tenant base of businesses and a valuation that leans heavily on income.",
    metaTitle: "Industrial Property Investment Melbourne | Investor Access",
    metaDescription:
      "Industrial property investment in Melbourne: precincts, tenant demand, lease structures, specification and risks. Register your criteria to receive relevant opportunities.",
    sections: [
      {
        heading: "The industrial segment",
        paragraphs: [
          "Industrial property is functional real estate. Its value comes from being useful to a business — accessible, appropriately zoned, adequately serviced and the right size for what the occupier does.",
          "Melbourne's industrial areas cluster around transport infrastructure. The northern and western corridors carry much of the larger-format activity, while established inner and middle-ring precincts hold older, smaller stock that suits trades and light manufacturing.",
        ],
      },
      {
        heading: "What influences industrial demand",
        bullets: [
          "Proximity to freeways, ports and freight routes",
          "The depth of the local business base and the type of businesses in the precinct",
          "Zoning and permitted use under the local planning scheme",
          "Availability of competing stock, including new supply under construction",
          "Building specification relative to what tenants in that precinct need",
        ],
      },
      {
        heading: "Ownership considerations",
        paragraphs: [
          "Industrial assets can be standalone or strata-titled. Standalone gives you control over the whole site; strata gives you a lower entry price but brings owners corporation obligations, shared common property and levies.",
          "Either way, the lease and the tenant are central. Review the lease documentation, the arrears history and the security held before you form a view on the income.",
        ],
      },
      {
        heading: "Risks",
        paragraphs: [
          "Industrial investment carries vacancy risk, tenant default risk, capital expenditure risk and market risk like any commercial asset. Environmental risk deserves specific attention on industrial land: past uses can leave contamination, and remediation is expensive.",
          "Obtain appropriate inspections and independent professional advice before committing.",
        ],
      },
    ],
    faqs: [
      {
        q: "What's the difference between industrial and warehouse property?",
        a: "In practice the terms overlap heavily. 'Warehouse' usually implies storage and distribution use, while 'industrial' is broader and includes manufacturing, workshops and service businesses. The same building is often described either way.",
      },
      {
        q: "Are industrial properties harder to finance?",
        a: "Commercial lending differs from residential lending generally — larger deposits, shorter terms, and assessment that considers the lease and tenant. Specialised properties may attract different terms again. Speak to a commercial lender or broker early.",
      },
      {
        q: "What should I check on an industrial site?",
        a: "Zoning and permitted use, building specification, environmental history, compliance items such as fire services and essential safety measures, the lease documentation, and the depth of tenant demand in that precinct.",
      },
    ],
    related: ["/warehouse-investment-melbourne", "/commercial-property-for-investors", "/commercial-property-investment-melbourne"],
  },
  {
    slug: "storage-property-investment",
    art: "storage",
    eyebrow: "Storage",
    h1: "Storage Property Investment Explained",
    intro:
      "Storage-style units are often the smallest capital commitment available in the commercial sector, which makes them a common entry point. They are also frequently misunderstood — the low price is not the whole story.",
    metaTitle: "Storage Property Investment | Commercial Investment Opportunities",
    metaDescription:
      "How storage property investment works: what you're buying, owners corporation considerations, tenant demand and the risks. Register your criteria for relevant opportunities.",
    sections: [
      {
        heading: "What a storage investment actually is",
        paragraphs: [
          "In this context, a storage investment usually means a strata-titled unit within a larger purpose-built complex. You own the individual unit on its own title and share the common property — driveways, security, lighting, roofing — with the other owners through an owners corporation.",
          "That structure is the key to understanding the investment. You are buying a small share of a larger operation, and the way that operation is run affects your outcome as much as your individual unit does.",
        ],
      },
      {
        heading: "What to examine closely",
        bullets: [
          "The owners corporation budget, sinking fund balance and levy history",
          "Any planned or foreshadowed special levies for capital works",
          "How the complex is managed, and by whom",
          "Whether units in the complex are predominantly owner-occupied or investor-held",
          "Occupancy levels across the complex, not just your unit",
          "Access hours, security arrangements and how they're funded",
          "Resale evidence for comparable units in the same or similar complexes",
        ],
      },
      {
        heading: "Income considerations",
        paragraphs: [
          "Storage units can produce rental income, but the amount is small in absolute terms and the tenant pool is different to a general commercial property. Some are leased to individual users, others to businesses using them for stock or equipment.",
          "Work out the net position carefully. On a low-priced asset, owners corporation levies and management costs consume a proportionally larger share of the gross rent than they do on a larger property.",
        ],
      },
      {
        heading: "Risks",
        bullets: [
          "Vacancy, and a tenant pool that may be sensitive to price and to alternatives nearby",
          "Owners corporation levies, including unexpected special levies",
          "Limited resale market if the complex or the segment falls out of favour",
          "Lender treatment — some lenders are more conservative on small specialised assets",
          "Reliance on the quality of complex management, which you don't individually control",
        ],
      },
    ],
    faqs: [
      {
        q: "Is storage a good first commercial investment?",
        a: "It can be an accessible entry point because of the lower capital requirement, but 'accessible' is not the same as 'low risk'. The owners corporation position, the complex's occupancy and the resale market all warrant careful review. Obtain independent advice.",
      },
      {
        q: "What returns can I expect from a storage unit?",
        a: "We can't tell you that, and you should be cautious of anyone who does. Income depends on the specific unit, the complex, the demand in that location and the terms of any lease. Always calculate the net position after levies and costs.",
      },
      {
        q: "Can I get finance for a storage unit?",
        a: "Some lenders will lend on them, but terms vary and some treat smaller specialised assets more conservatively than standard commercial property. Speak to a commercial broker before committing.",
      },
    ],
    related: ["/small-commercial-property-investment", "/commercial-property-under-500k", "/commercial-property-for-investors"],
  },
  {
    slug: "small-commercial-property-investment",
    art: "commercial",
    eyebrow: "Small Commercial",
    h1: "Small Commercial Property Investment",
    intro:
      "Small commercial property is where most investors make their first move into the sector. Lower entry prices, simpler buildings and a broader base of small-business tenants make it a practical starting point — provided the fundamentals stack up.",
    metaTitle: "Small Commercial Property Investment | Lower-Entry Opportunities",
    metaDescription:
      "Small commercial property investment explained: what you can buy, owners corporation considerations, tenant demand, lease basics and risks. Register your investment criteria.",
    sections: [
      {
        heading: "What counts as small commercial",
        paragraphs: [
          "There's no formal definition, but in practice it means compact commercial space — small warehouses and workshops, storage-style units, small suites and modest retail tenancies. Most are strata-titled within a larger complex or building.",
          "The tenant is usually a small business: a trade, a service provider, a light manufacturer, an online retailer needing space for stock. That tenant base is broad, which is one of the segment's advantages.",
        ],
      },
      {
        heading: "Why investors start here",
        bullets: [
          "Entry prices that can sit closer to a residential investment than to a large commercial asset",
          "Simpler buildings with fewer systems to maintain",
          "A wide base of potential small-business tenants in most established precincts",
          "Commercial lease structures, including the potential for recoverable outgoings",
          "Exposure to a different property sector from residential",
        ],
      },
      {
        heading: "What smaller assets bring with them",
        paragraphs: [
          "Strata ownership means an owners corporation, levies, shared insurance and shared decision-making about the building. Read the owners corporation records before you buy — the budget, the sinking fund, the minutes and any planned special levies.",
          "Transaction and holding costs also matter proportionally more on a smaller asset. Stamp duty, legal fees, due diligence and management costs don't shrink in line with the purchase price.",
        ],
      },
      {
        heading: "Doing the numbers properly",
        paragraphs: [
          "Establish whether quoted rent is gross or net before comparing anything. Then subtract every outgoing you'll actually bear — levies, rates, insurance, management, maintenance, land tax where applicable — and look at what's left.",
          "Then ask the harder question: what does this look like with no tenant for six months? If that answer is uncomfortable, the property may be the wrong size or the wrong price for your position.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do I need for a small commercial property?",
        a: "It varies by asset type and location, and your lending position matters as much as the price. Commercial deposits are typically larger than residential. Speak to a commercial broker, then register your budget and we'll tell you what's realistic within it.",
      },
      {
        q: "Are small commercial properties easy to lease?",
        a: "It depends entirely on the precinct, the specification and the permitted use. General-purpose space in an established area with a deep small-business base is easier to lease than specialised space in a thin market. Check what comparable properties are taking to lease.",
      },
      {
        q: "Should I buy with a tenant already in place?",
        a: "Buying with a tenant gives you income from day one, but you inherit that lease — its rent, its term, its outgoings arrangement and its expiry. Buying vacant gives you flexibility but no income while you find a tenant. Neither is automatically better.",
      },
    ],
    related: ["/commercial-property-under-500k", "/storage-property-investment", "/commercial-property-for-investors"],
  },
  {
    slug: "commercial-property-for-investors",
    art: "industrial",
    eyebrow: "Income-Producing",
    h1: "Income-Producing Commercial Property for Investors",
    intro:
      "When a commercial property already has a tenant in place, you're buying two things: the building and the lease. Investors focused on rental income need to understand both — because the lease is what determines the income you actually receive.",
    metaTitle: "Commercial Property for Investors | Income-Producing Opportunities",
    metaDescription:
      "Income-producing commercial property explained: lease structures, outgoings, tenant quality, yields and risk. Register your criteria to receive opportunities that may suit.",
    sections: [
      {
        heading: "You're buying the lease as much as the building",
        paragraphs: [
          "An income-producing property comes with a tenant and a lease. The lease sets the rent, the term, the review mechanism, who pays which outgoings, who maintains what, and what happens at expiry. Two identical buildings with different leases are different investments.",
          "Read it. If you're not comfortable reading it, have a commercial property solicitor read it. It is the single most important document in the transaction.",
        ],
      },
      {
        heading: "How income is assessed",
        bullets: [
          "Gross rent versus net rent — never compare one to the other",
          "Which outgoings are recoverable from the tenant, and which you bear",
          "The rent review mechanism: fixed, CPI-linked, market, or a combination",
          "Term remaining, and who holds any options to renew",
          "Security held — bank guarantee, bond, personal or company guarantees",
          "Arrears history and how the tenant has actually performed",
        ],
      },
      {
        heading: "Understanding the yield figure",
        paragraphs: [
          "Yield is income divided by price. It is a snapshot, not a forecast. A quoted yield tells you what the property earns today at today's price under today's lease — it does not tell you what it will earn after the lease expires, after a vacancy, or after the next round of outgoings increases.",
          "As an illustration only: a property at $500,000 with net income of $30,000 shows a net yield of 6%. If outgoings of $6,000 turn out not to be recoverable, the same property returns $24,000, or 4.8%. The building hasn't changed — only the assumption has. These figures are illustrative and are not drawn from any specific property.",
        ],
      },
      {
        heading: "What happens at expiry",
        paragraphs: [
          "The most commonly underestimated moment in a commercial investment is lease expiry. Will the tenant renew? At what rent? If they leave, how long to re-let, at what cost, and what make-good will actually be delivered?",
          "Investors should form a view on this before buying, not after. Ask what comparable space is leasing for and how long it is taking.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a good yield for commercial property?",
        a: "There's no universal number. Yields vary by asset type, location, lease strength and market conditions, and a higher yield often signals higher perceived risk rather than a better investment. Compare like with like — net against net — and look at what's driving the difference.",
      },
      {
        q: "Is a long lease always better?",
        a: "Not necessarily. A long lease to a financially weak tenant carries default risk; a long lease with weak rent reviews can lock in below-market income. Term is one factor among several.",
      },
      {
        q: "What if the tenant leaves?",
        a: "You carry the outgoings and any loan costs with no rent coming in until you re-let. Commercial vacancy periods can be lengthy. Consider how long you could sustain that before you buy.",
      },
    ],
    related: ["/warehouse-investment-melbourne", "/industrial-property-investment-melbourne", "/commercial-property-under-500k"],
  },
  {
    slug: "commercial-property-melbourne",
    art: "streetscape",
    eyebrow: "Melbourne",
    h1: "Commercial Property in Melbourne: An Investor's Overview",
    intro:
      "A practical overview of the Melbourne commercial market for investors deciding whether the sector suits them — the asset types, how they differ, what drives demand and what the process of buying actually involves.",
    metaTitle: "Commercial Property Melbourne | Investor Overview and Opportunities",
    metaDescription:
      "An investor's overview of commercial property in Melbourne: asset types, demand drivers, buying process, finance and risks. Register your criteria for relevant opportunities.",
    sections: [
      {
        heading: "The main asset types",
        bullets: [
          "Industrial and warehouse — storage, distribution, manufacturing and trade uses",
          "Small commercial units — compact strata space suiting small businesses",
          "Storage — the smallest capital commitment, usually within a purpose-built complex",
          "Retail — highly location-dependent and sensitive to foot traffic and neighbouring tenants",
          "Office — from suburban suites to CBD floors, with demand patterns that have shifted markedly",
        ],
      },
      {
        heading: "What drives commercial demand in Melbourne",
        paragraphs: [
          "Commercial demand follows business activity. Population growth matters, but indirectly — through the businesses that serve that population and the logistics required to supply them. Infrastructure, freight access and the depth of the local business base all shape which precincts perform.",
          "This is why commercial and residential markets can move differently. They respond to overlapping but distinct drivers.",
        ],
      },
      {
        heading: "The buying process",
        bullets: [
          "Establish your budget and confirm your finance position with a commercial lender or broker",
          "Define what you're looking for — asset type, location, size, whether tenanted or vacant",
          "Review opportunities as they arise and assess each on its own numbers",
          "Conduct due diligence: building, zoning, lease, owners corporation, title, compliance",
          "Obtain independent legal advice on the contract and independent taxation advice on the structure",
          "Settle, and put management arrangements in place",
        ],
      },
      {
        heading: "Where this site fits",
        paragraphs: [
          "We don't publish listings. Investors tell us their budget, location and objectives, and we compare that against what is currently available through our network. If something appears relevant, we contact them about it. If nothing does, we say so.",
          "That approach means you hear about things that actually fit rather than filtering through hundreds of properties that don't.",
        ],
      },
    ],
    faqs: [
      {
        q: "Where should I buy commercial property in Melbourne?",
        a: "There's no single best area — it depends on the asset type and the tenant you want to attract. Industrial demand clusters near transport infrastructure and established precincts; small commercial follows the local business base. Look at where comparable properties are leasing quickly.",
      },
      {
        q: "How is buying commercial different from buying residential?",
        a: "Finance terms differ, GST may apply, due diligence is broader, leases are negotiated rather than standard-form, and the valuation leans on income rather than comparable sales. The process takes longer and warrants more professional input.",
      },
      {
        q: "Do I need a buyer's agent?",
        a: "That's your call. What matters is that someone competent reviews the lease, the building and the numbers before you commit — whether that's a buyer's agent, a solicitor, an accountant or all three.",
      },
    ],
    related: ["/commercial-property-investment-melbourne", "/warehouse-investment-melbourne", "/small-commercial-property-investment"],
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

export const LANDING_SLUGS = LANDING_PAGES.map((p) => p.slug);
