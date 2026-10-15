import type { Metadata, Viewport } from "next";
import "../globals.css";
import Analytics, { GtmNoScript } from "@/components/Analytics";
import { SITE } from "@/lib/site";
import { HOME_COPY } from "@/lib/content/home-landing";
import { editorial, grotesk } from "./fonts";

/**
 * Root layout for NewPF: the landing page at `/` and its privacy and terms
 * pages.
 *
 * Its own route group rather than (site): the landing page needs no
 * navigation away from the funnel, and (site)'s header points at the
 * commercial-investor pages. Unlike (campaign) it is indexed — it is the
 * front page. Typefaces are self-hosted (./fonts.ts).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${HOME_COPY.metaTitle} | ${SITE.name}`, template: `%s | ${SITE.name}` },
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
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#F3EFE6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${editorial.variable} ${grotesk.variable}`}>
      <body className="bg-ivory">
        <GtmNoScript />
        <a
          href="#register"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-charcoal focus:px-4 focus:py-3 focus:text-ivory"
        >
          Skip to the registration form
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
