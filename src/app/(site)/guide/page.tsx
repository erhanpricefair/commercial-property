import type { Metadata } from "next";
import GuideForm from "@/components/GuideForm";
import { Breadcrumbs, CheckList, Disclaimer } from "@/components/ui";
import { GUIDE_SECTIONS, GUIDE_TITLE } from "@/lib/content/guide";

export const metadata: Metadata = {
  title: "Commercial Property Investor Starter Guide | Free Resource",
  description:
    "A plain-English guide to commercial property investment: asset types, rental income, outgoings, leases, due diligence, finance considerations and the questions worth asking.",
  alternates: { canonical: "/guide" },
};

export default function GuidePage() {
  return (
    <div className="bg-canvas-sunken">
      <div className="container-page py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Investor Starter Guide" }]} />

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Free Resource</p>
            <h1 className="mt-4 font-display text-display-lg text-ink-900">{GUIDE_TITLE}</h1>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] text-ink-600">
              Most investors coming to commercial property for the first time have the same
              questions. This guide answers them in plain English — no jargon, no sales pitch, and no
              specific properties.
            </p>

            <div className="mt-9 rounded-2xl border border-ink-100 bg-canvas-raised p-6 sm:p-8">
              <p className="eyebrow">What&rsquo;s inside</p>
              <ol className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {GUIDE_SECTIONS.map((section) => (
                  <li key={section.id} className="flex gap-3 text-[0.9375rem] text-ink-700">
                    <span className="text-brass-500" aria-hidden="true">—</span>
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-8">
              <p className="eyebrow">Written for</p>
              <div className="mt-4">
                <CheckList
                  items={[
                    "Residential investors considering commercial property for the first time",
                    "Investors comparing warehouse, industrial and storage assets",
                    "Anyone trying to work out what they can realistically buy at their price point",
                    "Investors who want to know what to check before committing",
                  ]}
                />
              </div>
            </div>

            <Disclaimer className="mt-8" />
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
            <div className="card">
              <h2 className="font-display text-display-sm text-ink-900">
                Get the guide
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Enter your details and we&rsquo;ll send you the link. It opens straight away too.
              </p>
              <div className="mt-6">
                <GuideForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
