import Link from "next/link";
import type { Metadata } from "next";
import { Section, SectionHeading, CtaBand, Disclaimer, Breadcrumbs } from "@/components/ui";
import CtaLink from "@/components/CtaLink";
import { CommercialArt, IndustrialArt, StorageArt, WarehouseArt } from "@/components/Imagery";

export const metadata: Metadata = {
  title: "Commercial Property Opportunity Types | Investor Access",
  description:
    "The categories of commercial property investment opportunity we help investors explore — small commercial, warehouse and industrial, storage, and income-producing property.",
  alternates: { canonical: "/opportunities" },
};

/**
 * IMPORTANT: this page markets CATEGORIES only.
 *
 * It contains no individual opportunity, no address, no developer, no project
 * name and no stock availability. Nothing on this page is read from the
 * private opportunity database — the content below is static editorial.
 */
const CATEGORIES = [
  {
    title: "Small Commercial Investments",
    href: "/small-commercial-property-investment",
    Art: CommercialArt,
    body: "For investors looking for lower-entry commercial property opportunities. Smaller commercial assets can offer a way into the sector at a price point closer to a residential investment, though the same due diligence applies.",
    points: [
      "Typically lower entry price than larger commercial assets",
      "Often strata-titled, which brings owners corporation considerations",
      "Tenant pool and demand vary considerably by location and building type",
    ],
  },
  {
    title: "Warehouses & Industrial",
    href: "/warehouse-investment-melbourne",
    Art: WarehouseArt,
    body: "For investors seeking larger commercial assets and industrial property. Warehouse and industrial assets are typically leased to businesses and are valued heavily on their income and lease terms.",
    points: [
      "Building specification — clearance, access, power and parking — affects tenant demand",
      "Permitted use and zoning determine what a tenant can do in the space",
      "Lease structure and rent review mechanisms materially affect the investment",
    ],
  },
  {
    title: "Storage",
    href: "/storage-property-investment",
    Art: StorageArt,
    body: "For investors considering smaller commercial and storage investments. These are usually smaller-footprint assets, often within a larger complex, and are frequently the lowest entry point in the commercial market.",
    points: [
      "Generally the smallest capital commitment in the commercial sector",
      "Owners corporation rules and shared facilities are central to how it operates",
      "Demand depends on location, access and the surrounding catchment",
    ],
  },
  {
    title: "Income-Producing Commercial Property",
    href: "/commercial-property-for-investors",
    Art: IndustrialArt,
    body: "For investors focused on rental income and long-term ownership. An income-producing property already has a tenant in place, which changes what you are buying — you are buying the lease as much as the building.",
    points: [
      "The existing lease sets the income, the term and who pays the outgoings",
      "Tenant quality and remaining lease term are key considerations",
      "What happens at lease expiry should be understood before you commit",
    ],
  },
];

export default function OpportunitiesPage() {
  return (
    <>
      <div className="border-b border-ink-100 bg-canvas">
        <div className="container-page py-14 sm:py-20">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Opportunity Types" }]} />
          <p className="eyebrow">Opportunity Types</p>
          <h1 className="mt-4 max-w-3xl font-display text-display-xl text-ink-900">
            The categories of commercial property we help investors explore
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.65] text-ink-600">
            We don&rsquo;t publish individual properties on this website. What we can tell you is the
            kind of opportunity investors come to us for — and once you register your criteria,
            we&rsquo;ll tell you whether anything currently available is relevant to you.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <CtaLink href="/register" location="opportunities_hero">
              See Current Opportunities
            </CtaLink>
            <Link href="/how-it-works" className="btn-secondary">
              How It Works
            </Link>
          </div>
        </div>
      </div>

      <Section tone="canvas">
        <div className="container-page space-y-16 sm:space-y-20">
          {CATEGORIES.map(({ title, href, body, points, Art }, i) => (
            <article
              key={title}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
                i % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-card">
                <Art className="h-full w-full" />
              </div>
              <div>
                <h2 className="font-display text-display-md text-ink-900">{title}</h2>
                <p className="mt-4 text-[1.0625rem] leading-[1.7] text-ink-600">{body}</p>
                <ul className="mt-6 space-y-2.5 border-l-2 border-brass-200 pl-5">
                  {points.map((point) => (
                    <li key={point} className="text-[0.9375rem] leading-relaxed text-ink-500">
                      {point}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link href={href} className="btn-secondary">
                    Read more
                  </Link>
                  <CtaLink href="/register" location={`opportunities_${title}`}>
                    Explore Opportunities
                  </CtaLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <SectionHeading
              eyebrow="Why we don't publish listings"
              title="Some opportunities are distributed privately"
              intro={
                <>
                  <p>
                    Not every commercial property opportunity is advertised on a public portal. Some
                    are distributed through private channels instead, and are discussed directly with
                    investors whose criteria appear to fit.
                  </p>
                  <p className="mt-4">
                    That&rsquo;s why this site asks what you&rsquo;re looking for rather than
                    presenting you with a list. It means you only hear about things that are actually
                    relevant to your budget, location and objectives.
                  </p>
                </>
              }
            />
            <div className="space-y-6">
              <div className="card">
                <p className="eyebrow">What you receive</p>
                <ul className="mt-4 space-y-2.5 text-[0.9375rem] leading-relaxed text-ink-600">
                  <li>Property type and general location</li>
                  <li>Size, price and estimated rental where available</li>
                  <li>Outgoings and investment considerations</li>
                  <li>Enough detail to decide whether it warrants a closer look</li>
                </ul>
              </div>
              <Disclaimer />
            </div>
          </div>
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
