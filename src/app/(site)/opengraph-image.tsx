import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, OG_CONTENT_TYPE } from "@/components/OgImage";

export const runtime = "nodejs";
export const alt = "Commercial property investment opportunities — register your criteria";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgCard
      eyebrow="Private Investor Access"
      title="Commercial property opportunities, matched to your criteria"
    />,
    size,
  );
}
