"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import InvestorForm from "@/components/InvestorForm";
import {
  CommercialArt,
  IndustrialArt,
  StorageArt,
  StreetscapeArt,
  WarehouseArt,
} from "@/components/Imagery";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";
import { SITE } from "@/lib/site";
import type { Campaign } from "@/lib/content/campaigns";

const ART = {
  warehouse: WarehouseArt,
  industrial: IndustrialArt,
  storage: StorageArt,
  commercial: CommercialArt,
  streetscape: StreetscapeArt,
};

/**
 * Landing page for a paid social campaign.
 *
 * The shape of this page is driven by how the traffic behaves: cold, scrolled
 * to, almost entirely on a phone, and gone in seconds if the page doesn't
 * immediately restate the promise from the ad. So the order is promise →
 * proof → form, with everything else below, and a sticky bar that puts the
 * form one tap away no matter how far down someone has scrolled.
 */
export default function CampaignPage({ campaign }: { campaign: Campaign }) {
  const Art = ART[campaign.art];
  const formRef = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    captureAttribution();
  }, []);

  // Show the sticky CTA only once the form has scrolled out of view — while
  // it's on screen the bar is just clutter covering the thing it points at.
  useEffect(() => {
    const target = formRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  function scrollToForm(location: string) {
    trackEvent(CONVERSION_EVENTS.investorAccessClick, { cta_location: location });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pb-24 lg:pb-0">
      {/* Minimal bar. The logo is not a link — there is nowhere to go but forward. */}
      <header className="border-b border-ink-100 bg-canvas-raised">
        <div className="container-page flex h-14 items-center justify-between">
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M10 21V11l7 4v6" stroke="#9C7A46" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-ink-900">{SITE.name}</span>
          </span>
          <span className="hidden text-xs text-ink-500 sm:block">{SITE.region}</span>
        </div>
      </header>

      {/* ---------- Promise ---------- */}
      <section className="border-b border-ink-100 bg-canvas">
        <div className="container-page py-7 sm:py-12 lg:py-16">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14">
            <div>
              <p className="eyebrow">{campaign.eyebrow}</p>
              <h1 className="mt-2.5 font-display text-display-md text-ink-900 sm:text-display-lg">
                {campaign.h1}
              </h1>
              <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-600 sm:mt-5 sm:text-[1.0625rem] sm:leading-[1.65]">
                {campaign.subhead}
              </p>

              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 sm:mt-7 sm:gap-y-2.5">
                {campaign.proofPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-700 sm:text-sm">
                    <svg className="h-3.5 w-3.5 shrink-0 text-brass-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>

              {/* On mobile the form sits directly below, so this button is
                  redundant there; on desktop it jumps to the side column. */}
              <button
                type="button"
                onClick={() => scrollToForm("campaign_hero")}
                className="btn-primary mt-8 hidden lg:inline-flex"
              >
                {campaign.formHeading}
              </button>

              <div className="mt-8 hidden overflow-hidden rounded-2xl border border-ink-100 lg:block">
                <Art className="h-full w-full" />
              </div>
            </div>

            {/* ---------- Form ---------- */}
            <div ref={formRef} className="scroll-mt-4 lg:sticky lg:top-6">
              <div className="mb-3.5 mt-7 lg:mb-5 lg:mt-0">
                <h2 className="font-display text-display-sm text-ink-900">{campaign.formHeading}</h2>
                <p className="mt-1 text-sm text-ink-500">{campaign.formSubheading}</p>
              </div>
              <InvestorForm source={`campaign:${campaign.slug}`} prefill={campaign.prefill} compact />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- What registering gets them ---------- */}
      <section className="bg-canvas-sunken py-12 sm:py-16">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow">What you get</p>
              <h2 className="mt-3 font-display text-display-md text-ink-900">
                Relevant opportunities, or a straight answer
              </h2>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ink-600">
                You tell us what you&rsquo;re looking for. We check it against what&rsquo;s
                currently available through our network. You decide whether to take it further.
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 lg:hidden">
                <Art className="h-full w-full" />
              </div>
            </div>

            <ul className="space-y-4">
              {campaign.whatYouGet.map((item) => (
                <li key={item} className="flex gap-3.5 rounded-xl border border-ink-100 bg-canvas-raised p-4">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brass-500" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2.5 8.5l3.5 3.5 7.5-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[0.9375rem] leading-relaxed text-ink-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- Three steps ---------- */}
      <section className="bg-canvas py-12 sm:py-16">
        <div className="container-page">
          <ol className="grid gap-6 sm:grid-cols-3">
            {[
              { t: "Tell us your criteria", d: "Budget, location, property type and what matters most to you." },
              { t: "We check what's available", d: "Your criteria are compared against opportunities currently available through our network." },
              { t: "You decide", d: "Review anything relevant and decide whether to proceed. No obligation." },
            ].map((step, i) => (
              <li key={step.t}>
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-display-sm text-brass-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-ink-100" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-ink-900">{step.t}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-600">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Objections ---------- */}
      <section className="bg-canvas-sunken py-12 sm:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow">Before you register</p>
            <h2 className="mt-3 font-display text-display-md text-ink-900">
              The questions people ask us first
            </h2>
            <div className="mt-8 space-y-7">
              {campaign.objections.map((item) => (
                <div key={item.q} className="border-b border-ink-100 pb-7 last:border-0 last:pb-0">
                  <h3 className="text-base font-semibold text-ink-900">{item.q}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-[1.7] text-ink-600">{item.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => scrollToForm("campaign_objections")}
                className="btn-primary w-full sm:w-auto"
              >
                {campaign.formHeading}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Legal ---------- */}
      <footer className="border-t border-ink-100 bg-canvas py-10">
        <div className="container-page">
          <p className="mx-auto max-w-3xl text-xs leading-relaxed text-ink-500">
            <strong className="font-semibold text-ink-700">Important:</strong> Information provided
            on this page is general in nature and does not constitute financial, legal or investment
            advice. It does not take into account your objectives, financial situation or needs.
            Commercial property involves risks, including vacancy, tenant default, changes in market
            conditions and changes in value. Investors should conduct their own due diligence and
            obtain independent professional advice before making an investment decision. No
            representation is made that any particular outcome, rental income, yield or capital
            growth will be achieved. Registering does not create an obligation to purchase.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-ink-400">
            <p>
              © {new Date().getFullYear()} {SITE.legalName}
              {SITE.abn ? ` · ABN ${SITE.abn}` : ""}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="hover:text-ink-700">Privacy Policy</Link>
              <Link href="/disclaimer" className="hover:text-ink-700">Disclaimer</Link>
              <Link href="/terms" className="hover:text-ink-700">Terms</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ---------- Sticky mobile CTA ---------- */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-canvas-raised/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
          showStickyCta ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => scrollToForm("campaign_sticky")}
          className="btn-primary w-full"
        >
          {campaign.formHeading}
        </button>
      </div>
    </div>
  );
}
