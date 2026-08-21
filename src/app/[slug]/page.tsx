import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs, CtaBand, Disclaimer, Section, SectionHeading } from "@/components/ui";
import CtaLink from "@/components/CtaLink";
import {
  CommercialArt,
  IndustrialArt,
  StorageArt,
  StreetscapeArt,
  WarehouseArt,
} from "@/components/Imagery";
import { LANDING_PAGES, getLandingPage } from "@/lib/content/landing-pages";
import { SITE } from "@/lib/site";

const ART = {
  warehouse: WarehouseArt,
  industrial: IndustrialArt,
  storage: StorageArt,
  commercial: CommercialArt,
  streetscape: StreetscapeArt,
};

/**
 * Intent-targeted SEO landing pages, generated from a static content model.
 *
 * These are rendered at build time and read nothing from the database — a page
 * here can never leak an opportunity because it has no access to one.
 */
export function generateStaticParams() {
  return LANDING_PAGES.map((page) => ({ slug: page.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) return {};

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `/${page.slug}`,
      type: "article",
    },
  };
}

export default async function LandingPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLandingPage(slug);
  if (!page) notFound();

  const Art = ART[page.art];

  // FAQPage schema is safe here: the questions are generic education and
  // contain no property, address, price or development reference.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: page.h1, item: `${SITE.url}/${page.slug}` },
    ],
  };

  return (
    <>
      <div className="border-b border-ink-100 bg-canvas">
        <div className="container-page py-14 sm:py-20">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: page.eyebrow }]} />
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="eyebrow">{page.eyebrow}</p>
              <h1 className="mt-4 font-display text-display-xl text-ink-900">{page.h1}</h1>
              <p className="mt-6 max-w-xl text-lg leading-[1.65] text-ink-600">{page.intro}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <CtaLink href="/register" location={`seo_${page.slug}_hero`}>
                  See Current Opportunities
                </CtaLink>
                <Link href="/how-it-works" className="btn-secondary">
                  How It Works
                </Link>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-ink-100 shadow-card">
              <Art className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>

      <Section tone="canvas">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
            <article className="space-y-12">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-display-md text-ink-900">{section.heading}</h2>
                  {section.paragraphs && (
                    <div className="prose-editorial mt-5">
                      {section.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
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
                </section>
              ))}
              <Disclaimer />
            </article>

            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="rounded-2xl border border-ink-100 bg-canvas-sunken p-6">
                <p className="eyebrow">Investor Access</p>
                <p className="mt-3 text-[0.9375rem] font-semibold leading-snug text-ink-900">
                  Tell us what you&rsquo;re looking for
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  Register your budget, location and property type and we&rsquo;ll identify
                  opportunities that may suit.
                </p>
                <CtaLink
                  href="/register"
                  location={`seo_${page.slug}_sidebar`}
                  className="btn-primary mt-5 w-full !min-h-[2.75rem] text-sm"
                >
                  Register for Investor Access
                </CtaLink>
              </div>

              <div className="mt-6 rounded-2xl border border-ink-100 p-6">
                <p className="eyebrow">Related</p>
                <ul className="mt-4 space-y-3">
                  {page.related.map((href) => {
                    const related = LANDING_PAGES.find((p) => `/${p.slug}` === href);
                    return (
                      <li key={href}>
                        <Link href={href} className="text-sm leading-snug text-ink-600 hover:text-ink-900">
                          {related?.h1 ?? href}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link href="/resources" className="text-sm leading-snug text-ink-600 hover:text-ink-900">
                      All investor resources
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <SectionHeading eyebrow="Common Questions" title="Frequently asked" />
          <div className="mt-10 max-w-3xl space-y-8">
            {page.faqs.map((faq) => (
              <div key={faq.q} className="border-b border-ink-100 pb-8 last:border-0 last:pb-0">
                <h3 className="text-base font-semibold text-ink-900">{faq.q}</h3>
                <p className="mt-3 text-[0.9375rem] leading-[1.7] text-ink-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand
        title="Tell us what you're looking for"
        body="Register your investment criteria and we'll identify commercial property opportunities that may suit your budget, strategy and objectives."
        secondaryLabel="Read the investor guide"
        secondaryHref="/guide"
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
