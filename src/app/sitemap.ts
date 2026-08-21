import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { LANDING_PAGES } from "@/lib/content/landing-pages";
import { ARTICLES } from "@/lib/content/articles";

/**
 * The sitemap is built exclusively from static content models.
 *
 * It never queries the database, so a private opportunity or a tokenised
 * presentation cannot appear here even by accident. `scripts/privacy-audit.ts`
 * asserts this by checking the generated sitemap for private paths.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/why-commercial-property`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/opportunities`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/guide/read`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const landing: MetadataRoute.Sitemap = LANDING_PAGES.map((page) => ({
    url: `${SITE.url}/${page.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const articles: MetadataRoute.Sitemap = ARTICLES.map((article) => ({
    url: `${SITE.url}/resources/${article.slug}`,
    lastModified: new Date(article.published),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...core, ...landing, ...articles];
}
