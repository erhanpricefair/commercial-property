import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui";
import CtaLink from "@/components/CtaLink";
import InlineForm from "@/components/InlineForm";
import { ARTICLES, getArticle } from "@/lib/content/articles";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    alternates: { canonical: `/resources/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.metaTitle,
      description: article.metaDescription,
      url: `/resources/${article.slug}`,
      publishedTime: article.published,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, 3);
  const fallbackRelated = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);
  const suggestions = related.length ? related : fallbackRelated;

  // Article schema only — no property, offer or price markup anywhere on this site.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.published,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
    mainEntityOfPage: `${SITE.url}/resources/${article.slug}`,
  };

  return (
    <div className="bg-canvas">
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[
              { href: "/", label: "Home" },
              { href: "/resources", label: "Resources" },
              { label: article.category },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-ink-500">
            <span className="rounded-full bg-canvas-sunken px-3 py-1 text-ink-700">
              {article.category}
            </span>
            <span>{article.readMinutes} min read</span>
            <time dateTime={article.published}>
              {new Date(article.published).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </time>
          </div>

          <h1 className="mt-5 font-display text-display-lg text-ink-900">{article.title}</h1>
          <p className="mt-5 text-[1.0625rem] leading-[1.7] text-ink-600">{article.excerpt}</p>

          <div className="rule my-10" />

          <article className="space-y-6">
            {article.blocks.map((block, i) => {
              switch (block.type) {
                case "h2":
                  return (
                    <h2 key={i} className="!mt-12 font-display text-display-sm text-ink-900">
                      {block.text}
                    </h2>
                  );
                case "h3":
                  return (
                    <h3 key={i} className="!mt-8 text-base font-semibold text-ink-900">
                      {block.text}
                    </h3>
                  );
                case "p":
                  return (
                    <p key={i} className="text-[1.0625rem] leading-[1.75] text-ink-600">
                      {block.text}
                    </p>
                  );
                case "ul":
                  return (
                    <ul key={i} className="space-y-3 border-l-2 border-brass-200 pl-5">
                      {block.items.map((item) => (
                        <li key={item} className="text-[0.9375rem] leading-relaxed text-ink-600">
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
                case "ol":
                  return (
                    <ol key={i} className="list-decimal space-y-3 pl-6 marker:font-semibold marker:text-brass-500">
                      {block.items.map((item) => (
                        <li key={item} className="pl-1 text-[0.9375rem] leading-relaxed text-ink-600">
                          {item}
                        </li>
                      ))}
                    </ol>
                  );
                case "callout":
                  return (
                    <aside
                      key={i}
                      className="!mt-10 rounded-xl border border-ink-100 bg-canvas-sunken p-6"
                    >
                      <p className="text-sm font-semibold uppercase tracking-wider text-ink-700">
                        {block.title}
                      </p>
                      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-600">
                        {block.text}
                      </p>
                    </aside>
                  );
              }
            })}
          </article>

          {/* Every article closes with the form itself, not a link to it —
              someone who read to the end is as warm as they will get. */}
          <section className="mt-14 rounded-2xl border border-ink-100 bg-canvas-sunken p-6 sm:p-8">
            <p className="eyebrow">Looking for commercial property opportunities?</p>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-600">
              Register your criteria and we&rsquo;ll identify opportunities that may suit your
              budget, location and objectives. No obligation to purchase.
            </p>
            <div className="mt-7">
              <InlineForm
                source={`article:${article.slug}`}
                heading="Tell us what you're looking for"
                subheading="About two minutes."
              />
            </div>
            <p className="mt-5 text-sm text-ink-500">
              Not ready?{" "}
              <Link href="/guide" className="font-semibold text-ink-900 underline underline-offset-4">
                Get the investor starter guide
              </Link>{" "}
              instead.
            </p>
          </section>

          <section className="mt-14">
            <p className="eyebrow">Related reading</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {suggestions.map((item) => (
                <Link
                  key={item.slug}
                  href={`/resources/${item.slug}`}
                  className="rounded-xl border border-ink-100 p-5 transition hover:border-ink-200 hover:bg-canvas-sunken"
                >
                  <p className="text-[0.9375rem] font-semibold leading-snug text-ink-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs text-ink-500">{item.readMinutes} min read</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </div>
  );
}
