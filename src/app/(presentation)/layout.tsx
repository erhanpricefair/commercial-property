import type { Metadata } from "next";
import "../globals.css";

/**
 * Presentations get a bare ROOT layout, in their own route group: no public
 * header, no footer, no analytics.
 *
 * A private link must not carry the recipient into the public site's
 * navigation, and no third-party tag should ever record which private
 * opportunity was viewed. Being a separate root layout — rather than a nested
 * one — is what guarantees that. The unsubscribe page lives here for the same
 * reason: its URL carries a per-person token that analytics must never see.
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
