"use client";

/* eslint-disable @next/next/no-img-element -- builder / stock photos sized at source */
import { HOME_COPY, type HomePhoto } from "@/lib/content/home-landing";

export const SUBURB_EVENT = "home:choose-suburb";

/**
 * One builder home: a photo and its suburb, nothing more. Tapping it puts the
 * suburb into the enquiry form and brings the form into view, so the visitor
 * goes from "that one" to a submitted enquiry without retyping anything.
 */
export default function FeaturedHomeCard({
  suburb,
  photo,
  isGeneric,
}: {
  suburb: string;
  photo: HomePhoto;
  isGeneric: boolean;
}) {
  function choose() {
    window.dispatchEvent(new CustomEvent(SUBURB_EVENT, { detail: suburb }));
    document.getElementById("enquire")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={choose}
      className="group block w-full overflow-hidden rounded-2xl border border-ink-100 bg-canvas-raised text-left shadow-card transition hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-400"
    >
      <span className="relative block aspect-[4/3] overflow-hidden bg-ink-100">
        <img
          src={photo.src}
          alt={isGeneric ? "" : `Home in ${suburb}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        {isGeneric && (
          <span className="absolute bottom-2 left-2 rounded-md bg-ink-900/70 px-2 py-1 text-[0.6875rem] font-medium text-canvas">
            {HOME_COPY.featuredGenericCaption}
          </span>
        )}
      </span>
      <span className="flex min-h-[3.5rem] items-center justify-between gap-3 px-5 py-4">
        <span className="text-base font-semibold text-ink-900">{suburb}</span>
        <span className="text-sm font-medium text-brass-600 group-hover:underline">{HOME_COPY.featuredCta}</span>
      </span>
    </button>
  );
}
