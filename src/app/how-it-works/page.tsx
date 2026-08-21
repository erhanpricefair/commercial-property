import type { Metadata } from "next";
import { Section, SectionHeading, CtaBand, Disclaimer, Breadcrumbs } from "@/components/ui";
import CtaLink from "@/components/CtaLink";

export const metadata: Metadata = {
  title: "How It Works | Commercial Property Investor Access",
  description:
    "Register your criteria, we review available commercial property opportunities, we present what appears relevant, and you decide. No obligation to purchase.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    n: "01",
    title: "Tell Us What You're Looking For",
    body: "Budget, location, property type and investment objectives. The registration form takes about two minutes and most of it is tapping a button rather than typing.",
    detail: [
      "The type of commercial property you're considering",
      "Your approximate budget range",
      "Where you'd like to invest",
      "What matters most — income, entry price, location, growth potential",
      "Your finance position and timeframe",
    ],
  },
  {
    n: "02",
    title: "We Review Available Opportunities",
    body: "We compare your criteria against opportunities currently available through our network. This is a manual review, not an automated email blast.",
    detail: [
      "Your budget band is compared against current price points",
      "Your preferred location is compared against where opportunities exist",
      "Your asset type preference is matched to comparable property types",
      "Your objectives are considered alongside the characteristics of each opportunity",
    ],
  },
  {
    n: "03",
    title: "We Present Relevant Opportunities",
    body: "Only opportunities that appear relevant to your requirements are presented. If nothing currently available fits what you've described, we'll tell you that rather than send something that doesn't suit.",
    detail: [
      "Property type and general location",
      "Size, price and estimated rental where available",
      "Outgoings and investment considerations",
      "The information you need to decide whether it's worth a closer look",
    ],
  },
  {
    n: "04",
    title: "You Decide",
    body: "You review the information and decide whether you want to proceed. If you'd like to look further, we can help arrange the next step. If not, that's completely fine.",
    detail: [
      "Registration does not create an obligation to purchase",
      "You can update or withdraw your criteria at any time",
      "You should obtain your own independent professional advice before making any decision",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="border-b border-ink-100 bg-canvas">
        <div className="container-page py-14 sm:py-20">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "How It Works" }]} />
          <p className="eyebrow">The Process</p>
          <h1 className="mt-4 max-w-3xl font-display text-display-xl text-ink-900">
            You tell us what you&rsquo;re looking for. We identify what may fit. You decide.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.65] text-ink-600">
            This is not a property listing portal. It works the other way around — you describe what
            you&rsquo;re after, and we look at whether anything currently available through our
            network is relevant to you.
          </p>
          <div className="mt-9">
            <CtaLink href="/register" location="how_it_works_hero">
              See Current Opportunities
            </CtaLink>
          </div>
        </div>
      </div>

      <Section tone="canvas">
        <div className="container-page">
          <div className="space-y-14 sm:space-y-20">
            {STEPS.map((step) => (
              <div key={step.n} className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-12">
                <p className="font-display text-display-lg leading-none text-brass-200 lg:w-28">
                  {step.n}
                </p>
                <div className="max-w-2xl">
                  <h2 className="font-display text-display-md text-ink-900">{step.title}</h2>
                  <p className="mt-4 text-[1.0625rem] leading-[1.7] text-ink-600">{step.body}</p>
                  <ul className="mt-6 space-y-2.5 border-l-2 border-ink-100 pl-5">
                    {step.detail.map((item) => (
                      <li key={item} className="text-[0.9375rem] leading-relaxed text-ink-500">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="sunken">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Common Questions"
                title="What registering does and doesn't mean"
              />
            </div>
            <div className="space-y-6">
              {[
                {
                  q: "Am I committing to anything?",
                  a: "No. Registration tells us what you're looking for so we can identify whether anything relevant is available. There is no obligation to purchase, inspect or proceed at any stage.",
                },
                {
                  q: "Will I be sent a list of properties?",
                  a: "No. We don't publish or distribute stock lists. If something appears to line up with your criteria, we'll contact you about it directly.",
                },
                {
                  q: "What if nothing suits right now?",
                  a: "We'll tell you. Your criteria stay on file and we'll get in touch if something relevant becomes available, unless you ask us not to.",
                },
                {
                  q: "What happens to my information?",
                  a: "Your criteria and contact details are used to identify and discuss opportunities with you. See our privacy policy for the detail.",
                },
                {
                  q: "Do you provide financial advice?",
                  a: "No. Information provided is general in nature. You should obtain your own independent financial, legal and taxation advice before making an investment decision.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-ink-100 pb-6 last:border-0">
                  <h3 className="text-base font-semibold text-ink-900">{q}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">{a}</p>
                </div>
              ))}
              <Disclaimer />
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Ready to tell us what you're looking for?"
        body="Register your investment criteria and we'll identify commercial property opportunities that may suit your budget, strategy and objectives."
        secondaryLabel="Read the investor guide"
        secondaryHref="/guide"
      />
    </>
  );
}
