// Imported by file path: "next/og" is only resolvable inside a Next build,
// and this runs as a plain Node script.
import { ImageResponse } from "next/dist/server/og/image-response.js";
import { createElement as h } from "react";
import fs from "node:fs";
import path from "node:path";

/**
 * Renders ready-to-post social images.
 *
 *   npm run social
 *
 * Square (1080x1080) for the feed and vertical (1080x1920) for stories, using
 * the same ink/brass palette as the site so posts and landing pages look like
 * one business.
 *
 * Copy rules are the same as everywhere else: no guaranteed return, no yield
 * promise, nothing naming a property. Meta polices financial advertising hard,
 * and a compliant post is also a post that stays up.
 *
 * Written with createElement rather than JSX because Node strips types from
 * .ts files but does not compile JSX.
 */

const INK = "#14161A";
const CANVAS = "#FBFAF8";
const BRASS = "#B99A60";
const MUTED = "#A3ACB7";

type Post = { slug: string; eyebrow: string; headline: string; sub: string; kicker: string };

const POSTS: Post[] = [
  {
    slug: "01-what-are-you-looking-for",
    eyebrow: "Melbourne & Victoria",
    headline: "Looking at commercial property?",
    sub: "Tell us your budget and the area you want. We'll tell you what's realistic.",
    kicker: "No obligation · Two minutes",
  },
  {
    slug: "02-entry-price",
    eyebrow: "Entry price",
    headline: "Most people think commercial starts at $1M.",
    sub: "Smaller commercial and storage-style assets can sit well below that.",
    kicker: "Register your budget · See what may suit",
  },
  {
    slug: "03-residential-investors",
    eyebrow: "For residential investors",
    headline: "Already own an investment property?",
    sub: "Commercial works differently — longer leases, outgoings that may be recoverable, a different tenant base.",
    kicker: "Worth understanding before you decide either way",
  },
  {
    slug: "04-not-listed",
    eyebrow: "Investor access",
    headline: "Not every opportunity is publicly listed.",
    sub: "Some are distributed privately rather than through the portals. Register your criteria and we'll be in touch if something fits.",
    kicker: "Melbourne & Victoria · No obligation",
  },
];

function card(post: Post, vertical: boolean) {
  const row = (style: Record<string, unknown>, children: unknown) =>
    h("div", { style: { display: "flex", ...style } }, children as never);

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: INK,
        padding: vertical ? "150px 92px" : "88px 88px",
        fontFamily: "sans-serif",
      },
    },
    [
      // Brand
      h("div", { key: "brand", style: { display: "flex", alignItems: "center" } }, [
        h(
          "div",
          {
            key: "mark",
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#2C323A",
              marginRight: 22,
            },
          },
          h("svg", { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none" }, [
            h("path", { key: "a", d: "M3 21V9l7-4.5V21", stroke: CANVAS, strokeWidth: 1.8, strokeLinejoin: "round" }),
            h("path", { key: "b", d: "M10 21V11l7 4v6", stroke: BRASS, strokeWidth: 1.8, strokeLinejoin: "round" }),
          ]),
        ),
        row({ key: "name", fontSize: 30, color: CANVAS, fontWeight: 600 }, "Commercial Investor Access"),
      ]),

      // Message
      h("div", { key: "msg", style: { display: "flex", flexDirection: "column" } }, [
        row(
          {
            key: "eyebrow",
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: BRASS,
            fontWeight: 700,
            marginBottom: 30,
          },
          post.eyebrow,
        ),
        row(
          { key: "headline", fontSize: vertical ? 84 : 74, lineHeight: 1.08, color: CANVAS, fontWeight: 700, marginBottom: 34 },
          post.headline,
        ),
        row({ key: "sub", fontSize: vertical ? 37 : 33, lineHeight: 1.45, color: MUTED }, post.sub),
      ]),

      // Footer
      h("div", { key: "foot", style: { display: "flex", flexDirection: "column" } }, [
        row({ key: "rule", width: 140, height: 5, backgroundColor: "#9C7A46", marginBottom: 26 }, ""),
        row({ key: "kicker", fontSize: 28, color: MUTED }, post.kicker),
      ]),
    ],
  );
}

const OUT = path.join(process.cwd(), "social");
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  { suffix: "square", width: 1080, height: 1080, vertical: false },
  { suffix: "story", width: 1080, height: 1920, vertical: true },
];

for (const post of POSTS) {
  for (const size of SIZES) {
    const response = new ImageResponse(card(post, size.vertical) as never, {
      width: size.width,
      height: size.height,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const file = path.join(OUT, `${post.slug}-${size.suffix}.png`);
    fs.writeFileSync(file, buffer);
    console.log(`  social/${post.slug}-${size.suffix}.png  ${size.width}x${size.height}`);
  }
}

console.log(`\n${POSTS.length * SIZES.length} images written to ./social`);
