import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  loadPresentationByToken,
  recordPresentationView,
} from "@/lib/repositories/opportunities";
import { AVAILABILITY_LABELS, COMPLETION_LABELS, labelFor } from "@/lib/taxonomy";
import { SITE, DISCLAIMER_FULL } from "@/lib/site";
import {
  CommercialArt,
  IndustrialArt,
  StorageArt,
  WarehouseArt,
} from "@/components/Imagery";
import PresentationEnquiry from "@/components/PresentationEnquiry";

/**
 * PRIVATE OPPORTUNITY PRESENTATION.
 *
 * Reachable only with a 32-byte random token that an admin issued. It is:
 *   - noindex/nofollow via metadata, middleware and next.config headers
 *   - excluded from sitemap.xml (which is built from static content only)
 *   - absent from every public navigation surface
 *   - rendered without the public header/footer, so there is no crawl path
 *     into or out of it
 *
 * The identifying fields are redacted in `loadPresentationByToken()` — in the
 * data layer, not here — so no change to this template can leak them.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Opportunity Summary",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

const ART = {
  warehouse: WarehouseArt,
  industrial: IndustrialArt,
  storage: StorageArt,
  small_commercial: CommercialArt,
} as const;

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const presentation = loadPresentationByToken(token);

  // Revoked, expired and unknown tokens are indistinguishable from the outside.
  if (!presentation) notFound();

  recordPresentationView(token);

  const o = presentation.opportunity;
  const Art = ART[o.propertyType as keyof typeof ART] ?? CommercialArt;
  const netRental =
    o.estimatedRental != null ? o.estimatedRental - (o.outgoings ?? 0) : null;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-ink-100 bg-canvas-raised">
        <div className="container-page flex h-16 items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M10 21V11l7 4v6" stroke="#9C7A46" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-ink-900">{SITE.name}</span>
          </span>
          <span className="rounded-full border border-brass-200 bg-brass-100 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-brass-600">
            Private &amp; confidential
          </span>
        </div>
      </header>

      <main className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          {presentation.preparedFor && (
            <p className="eyebrow">Prepared for {presentation.preparedFor}</p>
          )}
          <h1 className="mt-3 font-display text-display-lg text-ink-900">
            {labelFor("propertyType", o.propertyType)} opportunity
          </h1>
          <p className="mt-3 text-lg text-ink-600">{o.generalLocation}</p>

          {presentation.introNote && (
            <div className="mt-7 rounded-xl border border-ink-100 bg-canvas-sunken p-5">
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink-700">
                {presentation.introNote}
              </p>
            </div>
          )}

          <div className="mt-9 overflow-hidden rounded-2xl border border-ink-100">
            <Art className="h-full w-full" />
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Illustrative image. Not a photograph of the property.
          </p>

          {/* Key figures */}
          <section className="mt-10">
            <h2 className="font-display text-display-sm text-ink-900">Summary</h2>
            <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-ink-100 bg-ink-50 sm:grid-cols-2">
              <Figure label="Property type" value={labelFor("propertyType", o.propertyType)} />
              <Figure label="General location" value={o.generalLocation} />
              <Figure label="Size" value={o.sizeSqm ? `${o.sizeSqm} sqm` : "On request"} />
              <Figure label="Price" value={currency(o.price)} />
              <Figure
                label="Estimated rental (pa)"
                value={o.estimatedRental != null ? `${currency(o.estimatedRental)}` : "On request"}
              />
              <Figure
                label="Outgoings (pa)"
                value={o.outgoings != null ? `${currency(o.outgoings)}` : "On request"}
              />
              <Figure
                label="Estimated net rental (pa)"
                value={netRental != null ? currency(netRental) : "On request"}
              />
              <Figure
                label="Estimated yield"
                value={o.estimatedYield != null ? `${o.estimatedYield}%` : "On request"}
              />
              <Figure
                label="Completion status"
                value={
                  o.completionStatus
                    ? (COMPLETION_LABELS[o.completionStatus as keyof typeof COMPLETION_LABELS] ??
                      o.completionStatus)
                    : "On request"
                }
              />
              <Figure
                label="Availability"
                value={
                  AVAILABILITY_LABELS[o.availability as keyof typeof AVAILABILITY_LABELS] ??
                  o.availability
                }
              />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              Figures are estimates provided for discussion and are subject to verification. Yield is
              calculated on the figures shown and is not a projection or a guarantee.
            </p>
          </section>

          {/* Identifying detail — only when the admin authorised disclosure */}
          {presentation.discloseIdentity && (
            <section className="mt-10 rounded-xl border border-ink-200 bg-canvas-sunken p-6">
              <h2 className="font-display text-display-sm text-ink-900">Property details</h2>
              <dl className="mt-4 space-y-3">
                {o.address && <DetailRow label="Address" value={o.address} />}
                {o.lotUnitNumber && <DetailRow label="Lot / unit" value={o.lotUnitNumber} />}
                {o.developmentName && <DetailRow label="Development" value={o.developmentName} />}
                {o.developer && <DetailRow label="Developer" value={o.developer} />}
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                These details are provided to you in confidence. Please do not distribute them.
              </p>
            </section>
          )}

          {/* Investment considerations */}
          <section className="mt-10">
            <h2 className="font-display text-display-sm text-ink-900">
              Investment considerations
            </h2>
            <ul className="mt-5 space-y-3 border-l-2 border-brass-200 pl-5">
              {[
                "Review the lease in full, including term, options, rent review mechanism and which outgoings are recoverable.",
                "Confirm zoning and permitted use with the local council for your intended tenant.",
                "Where the property is strata-titled, review the owners corporation budget, sinking fund and minutes.",
                "Obtain a building inspection appropriate to the asset type and consider likely capital expenditure.",
                "Model the position with a vacancy period — outgoings and finance costs continue when rent does not.",
                "Confirm the GST treatment and your holding structure with your accountant before committing.",
                "Obtain independent legal advice on the contract before signing.",
              ].map((item) => (
                <li key={item} className="text-[0.9375rem] leading-relaxed text-ink-600">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Enquiry */}
          <section className="mt-12 rounded-2xl border border-ink-100 bg-ink-900 p-7 text-canvas sm:p-9">
            <h2 className="font-display text-display-sm text-canvas">
              Interested in taking this further?
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-200">
              Let us know and we&rsquo;ll arrange the next step — further information, an inspection,
              or a conversation about whether this fits what you&rsquo;re trying to achieve. There is
              no obligation.
            </p>
            <div className="mt-6">
              <PresentationEnquiry token={presentation.token} />
            </div>
          </section>

          <p className="mt-10 text-xs leading-relaxed text-ink-400">
            <strong className="font-semibold text-ink-600">Important:</strong> {DISCLAIMER_FULL} This
            summary is provided to you in confidence and is not for distribution.
          </p>
        </div>
      </main>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas-raised px-5 py-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-1 text-base font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function currency(value: number | null): string {
  if (value == null) return "On request";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}
