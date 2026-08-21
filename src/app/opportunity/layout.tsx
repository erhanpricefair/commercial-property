import type { Metadata } from "next";
import "../globals.css";

/**
 * Presentations get a bare root layout: no public header, no footer, no
 * analytics. A private link should not carry the visitor into the public site's
 * navigation, and no tag should record which private page was viewed.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
};

export default function PresentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      </head>
      <body className="bg-canvas">{children}</body>
    </html>
  );
}
