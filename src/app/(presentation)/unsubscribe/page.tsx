import type { Metadata } from "next";
import UnsubscribeForm from "@/components/UnsubscribeForm";
import { SITE } from "@/lib/site";

/**
 * Landing page for the unsubscribe link in every email.
 *
 * Confirmation is a button press rather than the page load itself, because
 * mail scanners open links; the mail client's own one-click button posts to
 * /api/unsubscribe directly and needs no page.
 *
 * It lives in the bare (presentation) root layout, not (site): the URL carries
 * the person's token, and the public layout would hand that URL to GA and the
 * Meta Pixel. It is also the one page without the registration form — someone
 * asking to hear less from us is not a conversion opportunity.
 */
export const metadata: Metadata = {
  title: `Unsubscribe | ${SITE.name}`,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t.slice(0, 128) : "";

  return (
    <main className="container-page min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-display-md text-ink-900">Unsubscribe</h1>
        {token ? (
          <>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-600">
              Press the button below to stop receiving marketing emails from {SITE.name}.
            </p>
            <div className="mt-8">
              <UnsubscribeForm token={token} />
            </div>
          </>
        ) : (
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-600">
            This link is incomplete. Please use the unsubscribe link from the email you received, or
            email{" "}
            <a href={`mailto:${SITE.email}`} className="font-semibold underline">
              {SITE.email}
            </a>{" "}
            and we&rsquo;ll remove you.
          </p>
        )}
      </div>
    </main>
  );
}
