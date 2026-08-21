import Link from "next/link";
import type { Metadata } from "next";
import { CheckList } from "@/components/ui";

export const metadata: Metadata = {
  title: "Registration Received",
  description: "Thanks for registering for Commercial Investor Access. We've received your criteria.",
  // A conversion confirmation page has no search value and shouldn't collect
  // organic traffic that skips the form.
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <div className="bg-canvas-sunken">
      <div className="container-narrow py-16 sm:py-24">
        <div className="card text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink-900" aria-hidden="true">
            <svg className="h-6 w-6 text-brass-400" viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <h1 className="mt-6 font-display text-display-md text-ink-900">
            Thanks — your criteria have been received
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[1.0625rem] leading-[1.7] text-ink-600">
            We&rsquo;ve sent a confirmation to your email. Here&rsquo;s what happens next.
          </p>

          <ol className="mx-auto mt-9 max-w-md space-y-5 text-left">
            {[
              {
                t: "We review what's available",
                d: "Your criteria are compared against the opportunities currently available through our network.",
              },
              {
                t: "We get in touch if something fits",
                d: "You'll hear from us using the contact method you selected. If nothing suitable is available right now, we'll keep your criteria on file.",
              },
              {
                t: "You decide",
                d: "You review the information and decide whether you want to take it further. There's no obligation at any stage.",
              },
            ].map((item, i) => (
              <li key={item.t} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-canvas-sunken text-sm font-semibold text-ink-800">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-ink-900">{item.t}</p>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-600">{item.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-xl border border-ink-100 bg-canvas-sunken p-6 text-left">
            <p className="eyebrow">While you wait</p>
            <div className="mt-4">
              <CheckList
                items={[
                  <>
                    Read the{" "}
                    <Link href="/guide" className="font-semibold text-ink-900 underline underline-offset-4">
                      Commercial Property Investor Starter Guide
                    </Link>
                  </>,
                  <>
                    Browse our{" "}
                    <Link href="/resources" className="font-semibold text-ink-900 underline underline-offset-4">
                      investor resources
                    </Link>
                  </>,
                  <>
                    Understand{" "}
                    <Link href="/how-it-works" className="font-semibold text-ink-900 underline underline-offset-4">
                      how the process works
                    </Link>
                  </>,
                ]}
              />
            </div>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-ink-400">
            Information provided is general in nature and does not constitute financial, legal or
            investment advice. Commercial property involves risks and investors should conduct their
            own due diligence and obtain independent professional advice before making an investment
            decision.
          </p>
        </div>
      </div>
    </div>
  );
}
