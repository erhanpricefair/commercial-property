import Link from "next/link";
import type { Metadata } from "next";
import CtaLink from "@/components/CtaLink";
import { GUIDE_DISCLAIMER, GUIDE_SECTIONS, GUIDE_TITLE } from "@/lib/content/guide";

export const metadata: Metadata = {
  title: `${GUIDE_TITLE} | Read Online`,
  description:
    "Read the Commercial Property Investor Starter Guide: asset types, rental income, outgoings, leases, due diligence, finance considerations and an investor checklist.",
  alternates: { canonical: "/guide/read" },
};

/**
 * The guide is served as a page rather than a downloadable PDF. It contains
 * only generic education — no stock, no addresses, no developer or project
 * names — so it is safe to index, and keeping it on-site means it can be
 * corrected in one place rather than living in files we can't recall.
 */
export default function GuideReadPage() {
  return (
    <div className="bg-canvas">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-16">
          <nav aria-label="Guide contents" className="lg:sticky lg:top-28 lg:h-fit">
            <p className="eyebrow">Contents</p>
            <ol className="mt-4 space-y-2.5">
              {GUIDE_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block text-sm leading-snug text-ink-500 transition hover:text-ink-900"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
            <div className="mt-8 rounded-xl border border-ink-100 bg-canvas-sunken p-5">
              <p className="text-sm font-semibold text-ink-900">
                Looking for commercial property opportunities?
              </p>
              <CtaLink
                href="/register"
                location="guide_sidebar"
                className="btn-primary mt-4 w-full !min-h-[2.75rem] text-sm"
              >
                Register for Investor Access
              </CtaLink>
            </div>
          </nav>

          <article>
            <p className="eyebrow">Investor Resource</p>
            <h1 className="mt-4 font-display text-display-lg text-ink-900">{GUIDE_TITLE}</h1>
            <p className="mt-5 max-w-prose text-[1.0625rem] leading-[1.7] text-ink-600">
              A plain-English introduction to how commercial property investment works in Australia,
              what to look at, and the questions worth asking before you commit to anything.
            </p>

            <div className="mt-12 space-y-14">
              {GUIDE_SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="font-display text-display-md text-ink-900">{section.title}</h2>
                  {section.intro && (
                    <p className="mt-4 max-w-prose text-[1.0625rem] font-medium leading-[1.7] text-ink-700">
                      {section.intro}
                    </p>
                  )}
                  {section.bullets && (
                    <ul className="mt-5 max-w-prose space-y-3 border-l-2 border-brass-200 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="text-[0.9375rem] leading-relaxed text-ink-600">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.paragraphs && (
                    <div className="prose-editorial mt-5">
                      {section.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-16 rounded-2xl border border-ink-100 bg-canvas-sunken p-7 sm:p-9">
              <h2 className="font-display text-display-sm text-ink-900">
                Looking for commercial property opportunities?
              </h2>
              <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-ink-600">
                Register your criteria and we&rsquo;ll identify commercial property opportunities
                that may suit your budget, location and objectives. There is no obligation to
                purchase.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/register" location="guide_footer">
                  Register for Investor Access
                </CtaLink>
                <Link href="/resources" className="btn-secondary">
                  Browse more resources
                </Link>
              </div>
            </div>

            <p className="mt-10 max-w-prose text-xs leading-relaxed text-ink-400">
              {GUIDE_DISCLAIMER}
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
