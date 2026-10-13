import type { Metadata, Viewport } from "next";
import "../globals.css";
import Analytics, { GtmNoScript } from "@/components/Analytics";
import { SITE } from "@/lib/site";
import { HOME_COPY, HOME_PHOTOS } from "@/lib/content/home-landing";

/**
 * Root layout for the home-buyer landing page at `/`.
 *
 * Its own route group rather than (site): the landing page needs no
 * navigation (every link out is a lead that didn't happen), and (site)'s
 * header points at the commercial-investor pages. Unlike (campaign) it is
 * indexed — it is the front page.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${HOME_COPY.metaTitle} | ${SITE.name}`,
  description: HOME_COPY.metaDescription,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: SITE.name,
    title: HOME_COPY.metaTitle,
    description: HOME_COPY.metaDescription,
    url: SITE.url,
    images: [{ url: HOME_PHOTOS.hero.src, alt: HOME_PHOTOS.hero.alt }],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#14161A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="bg-canvas">
        <GtmNoScript />
        <a
          href="#enquire"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to the form
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
