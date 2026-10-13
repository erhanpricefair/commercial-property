/* eslint-disable @next/next/no-img-element -- remote stock photos, sized by the CDN URL */
import Link from "next/link";
import HomeEnquiryForm from "@/components/HomeEnquiryForm";
import { SITE } from "@/lib/site";
import { HOME_COPY, HOME_PHOTOS } from "@/lib/content/home-landing";

/**
 * Home-buyer lead-generation landing page.
 *
 * One job: get the form filled in. The form sits in the first screen on every
 * device, the only links are the legal ones (and the phone number, which is
 * itself a lead), and a sticky button on mobile brings the form back into view.
 * All copy and photos come from `src/lib/content/home-landing.ts`.
 */
export default function HomeLandingPage() {
  const telHref = SITE.phone ? `tel:${SITE.phone.replace(/[^\d+]/g, "")}` : null;

  return (
    <>
      {/* ---------- Top bar ---------- */}
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="container-page flex h-16 items-center justify-between">
          <span className="flex items-center gap-2.5 text-canvas">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-canvas/15 backdrop-blur" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M10 21V11l7 4v6" stroke="#E3D5BC" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[0.95rem] font-semibold tracking-tight">{SITE.name}</span>
          </span>
          {telHref && (
            <a
              href={telHref}
              className="inline-flex min-h-[48px] items-center rounded-lg px-3 text-sm font-semibold text-canvas hover:bg-canvas/10"
            >
              {SITE.phone}
            </a>
          )}
        </div>
      </header>

      <main>
        {/* ---------- Hero: photo + form ---------- */}
        <section className="relative bg-ink-800">
          <img
            src={HOME_PHOTOS.hero.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
          {/* Darkens the photo enough for white text at AA contrast. */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/60 to-ink-900/85 lg:bg-gradient-to-r lg:from-ink-900/85 lg:via-ink-900/60 lg:to-ink-900/30" aria-hidden="true" />

          <div className="container-page relative grid gap-8 pb-12 pt-24 sm:pt-28 lg:grid-cols-[1fr_28rem] lg:items-center lg:gap-14 lg:pb-20 lg:pt-32">
            <div className="text-canvas">
              <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-brass-200">
                {HOME_COPY.eyebrow}
              </p>
              <h1 className="mt-3 font-display text-display-lg text-canvas sm:text-display-xl">
                {HOME_COPY.headline}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-100">{HOME_COPY.subhead}</p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink-100">
                {HOME_COPY.trust.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-brass-200" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8.5l3 3L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div id="enquire" className="scroll-mt-6 rounded-2xl bg-canvas-raised p-6 shadow-lift sm:p-8">
              <h2 className="font-display text-display-sm text-ink-900">Tell us what you&rsquo;re looking for</h2>
              <p className="mt-1.5 mb-6 text-sm text-ink-500">Takes under a minute.</p>
              <HomeEnquiryForm />
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="container-page py-16 sm:py-20">
          <h2 className="font-display text-display-md text-ink-900">{HOME_COPY.stepsHeading}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOME_COPY.steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-ink-100 bg-canvas-raised p-6">
                <span className="font-display text-display-sm text-brass-600" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="mt-2 text-base font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Photos ---------- */}
        <section className="container-page pb-16 sm:pb-20" aria-label="Example homes">
          <div className="grid gap-4 sm:grid-cols-3">
            {HOME_PHOTOS.gallery.map((photo) => (
              <div key={photo.src} className="aspect-[4/3] overflow-hidden rounded-2xl bg-ink-100">
                <img src={photo.src} alt={photo.alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">{HOME_COPY.galleryCaption}</p>
        </section>

        {/* ---------- Closing CTA ---------- */}
        <section className="bg-ink-900">
          <div className="container-page flex flex-col items-start gap-6 py-14 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-display-md text-canvas">{HOME_COPY.closingHeading}</h2>
              <p className="mt-2 text-ink-200">{HOME_COPY.closingBody}</p>
            </div>
            <a href="#enquire" className="btn-brass">Get started</a>
          </div>
        </section>
      </main>

      {/* ---------- Footer (legal only) ---------- */}
      <footer className="border-t border-ink-100 bg-canvas-sunken pb-24 sm:pb-0">
        <div className="container-page py-8">
          <p className="text-xs leading-relaxed text-ink-500">{HOME_COPY.disclaimer}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 text-xs text-ink-400">
            <p>
              © {new Date().getFullYear()} {SITE.legalName}
              {SITE.abn ? ` · ABN ${SITE.abn}` : ""}
            </p>
            <div className="flex flex-wrap gap-x-5">
              <Link href="/privacy" className="inline-flex min-h-[44px] items-center hover:text-ink-700">Privacy Policy</Link>
              <Link href="/terms" className="inline-flex min-h-[44px] items-center hover:text-ink-700">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ---------- Sticky mobile CTA ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-canvas-raised/95 p-3 backdrop-blur sm:hidden">
        <a href="#enquire" className="btn-primary w-full">Get started</a>
      </div>
    </>
  );
}
