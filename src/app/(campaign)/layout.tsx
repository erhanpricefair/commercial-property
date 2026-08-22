import type { Metadata } from "next";
import "../globals.css";
import Analytics, { GtmNoScript } from "@/components/Analytics";
import { SITE } from "@/lib/site";

/**
 * Paid-campaign landing pages get their own ROOT layout.
 *
 * Deliberately no site header and no footer navigation. Every link out of a
 * paid landing page is a leak: the click has already been paid for, and a
 * visitor who wanders into the blog is a visitor who doesn't register. Only
 * the legal links remain, because they have to.
 *
 * Analytics IS loaded here — unlike the admin and presentation groups — since
 * measuring these pages is the entire point of running the campaign.
 */
export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  metadataBase: new URL(SITE.url),
  robots: {
    // Campaign pages duplicate the message of the SEO pages by design. Keeping
    // them out of the index avoids competing with the pages built to rank,
    // while `follow` still lets any link equity pass through.
    index: false,
    follow: true,
  },
};

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="bg-canvas">
        <GtmNoScript />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
