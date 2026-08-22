import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/components/OgImage";
import { CAMPAIGNS, getCampaign } from "@/lib/content/campaigns";

export const runtime = "nodejs";
export const alt = "Commercial property investment opportunities";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return CAMPAIGNS.map((campaign) => ({ slug: campaign.slug }));
}

/**
 * Each campaign gets its own link preview, so a shared or re-posted ad link
 * carries that campaign's message rather than a generic one.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = getCampaign(slug);

  return new ImageResponse(
    <OgCard
      eyebrow={campaign?.eyebrow ?? "Investor Access"}
      title={campaign?.h1 ?? "Commercial property opportunities, matched to your criteria"}
      note="Register your criteria · No obligation to purchase"
    />,
    size,
  );
}
