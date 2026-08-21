import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics, { GtmNoScript } from "@/components/Analytics";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Commercial Property Investment Opportunities Melbourne | Investor Access",
    template: `%s | ${SITE.name}`,
  },
  description:
    "Explore selected commercial property investment opportunities across Melbourne. Register your criteria and receive opportunities that may suit your budget and investment strategy.",
  applicationName: SITE.name,
  keywords: [
    "commercial property investment",
    "commercial property Melbourne",
    "warehouse investment",
    "industrial property investment",
    "storage investment",
    "small commercial property",
    "income producing property",
  ],
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: SITE.name,
    title: "Commercial Property Investment Opportunities Melbourne | Investor Access",
    description:
      "Register your investment criteria and we'll identify commercial property opportunities that may suit your budget, strategy and objectives.",
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: "Commercial Property Investment Opportunities | Investor Access",
    description:
      "Register your investment criteria and we'll identify commercial property opportunities that may suit your budget, strategy and objectives.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
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

/**
 * Organisation schema only. Deliberately no Product, Offer, Residence or
 * RealEstateListing markup anywhere on this site — structured data describing
 * an individual property is exactly the sort of leak the platform must avoid.
 */
const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  areaServed: [
    { "@type": "State", name: "Victoria" },
    { "@type": "Country", name: "Australia" },
  ],
  serviceType: "Commercial property investor matching service",
  ...(SITE.email ? { email: SITE.email } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="flex min-h-screen flex-col">
        <GtmNoScript />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
        />
      </body>
    </html>
  );
}
