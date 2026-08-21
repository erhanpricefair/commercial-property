import Link from "next/link";
import type { Metadata } from "next";
import { Section, SectionHeading, CheckList, Disclaimer } from "@/components/ui";
import CtaLink from "@/components/CtaLink";
import {
  BlueprintPattern,
  CommercialArt,
  IndustrialArt,
  StorageArt,
  StreetscapeArt,
  WarehouseArt,
} from "@/components/Imagery";

export const metadata: Metadata = {
  title: "Commercial Property Investment Opportunities Melbourne | Investor Access",
  description:
    "Explore selected commercial property investment opportunities across Melbourne. Register your criteria and receive opportunities that may suit your budget and investment strategy.",
  alternates: { canonical: "/" },
};

const CATEGORIES = [
  {
    title: "Small Commercial Investments",
    body: "For investors looking for lower-entry commercial property opportunities.",
    href: "/small-commercial-property-investment",
    Art: CommercialArt,
  },
  {
    title: "Warehouses & Industrial",
    body: "For investors seeking larger commercial assets and industrial property.",
    href: "/warehouse-investment-melbourne",
    Art: WarehouseArt,
  },
  {
    title: "Storage",
    body: "For investors considering smaller commercial and storage investments.",
    href: "/storage-property-investment",
    Art: StorageArt,
  },
  {
    title: "Income-Producing Commercial Property",
    body: "For investors focused on rental income and long-term ownership.",
    href: "/commercial-property-for-investors",
    Art: IndustrialArt,
  },
];

const STEPS = [
  {
    title: "Tell Us What You're Looking For",
    body: "Budget, location, property type and investment objectives. It takes about two minutes.",
  },
  {
    title: "We Review Available Opportunities",
    body: "We compare your criteria against opportunities currently available through our network.",
  },
  {
    title: "We Present Relevant Opportunities",
    body: "Only opportunities that appear relevant to your requirements are presented to you.",
  },
  {
    title: "You Decide",
    body: "You review the information and decide whether you want to proceed. Registration does not create an obligation to purchase.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------- 1. HERO ---------------- */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-canvas">
        <BlueprintPattern className="pointer-events-none absolute inset-0 h-full w-full text-ink-100/70" />
        <div className="container-page relative py-16 sm:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="animate-fade-up">
              <p className="eyebrow">Private Investor Access · {`Melbourne & Victoria`}</p>
              <h1 className="mt-4 font-display text-display-xl text-ink-900">
                Looking for Your Next Commercial Property Investment?
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-[1.65] text-ink-600">
                Register your investment criteria and we&rsquo;ll identify commercial property
                opportunities that may suit your budget, strategy and objectives.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/register" location="hero_primary">
                  See Current Opportunities
                </CtaLink>
                <Link href="/how-it-works" className="btn-secondary">
                  How It Works
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ink-500">
                {["No obligation to purchase", "Two-minute registration", "Your criteria stay private"].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-2">
                      <svg className="h-3.5 w-3.5 text-brass-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-lift">
                <StreetscapeArt className="h-full w-full" />
              </div>
              <div className="absolute -bottom-6 -left-4 hidden max-w-[15rem] rounded-xl border border-ink-100 bg-canvas-raised p-4 shadow-card sm:block lg:-left-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-brass-600">
                  Investor-led
                </p>
                <p className="mt-1.5 text-sm leading-snug text-ink-600">
                  You tell us what you&rsquo;re looking for. We identify what may fit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. INVESTMENT CATEGORIES ---------------- */}
      <Section tone="canvas">
        <div className="container-page">
          <SectionHeading
            eyebrow="Investment Categories"
            title="What type of commercial property are you considering?"
            intro="Every investor comes to commercial property with a different budget and a different objective. These are the categories we most often help investors explore."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {CATEGORIES.map(({ title, body, href, Art }) => (
              <Link
                key={title}
                href={href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-canvas-raised shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="aspect-[16/9] overflow-hidden bg-canvas-sunken">
                  <Art className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-display text-display-sm text-ink-900">{title}</h3>
                  <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-600">{body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                    Explore Opportunities
                    <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      {/* ---------------- 3. WHY COMMERCIAL PROPERTY ---------------- */}
      <Section tone="sunken">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Why Commercial Property?"
                title="A different part of the property market"
                intro="Many investors come to commercial property after building a residential portfolio. It works differently, and whether it suits you depends entirely on your objectives and circumstances."
              />
              <div className="mt-8">
                <Link href="/why-commercial-property" className="btn-secondary">
                  Read the full explainer
                </Link>
              </div>
            </div>

            <div className="space-y-5">
              {[
                {
                  h: "Exposure to a different property sector",
                  p: "Commercial property responds to different drivers than residential housing — business demand, industrial activity and local employment among them.",
                },
                {
                  h: "Potential rental income",
                  p: "Commercial properties can produce rental income, though the amount, reliability and structure vary considerably depending on the property and the tenant.",
                },
                {
                  h: "Different tenant structures",
                  p: "Commercial leases are typically longer than residential leases, and responsibility for outgoings is often shared differently. Terms vary from property to property.",
                },
                {
                  h: "Diversification away from residential property",
                  p: "For investors already holding residential property, commercial can represent exposure to a different sector. Diversification does not remove risk.",
                },
                {
                  h: "Different investment price points",
                  p: "Entry prices vary widely. Some smaller commercial and storage assets sit at price points investors may not expect.",
                },
                {
                  h: "Potential long-term ownership opportunities",
                  p: "Depending on the property, some investors hold commercial assets over long periods. Outcomes depend on the asset, the tenancy and market conditions.",
                },
              ].map(({ h, p }) => (
                <div key={h} className="rounded-xl border border-ink-100 bg-canvas-raised p-5 sm:p-6">
                  <h3 className="text-[0.9375rem] font-semibold text-ink-900">{h}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">{p}</p>
                </div>
              ))}

              <Disclaimer />
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- 4. INVESTOR ACCESS ---------------- */}
      <section className="relative overflow-hidden bg-ink-900 py-section text-canvas">
        <BlueprintPattern className="pointer-events-none absolute inset-0 h-full w-full text-ink-700/40" />
        <div className="container-page relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div>
              <p className="eyebrow text-brass-400">Investor Access</p>
              <h2 className="mt-4 max-w-xl font-display text-display-lg text-canvas">
                Not Every Opportunity Is Publicly Listed
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-[1.65] text-ink-200">
                Some commercial property opportunities are distributed through private channels
                rather than traditional public property portals. Register your investment criteria
                and we&rsquo;ll contact you when an opportunity appears to match what you&rsquo;re
                looking for.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/register" location="investor_access_band" className="btn-brass">
                  Register for Investor Access
                </CtaLink>
                <Link href="/opportunities" className="btn border border-ink-600 text-canvas hover:bg-ink-800">
                  See opportunity types
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-700 bg-ink-800/60 p-7 backdrop-blur sm:p-8">
              <p className="eyebrow text-brass-400">Why Register?</p>
              <div className="mt-5">
                <CheckList
                  inverse
                  items={[
                    "Access selected opportunities",
                    "Match opportunities to your criteria",
                    "Avoid searching through hundreds of irrelevant listings",
                    "Receive relevant information directly",
                    "No obligation to purchase",
                  ]}
                />
              </div>
              <p className="mt-6 border-t border-ink-700 pt-5 text-xs leading-relaxed text-ink-400">
                We use your criteria only to identify opportunities that may be relevant to you. You
                can update or withdraw your criteria at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. HOW IT WORKS ---------------- */}
      <Section tone="canvas" id="how-it-works">
        <div className="container-page">
          <SectionHeading
            eyebrow="How It Works"
            title="You tell us what you're looking for. We identify what may fit. You decide."
            intro="A straightforward four-step process, built around your criteria rather than around whatever happens to be for sale."
            align="center"
          />

          <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-display-sm text-brass-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-ink-100" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-600">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-ink-100 bg-canvas-sunken p-8 text-center">
            <p className="max-w-xl text-[0.9375rem] leading-relaxed text-ink-600">
              <strong className="font-semibold text-ink-900">
                Registration does not create an obligation to purchase.
              </strong>{" "}
              You are simply telling us what you&rsquo;re looking for so we can identify whether
              anything currently available is relevant to you.
            </p>
            <CtaLink href="/register" location="how_it_works">
              Tell Us What You&rsquo;re Looking For
            </CtaLink>
          </div>
        </div>
      </Section>

      {/* ---------------- 6. QUALIFICATION ENTRY POINT ---------------- */}
      <section className="border-t border-ink-100 bg-canvas-sunken py-section">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Investor Qualification</p>
            <h2 className="mt-4 font-display text-display-lg text-ink-900">
              Tell us your criteria in about two minutes
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] text-ink-600">
              Seven short questions — property type, budget, location, what matters most to you,
              finance position, timeframe and how to reach you. Most of it is tapping a button.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Property type",
              "Budget range",
              "Preferred location",
              "What matters most",
              "Finance position",
              "Timeframe",
              "Contact details",
              "Anything else",
            ].map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-ink-100 bg-canvas-raised px-4 py-3.5"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-900 text-xs font-semibold text-canvas">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-ink-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <CtaLink href="/register" location="qualification_teaser">
              See Current Opportunities
            </CtaLink>
          </div>
        </div>
      </section>

      {/* ---------------- Lead magnet ---------------- */}
      <Section tone="canvas">
        <div className="container-page">
          <div className="grid items-center gap-10 rounded-2xl border border-ink-100 bg-canvas-raised p-8 shadow-card sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div>
              <p className="eyebrow">Free Resource</p>
              <h2 className="mt-3 font-display text-display-md text-ink-900">
                Commercial Property Investor Starter Guide
              </h2>
              <p className="mt-4 max-w-xl text-[1.0625rem] leading-[1.7] text-ink-600">
                A plain-English guide to how commercial property works: asset types, rental income,
                outgoings, leases, due diligence, finance considerations, the questions worth asking
                and the mistakes we see most often.
              </p>
            </div>
            <div className="shrink-0">
              <CtaLink href="/guide" location="home_guide" className="btn-secondary w-full sm:w-auto">
                Get the Starter Guide
              </CtaLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
