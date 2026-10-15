import Link from "next/link";
import { SITE } from "@/lib/site";
import { HOME_COPY } from "@/lib/content/home-landing";

/**
 * NewPF header and footer, shared by the landing page and its legal pages.
 * The header's links are in-page anchors (from the legal pages they lead back
 * to the landing page), so there is no navigation away from the funnel.
 */

export function Wordmark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <span className={`flex items-baseline gap-3 ${tone === "dark" ? "text-charcoal" : "text-ivory"}`}>
      <span className="nf-serif text-[1.65rem] leading-none tracking-[-0.02em]">{SITE.name}</span>
      <span
        className={`hidden border-l pl-3 font-grotesk text-[0.6875rem] font-semibold uppercase tracking-[0.18em] sm:inline ${
          tone === "dark" ? "border-charcoal/25 text-charcoal-graphite" : "border-ivory/30 text-ivory/75"
        }`}
      >
        {HOME_COPY.descriptor}
      </span>
    </span>
  );
}

export function BrandHeader() {
  const telHref = SITE.phone ? `tel:${SITE.phone.replace(/[^\d+]/g, "")}` : null;
  return (
    <header className="border-b border-charcoal/15">
      <div className="nf-wrap flex h-[4.5rem] items-center justify-between gap-6">
        <a href="/" className="flex min-h-[48px] items-center" aria-label={`${SITE.name} — home`}>
          <Wordmark />
        </a>
        <nav aria-label="On this page" className="flex items-center gap-1 sm:gap-6">
          <a href="/#opportunities" className="hidden min-h-[48px] items-center text-sm font-medium text-charcoal-graphite hover:text-charcoal md:inline-flex">
            Opportunities
          </a>
          <a href="/#process" className="hidden min-h-[48px] items-center text-sm font-medium text-charcoal-graphite hover:text-charcoal md:inline-flex">
            How it works
          </a>
          {telHref && (
            <a href={telHref} className="hidden min-h-[48px] items-center text-sm font-medium text-charcoal-graphite hover:text-charcoal lg:inline-flex">
              {SITE.phone}
            </a>
          )}
          <a
            href="/#register"
            className="inline-flex min-h-[44px] items-center border border-charcoal px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
          >
            Register
          </a>
        </nav>
      </div>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="bg-charcoal text-ivory">
      <div className="nf-wrap pb-28 pt-16 sm:pb-12 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="nf-serif text-[3.5rem] leading-none tracking-[-0.03em] sm:text-[4.5rem]">{SITE.name}</p>
            <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-limestone">
              {HOME_COPY.descriptor} in Melbourne&rsquo;s north, introduced personally.
            </p>
          </div>

          <dl className="grid gap-8 text-sm sm:grid-cols-2 lg:col-span-7 lg:grid-cols-3">
            <div>
              <dt className="nf-kicker text-limestone-deep">Company</dt>
              <dd className="mt-3 leading-relaxed text-ivory">
                {SITE.legalName}
                {SITE.abn && <span className="block text-limestone">ABN {SITE.abn}</span>}
              </dd>
            </div>
            <div>
              <dt className="nf-kicker text-limestone-deep">Contact</dt>
              <dd className="mt-3 space-y-1">
                {SITE.email && (
                  <a href={`mailto:${SITE.email}`} className="inline-flex min-h-[44px] items-center text-ivory underline-offset-4 hover:underline">
                    {SITE.email}
                  </a>
                )}
                {SITE.phone && (
                  <a href={`tel:${SITE.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-[44px] items-center text-ivory underline-offset-4 hover:underline">
                    {SITE.phone}
                  </a>
                )}
              </dd>
            </div>
            <div>
              <dt className="nf-kicker text-limestone-deep">Information</dt>
              <dd className="mt-3 flex flex-col">
                <Link href="/privacy" className="inline-flex min-h-[44px] items-center text-ivory underline-offset-4 hover:underline">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="inline-flex min-h-[44px] items-center text-ivory underline-offset-4 hover:underline">
                  Terms of Use
                </Link>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-14 grid gap-6 border-t border-ivory/20 pt-8 text-xs leading-relaxed text-limestone lg:grid-cols-12">
          <p className="lg:col-span-6">{HOME_COPY.disclaimer}</p>
          <p className="lg:col-span-5 lg:col-start-8">{HOME_COPY.imageNote}</p>
        </div>
        <p className="mt-8 text-xs text-limestone-deep">
          © {new Date().getFullYear()} {SITE.legalName}
        </p>
      </div>
    </footer>
  );
}
