import HomeEnquiryForm from "@/components/HomeEnquiryForm";
import OpportunityIndex from "@/components/brand/OpportunityIndex";
import StickyRegister from "@/components/brand/StickyRegister";
import { BrandFooter, BrandHeader } from "@/components/brand/Shell";
import { Streetscape, TerraceElevation } from "@/components/brand/Artwork";
import { HOME_COPY, SUBURB_COUNCILS, publishableFeaturedHomes } from "@/lib/content/home-landing";

/**
 * NewPF — established townhouses in Melbourne's north.
 *
 * Composition: an asymmetric twelve-column grid, thin rules and numbered
 * sections in the manner of an architecture journal, with full-width colour
 * fields (olive, limestone, charcoal) instead of cards. The conversion path
 * runs hero → opportunities by suburb → register: choosing a suburb selects
 * it in the form and scrolls there.
 *
 * Builder marketing restrictions: no property photographs or addresses. The
 * imagery is original drawing (components/brand/Artwork) and the index shows a
 * builder's photo only where one has been authorised. All copy and the suburb
 * list come from src/lib/content/home-landing.ts.
 */

// Re-render hourly so a builder approval that lapses (`approvalExpires`)
// takes its suburb down without waiting for a redeploy.
export const revalidate = 3600;

function SectionLabel({ n, children, tone = "dark" }: { n: string; children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <p className={`nf-kicker flex items-center gap-4 ${tone === "dark" ? "text-olive" : "text-ivory/85"}`}>
      <span className="tabular-nums">{n}</span>
      <span aria-hidden="true" className={`h-px w-10 ${tone === "dark" ? "bg-olive/50" : "bg-ivory/50"}`} />
      <span>{children}</span>
    </p>
  );
}

export default function HomeLandingPage() {
  const homes = publishableFeaturedHomes();
  const suburbs = homes.map((h) => h.suburb);
  const c = HOME_COPY;

  return (
    <div className="nf">
      <BrandHeader />

      <main id="main">
        {/* ---------------- 00 · First screen ---------------- */}
        <section id="top" className="nf-wrap grid gap-10 pb-14 pt-10 sm:pt-14 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-12 lg:gap-x-12 lg:pb-14 lg:pt-14">
          <div className="flex flex-col lg:col-span-7 lg:pr-6">
            <p className="nf-kicker text-olive">{c.heroEyebrow}</p>

            <h1 className="nf-serif mt-8 text-[clamp(3rem,6.1vw,6rem)] font-light leading-[0.96] tracking-[-0.035em] text-charcoal">
              <span className="block">{c.headline[0]}</span>
              {/* Italic capitals overhang to the left; a hair of padding keeps
                  the A on the text edge. */}
              <span className="block pl-[0.05em] italic text-olive">{c.headline[1]}</span>
            </h1>

            <p className="mt-8 max-w-[34rem] text-[1.125rem] leading-[1.65] text-charcoal-graphite sm:text-[1.1875rem]">
              {c.subhead}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
              <a href="#opportunities" className="nf-btn-primary group">
                {c.primaryCta}
                <span className="nf-arrow" aria-hidden="true">→</span>
              </a>
              <a href="#register" className="nf-link self-start text-charcoal sm:self-auto">
                {c.secondaryCta}
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-charcoal/20 pt-6 sm:grid-cols-[1fr_1fr_1.6fr] lg:mt-auto">
              {c.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="nf-kicker text-charcoal-muted">{fact.label}</dt>
                  <dd className="mt-2 text-[0.9375rem] font-medium text-charcoal">{fact.value}</dd>
                </div>
              ))}
              {suburbs.length > 0 && (
                <div className="col-span-2 sm:col-span-1">
                  <dt className="nf-kicker text-charcoal-muted">Suburbs</dt>
                  <dd className="mt-2 text-[0.9375rem] font-medium text-charcoal">{suburbs.join(" · ")}</dd>
                </div>
              )}
            </dl>
          </div>

          <figure className="flex flex-col lg:col-span-5">
            <div className="relative aspect-[5/6] overflow-hidden bg-limestone sm:aspect-[4/3] lg:aspect-auto lg:min-h-[32rem] lg:flex-1">
              <TerraceElevation className="absolute inset-0 h-full w-full" />
            </div>
            <figcaption className="mt-3 flex gap-4 font-grotesk text-[0.6875rem] uppercase tracking-[0.16em] text-charcoal-muted">
              <span className="whitespace-nowrap">Fig. 01</span>
              <span>Illustrative elevation. Not a depiction of any property.</span>
            </figcaption>
          </figure>
        </section>

        {/* ---------------- 01 · Approach ---------------- */}
        <section className="border-t border-charcoal/15">
          <div className="nf-wrap grid gap-10 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-28">
            <div className="lg:col-span-3">
              <SectionLabel n="01">{c.approachLabel}</SectionLabel>
            </div>
            <div className="lg:col-span-9">
              <h2 className="nf-serif max-w-[18ch] text-[clamp(2.25rem,5vw,4.5rem)] font-light leading-[1.02] tracking-[-0.03em] text-charcoal">
                {c.approachStatement}
              </h2>
              <p className="mt-8 max-w-[40rem] text-[1.0625rem] leading-[1.75] text-charcoal-graphite">{c.approachBody}</p>

              <ol className="mt-16 grid border-t border-charcoal md:grid-cols-3">
                {c.principles.map((p, i) => (
                  <li
                    key={p.title}
                    className={`py-8 md:pr-8 ${i > 0 ? "border-t border-charcoal/15 md:border-l md:border-t-0 md:pl-8" : ""}`}
                  >
                    <span className="font-grotesk text-xs font-semibold tabular-nums tracking-[0.16em] text-olive">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="nf-serif mt-4 text-[1.75rem] leading-tight tracking-[-0.015em] text-charcoal">{p.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-[1.7] text-charcoal-graphite">{p.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------- 02 · Opportunities (olive field) ---------------- */}
        {homes.length > 0 && (
          <section id="opportunities" className="scroll-mt-4 bg-olive text-ivory">
            <div className="nf-wrap grid gap-10 pb-10 pt-20 lg:grid-cols-12 lg:gap-x-10 lg:pt-28">
              <div className="lg:col-span-3">
                <SectionLabel n="02" tone="light">{c.opportunitiesLabel}</SectionLabel>
              </div>
              <div className="lg:col-span-9">
                <h2 className="nf-serif max-w-[16ch] text-[clamp(2.25rem,5vw,4.5rem)] font-light leading-[1.02] tracking-[-0.03em]">
                  {c.opportunitiesHeading}
                </h2>
                <p className="mt-6 max-w-[38rem] text-[1.0625rem] leading-[1.7] text-ivory/90">{c.opportunitiesBody}</p>
              </div>
            </div>
            <div className="nf-wrap pb-20 lg:pb-24">
              <OpportunityIndex
                cta={c.opportunityCta}
                elsewhere={{ heading: c.elsewhereHeading, note: c.elsewhereNote, cta: c.elsewhereCta }}
                items={homes.map((h) => ({ suburb: h.suburb, council: SUBURB_COUNCILS[h.suburb], photo: h.photo }))}
              />
            </div>
            <Streetscape className="block h-14 w-full opacity-60 sm:h-20" />
          </section>
        )}

        {/* ---------------- 03 · Who it's for ---------------- */}
        <section className="nf-wrap grid gap-10 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-28">
          <div className="lg:col-span-3">
            <SectionLabel n="03">{c.audienceLabel}</SectionLabel>
          </div>
          <div className="lg:col-span-9">
            <ul className="nf-serif text-[clamp(2.5rem,6.4vw,5.75rem)] font-light leading-[1.04] tracking-[-0.035em] text-charcoal">
              {c.audience.map((line, i) => (
                <li key={line} style={{ paddingLeft: `${i * 0.6}em` }} className={i % 2 ? "italic text-olive" : ""}>
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-[30rem] border-l border-olive pl-5 text-[1.0625rem] leading-[1.7] text-charcoal-graphite">
              {c.audienceNote}
            </p>
          </div>
        </section>

        {/* ---------------- 04 · Process (limestone field) ---------------- */}
        <section id="process" className="scroll-mt-4 bg-limestone">
          <div className="nf-wrap grid gap-10 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-24">
            <div className="lg:col-span-3">
              <SectionLabel n="04">{c.processLabel}</SectionLabel>
            </div>
            <ol className="grid gap-0 sm:grid-cols-3 lg:col-span-9">
              {c.process.map((step, i) => (
                <li key={step.title} className={`border-t border-charcoal pt-6 sm:pr-8 ${i > 0 ? "mt-10 sm:mt-0" : ""}`}>
                  <span className="nf-serif block text-[4rem] font-light leading-none text-olive">{i + 1}</span>
                  <h3 className="mt-6 text-lg font-semibold text-charcoal">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-[1.7] text-charcoal-graphite">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------- 05 · Register ---------------- */}
        <section id="register" className="scroll-mt-4 bg-ivory-paper">
          <div className="nf-wrap grid gap-12 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-28">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-10">
                <SectionLabel n="05">{c.registerLabel}</SectionLabel>
                <h2 className="nf-serif mt-8 text-[clamp(2.25rem,4.6vw,4rem)] font-light leading-[1.02] tracking-[-0.03em] text-charcoal">
                  {c.registerHeading}
                </h2>
                <p className="mt-6 max-w-sm text-[1.0625rem] leading-[1.7] text-charcoal-graphite">{c.registerBody}</p>
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <HomeEnquiryForm suburbs={suburbs} />
            </div>
          </div>
        </section>
      </main>

      <BrandFooter />
      <StickyRegister label={c.secondaryCta} />
    </div>
  );
}
