import type { LegalSection } from "@/lib/content/legal";
import { BrandFooter, BrandHeader } from "./Shell";

/** Privacy policy / terms in the NewPF shell — same content as before, new setting. */
export default function LegalDocument({
  title,
  intro,
  sections,
  updated,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
  updated: string;
}) {
  return (
    <div className="nf">
      <BrandHeader />
      <main id="main" className="nf-wrap grid gap-10 py-16 lg:grid-cols-12 lg:gap-x-10 lg:py-24">
        <div className="lg:col-span-4">
          <p className="nf-kicker text-olive">Information</p>
          <h1 className="nf-serif mt-6 text-[clamp(2.5rem,5vw,4.25rem)] font-light leading-[1.02] tracking-[-0.03em] text-charcoal">
            {title}
          </h1>
          <p className="mt-6 text-sm text-charcoal-muted">Last updated: {updated}</p>
        </div>
        <div className="max-w-[44rem] lg:col-span-8">
          <p className="text-[1.125rem] leading-[1.7] text-charcoal-graphite">{intro}</p>
          <div className="mt-12 border-t border-charcoal">
            {sections.map((section) => (
              <section key={section.heading} className="border-b border-charcoal/15 py-8">
                <h2 className="nf-serif text-[1.625rem] leading-tight tracking-[-0.015em] text-charcoal">{section.heading}</h2>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="mt-4 text-[0.9375rem] leading-[1.75] text-charcoal-graphite">
                    {p}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 space-y-2 border-l border-olive pl-5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="text-[0.9375rem] leading-relaxed text-charcoal-graphite">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
