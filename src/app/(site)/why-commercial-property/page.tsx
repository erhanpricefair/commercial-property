import type { Metadata } from "next";
import Link from "next/link";
import { Section, SectionHeading, CtaBand, Disclaimer, Breadcrumbs } from "@/components/ui";
import { IndustrialArt } from "@/components/Imagery";

export const metadata: Metadata = {
  title: "Why Commercial Property? | Considerations for Investors",
  description:
    "Commercial property can offer exposure to a different property sector, potential rental income and different tenant structures. Understand the considerations and the risks.",
  alternates: { canonical: "/why-commercial-property" },
};

const CONSIDERATIONS = [
  {
    h: "Exposure to a different property sector",
    p: "Commercial property responds to different drivers than residential housing. Business activity, industrial demand, local employment and infrastructure all influence commercial demand. That means it can behave differently to a residential portfolio — sometimes better, sometimes worse.",
  },
  {
    h: "Potential rental income",
    p: "Commercial properties can produce rental income. How much, how reliably, and on what terms depends entirely on the property, the tenant and the lease. A property without a tenant produces no income at all, and commercial re-letting periods can be longer than residential.",
  },
  {
    h: "Different tenant structures",
    p: "Commercial leases are typically longer than residential leases and are negotiated between the parties. Responsibility for outgoings, maintenance, insurance and rent reviews is set out in the lease and varies considerably. The lease is often as important as the building.",
  },
  {
    h: "Diversification away from residential property",
    p: "For investors who already hold residential property, commercial represents exposure to a different sector. Diversification may reduce concentration in one sector, but it does not remove investment risk.",
  },
  {
    h: "Different investment price points",
    p: "Commercial entry prices vary widely. Some smaller commercial and storage-style assets sit at price points that investors may not expect, while larger industrial assets require considerably more capital.",
  },
  {
    h: "Potential long-term ownership opportunities",
    p: "Depending on the property, some investors hold commercial assets over long periods. Whether that suits you depends on your objectives, your liquidity needs and your circumstances.",
  },
];

const RISKS = [
  {
    h: "Vacancy",
    p: "A vacant commercial property earns nothing, and finding a replacement tenant can take longer than in residential. Investors should consider how long they could comfortably carry the property with no income.",
  },
  {
    h: "Tenant default",
    p: "A tenant's business can fail. Rent can stop. Recovery of arrears and re-letting both take time and cost money.",
  },
  {
    h: "Outgoings and holding costs",
    p: "Council rates, water, insurance, owners corporation fees, land tax and repairs all continue whether or not a tenant is paying. Whether they are recoverable depends on the lease.",
  },
  {
    h: "Market and value changes",
    p: "Commercial property values can fall as well as rise. Interest rates, credit conditions and sector demand all influence value and none of them are predictable.",
  },
  {
    h: "Liquidity",
    p: "Commercial property can take longer to sell than residential property, particularly in a slower market or where the property suits a narrow set of buyers.",
  },
  {
    h: "Finance",
    p: "Commercial lending terms typically differ from residential lending — deposit requirements, loan terms and assessment criteria can all be different. Speak to a lender or broker early.",
  },
];

export default function WhyCommercialPropertyPage() {
  return (
    <>
      <div className="border-b border-ink-100 bg-canvas">
        <div className="container-page py-14 sm:py-20">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Why Commercial Property" }]} />
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow">Education</p>
              <h1 className="mt-4 font-display text-display-xl text-ink-900">
                Why Commercial Property?
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-[1.65] text-ink-600">
                Commercial property is a different part of the property market, with different
                income structures, different tenants and a different risk profile. Whether it suits
                you depends on your objectives and circumstances — not on anyone&rsquo;s opinion
                about which sector is &ldquo;better&rdquo;.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-card">
              <IndustrialArt className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      <Section tone="canvas">
        <div className="container-page">
          <SectionHeading
            eyebrow="Considerations"
            title="What commercial property can offer investors"
            intro="These are possibilities that depend on the specific property, the tenancy and market conditions — not outcomes anyone can promise."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {CONSIDERATIONS.map(({ h, p }) => (
              <div key={h} className="rounded-2xl border border-ink-100 bg-canvas-raised p-6 sm:p-7">
                <h3 className="font-display text-display-sm text-ink-900">{h}</h3>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-600">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <SectionHeading
            eyebrow="Risks"
            title="What investors should also consider"
            intro="Any honest discussion of commercial property has to include what can go wrong. These are the risks investors most often underestimate."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RISKS.map(({ h, p }) => (
              <div key={h} className="border-l-2 border-brass-200 pl-5">
                <h3 className="text-base font-semibold text-ink-900">{h}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">{p}</p>
              </div>
            ))}
          </div>
          <Disclaimer className="mt-12 max-w-3xl" />
        </div>
      </Section>

      <Section tone="canvas">
        <div className="container-page">
          <SectionHeading
            eyebrow="Commercial vs Residential"
            title="They are different, not ranked"
            intro="Investors often ask which is better. That question doesn't have a general answer — the two behave differently and suit different objectives."
          />
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200">
                  <th scope="col" className="py-4 pr-4 font-semibold text-ink-900">Characteristic</th>
                  <th scope="col" className="py-4 pr-4 font-semibold text-ink-900">Commercial property</th>
                  <th scope="col" className="py-4 font-semibold text-ink-900">Residential property</th>
                </tr>
              </thead>
              <tbody className="text-ink-600">
                {[
                  ["Typical lease length", "Often multi-year, negotiated between the parties", "Commonly 6–12 months"],
                  ["Outgoings", "Often partly or wholly recoverable, depending on the lease", "Usually borne by the owner"],
                  ["Tenant pool", "Businesses; can be narrower for specialised property", "Broad"],
                  ["Vacancy periods", "Can be longer", "Typically shorter"],
                  ["Finance", "Different deposit and assessment requirements", "Widely available residential products"],
                  ["Valuation drivers", "Income and lease terms are central", "Comparable sales are central"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-ink-100">
                    <th scope="row" className="py-4 pr-4 font-medium text-ink-800">{row[0]}</th>
                    <td className="py-4 pr-4">{row[1]}</td>
                    <td className="py-4">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-prose text-sm text-ink-500">
            For a longer discussion, read{" "}
            <Link href="/resources/commercial-vs-residential-property-investment" className="font-semibold text-ink-900 underline underline-offset-4">
              Commercial vs Residential Property Investment
            </Link>
            .
          </p>
        </div>
      </Section>

      <CtaBand
        title="Considering commercial property?"
        body="Register your investment criteria and we'll identify opportunities that may suit your budget, location and objectives."
        secondaryLabel="Read the investor guide"
        secondaryHref="/guide"
      />
    </>
  );
}
