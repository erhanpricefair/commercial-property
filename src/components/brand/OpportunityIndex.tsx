"use client";

/* eslint-disable @next/next/no-img-element -- builder-authorised photos, sized at source */
import { SUBURB_EVENT } from "@/lib/content/home-options";

export type OpportunityItem = {
  suburb: string;
  council?: string;
  /** Only ever a builder-authorised photo. */
  photo?: string;
};

/**
 * Current opportunities as an editorial index — one ruled row per suburb,
 * set large, rather than a grid of cards. A row selects that suburb in the
 * registration form and brings the form into view.
 */
export default function OpportunityIndex({ items, cta }: { items: OpportunityItem[]; cta: string }) {
  function choose(suburb: string) {
    window.dispatchEvent(new CustomEvent(SUBURB_EVENT, { detail: suburb }));
    document.getElementById("register")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <ol className="border-t border-ivory/30">
      {items.map((item, i) => (
        <li key={item.suburb} className="border-b border-ivory/30">
          <button
            type="button"
            onClick={() => choose(item.suburb)}
            className="group grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-x-4 py-6 text-left transition-colors duration-300 hover:bg-olive-deep/60 sm:grid-cols-[3rem_1fr_auto] sm:gap-x-8 sm:py-8 lg:grid-cols-[4rem_minmax(0,1fr)_16rem_auto]"
          >
            <span className="self-start pt-2 font-grotesk text-xs font-semibold tabular-nums tracking-[0.16em] text-ivory/85 sm:pt-4">
              {String(i + 1).padStart(2, "0")}
            </span>

            <span className="min-w-0">
              <span className="nf-serif block text-[2.25rem] leading-none tracking-[-0.02em] text-ivory sm:text-[3.25rem] lg:text-[4.25rem]">
                {item.suburb}
              </span>
              {item.council && (
                <span className="mt-2 block font-grotesk text-xs uppercase tracking-[0.16em] text-ivory/85 lg:hidden">
                  {item.council}
                </span>
              )}
            </span>

            <span className="hidden font-grotesk text-xs uppercase tracking-[0.16em] text-ivory/85 lg:block">
              {item.council}
            </span>

            {/* Only ever a builder-authorised photo; otherwise the row is
                purely typographic. */}
            {item.photo && (
              <img
                src={item.photo}
                alt={`Home in ${item.suburb}`}
                className="col-start-2 mt-4 h-24 w-32 object-cover sm:col-start-auto sm:mt-0"
                loading="lazy"
              />
            )}

            <span className="flex items-center gap-2 justify-self-end font-grotesk text-sm font-semibold text-ivory">
              <span className="hidden sm:inline">{cta}</span>
              <span className="nf-arrow text-lg" aria-hidden="true">→</span>
              <span className="sr-only sm:hidden">{cta} for {item.suburb}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
