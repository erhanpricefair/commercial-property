import { SITE } from "@/lib/site";

/**
 * Shared Open Graph card, rendered to PNG by `next/og`.
 *
 * This is what a shared link looks like in a Facebook or Instagram feed, in a
 * WhatsApp forward and in an email preview — often the first impression of the
 * business, and one that renders at thumbnail size. So: one short line of type,
 * heavy contrast, brand mark, nothing that needs to be read closely.
 *
 * Satori (which powers ImageResponse) supports a subset of CSS: flexbox only,
 * no `gap` shorthand quirks, every element that has children needs an explicit
 * `display`. Keep it simple and it stays reliable.
 */
export function OgCard({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: "#14161A",
        padding: "72px 80px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: "#2C323A",
            marginRight: 18,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M10 21V11l7 4v6" stroke="#B99A60" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#FBFAF8", fontWeight: 600 }}>
          {SITE.name}
        </div>
      </div>

      {/* Message */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#B99A60",
            fontWeight: 700,
            marginBottom: 22,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            lineHeight: 1.1,
            color: "#FBFAF8",
            fontWeight: 700,
            maxWidth: 940,
          }}
        >
          {title}
        </div>
      </div>

      {/* Footer rule + note */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", width: 120, height: 4, backgroundColor: "#9C7A46", marginBottom: 22 }} />
        <div style={{ display: "flex", fontSize: 24, color: "#A3ACB7" }}>
          {note ?? "Register your criteria · No obligation to purchase"}
        </div>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";
