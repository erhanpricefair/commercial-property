import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs, CtaBand } from "@/components/ui";
import { ARTICLES, ARTICLE_CATEGORIES } from "@/lib/content/articles";

export const metadata: Metadata = {
  title: "Commercial Property Investor Resources | Guides and Articles",
  description:
    "Practical guides on commercial property investment: yields, outgoings, leases, due diligence, warehouse and storage investment, and how commercial compares to residential.",
  alternates: { canonical: "/resources" },
};

export default function ResourcesPage() {
  const sorted = [...ARTICLES].sort((a, b) => b.published.localeCompare(a.published));
  const [featured, ...rest] = sorted;

  return (
    <>
      <div className="border-b border-ink-100 bg-canvas">
        <div className="container-page py-14 sm:py-20">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Resources" }]} />
          <p className="eyebrow">Investor Resources</p>
          <h1 className="mt-4 max-w-3xl font-display text-display-xl text-ink-900">
            Practical guides to commercial property investment
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.65] text-ink-600">
            Plain-English explanations of how commercial property actually works — income, outgoings,
            leases, due diligence and the differences that catch residential investors out.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {ARTICLE_CATEGORIES.map((category) => (
              <span
                key={category}
                className="rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-600"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page py-14 sm:py-20">
        {featured && (
          <Link
            href={`/resources/${featured.slug}`}
            className="group mb-12 block rounded-2xl border border-ink-100 bg-canvas-raised p-7 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift sm:p-10"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-ink-500">
              <span className="rounded-full bg-canvas-sunken px-3 py-1 text-ink-700">
                {featured.category}
              </span>
              <span>{featured.readMinutes} min read</span>
            </div>
            <h2 className="mt-5 max-w-2xl font-display text-display-md text-ink-900">
              {featured.title}
            </h2>
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-[1.7] text-ink-600">
              {featured.excerpt}
            </p>
            <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              Read article
              <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/resources/${article.slug}`}
              className="group flex flex-col rounded-2xl border border-ink-100 bg-canvas-raised p-6 transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-ink-500">
                <span className="rounded-full bg-canvas-sunken px-2.5 py-1 text-ink-700">
                  {article.category}
                </span>
                <span>{article.readMinutes} min</span>
              </div>
              <h2 className="mt-4 font-display text-display-sm leading-snug text-ink-900">
                {article.title}
              </h2>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-ink-600">
                {article.excerpt}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                Read
                <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>

      <CtaBand
        title="Looking for commercial property opportunities?"
        body="Register your investment criteria and we'll identify opportunities that may suit your budget, location and objectives."
        secondaryLabel="Get the investor guide"
        secondaryHref="/guide"
      />
    </>
  );
}
