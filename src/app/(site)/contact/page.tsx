import Link from "next/link";
import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { Breadcrumbs, Disclaimer } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Commercial Property Investor Access",
  description:
    "Get in touch about commercial property investment opportunities in Melbourne and Victoria. No obligation.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-canvas-sunken">
      <div className="container-page py-12 sm:py-16 lg:py-20">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Contact" }]} />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 font-display text-display-lg text-ink-900">
              Talk to us about commercial property
            </h1>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] text-ink-600">
              Happy to answer questions about how commercial property investment works, what&rsquo;s
              realistic at a given price point, or how our process works. No obligation.
            </p>

            <div className="mt-9 space-y-5">
              {SITE.email && (
                <div>
                  <p className="eyebrow">Email</p>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="mt-1.5 block text-base font-medium text-ink-900 underline underline-offset-4 hover:text-brass-600"
                  >
                    {SITE.email}
                  </a>
                </div>
              )}
              {SITE.phone && (
                <div>
                  <p className="eyebrow">Phone</p>
                  <a
                    href={`tel:${SITE.phone.replace(/\s+/g, "")}`}
                    className="mt-1.5 block text-base font-medium text-ink-900 underline underline-offset-4 hover:text-brass-600"
                  >
                    {SITE.phone}
                  </a>
                </div>
              )}
              <div>
                <p className="eyebrow">Area served</p>
                <p className="mt-1.5 text-base text-ink-700">
                  {SITE.region}, with capacity to consider opportunities elsewhere in Australia.
                </p>
              </div>
            </div>

            <div className="mt-9 rounded-xl border border-ink-100 bg-canvas-raised p-6">
              <p className="text-sm font-semibold text-ink-900">
                Looking for opportunities rather than information?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                The registration form captures your criteria properly, which means we can be far more
                useful than a general enquiry allows.
              </p>
              <Link href="/register" className="btn-secondary mt-4 !min-h-[2.75rem] text-sm">
                Register for Investor Access
              </Link>
            </div>

            <Disclaimer className="mt-8" />
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
