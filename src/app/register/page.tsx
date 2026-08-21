import type { Metadata } from "next";
import InvestorForm from "@/components/InvestorForm";
import { CheckList, Disclaimer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Register for Investor Access | Commercial Property Opportunities",
  description:
    "Tell us your budget, location and property type. We'll identify commercial property investment opportunities that may suit your criteria. No obligation to purchase.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Register for Investor Access | Commercial Property Opportunities",
    description:
      "Tell us your budget, location and property type and we'll identify commercial property opportunities that may suit.",
    url: "/register",
  },
};

export default function RegisterPage() {
  return (
    <div className="bg-canvas-sunken">
      <div className="container-page py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">Investor Access</p>
            <h1 className="mt-4 font-display text-display-lg text-ink-900">
              Tell us what you&rsquo;re looking for
            </h1>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] text-ink-600">
              Seven short questions. We&rsquo;ll compare your criteria against the opportunities
              currently available through our network and get in touch if something appears
              relevant.
            </p>

            <div className="mt-8">
              <p className="eyebrow">Why Register?</p>
              <div className="mt-4">
                <CheckList
                  items={[
                    "Access selected opportunities",
                    "Match opportunities to your criteria",
                    "Avoid searching through hundreds of irrelevant listings",
                    "Receive relevant information directly",
                    "No obligation to purchase",
                  ]}
                />
              </div>
            </div>

            <Disclaimer className="mt-8" />
          </div>

          <div>
            <InvestorForm source="register_page" />
          </div>
        </div>
      </div>
    </div>
  );
}
