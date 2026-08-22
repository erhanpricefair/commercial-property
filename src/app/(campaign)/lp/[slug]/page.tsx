import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CampaignPage from "@/components/CampaignPage";
import { CAMPAIGNS, getCampaign } from "@/lib/content/campaigns";

/**
 * Campaign landing pages, served at /lp/<slug>.
 *
 * Static content only — like the SEO pages, these read nothing from the
 * database, so a landing page cannot leak an opportunity even in principle.
 */
export function generateStaticParams() {
  return CAMPAIGNS.map((campaign) => ({ slug: campaign.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) return {};

  return {
    title: campaign.metaTitle,
    description: campaign.metaDescription,
    // Not indexed: these pages intentionally duplicate the SEO pages' message
    // and exist to receive paid clicks, not to rank.
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "en_AU",
      title: campaign.metaTitle,
      description: campaign.metaDescription,
      url: `/lp/${campaign.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.metaTitle,
      description: campaign.metaDescription,
    },
  };
}

export default async function CampaignRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = getCampaign(slug);
  if (!campaign) notFound();

  return <CampaignPage campaign={campaign} />;
}
