/**
 * Conversion tracking, provider-agnostic.
 *
 * Events are pushed to `window.dataLayer` (GTM/GA4), forwarded to gtag if GA4
 * is loaded directly, and mirrored to the Meta Pixel when one is configured.
 * Nothing here ever carries private opportunity data — only the investor's own
 * self-reported criteria, which is what the business needs to optimise spend.
 */

export const CONVERSION_EVENTS = {
  investorAccessClick: "investor_access_click",
  investorFormStart: "investor_form_start",
  investorFormStep: "investor_form_step",
  investorFormComplete: "investor_form_complete",
  guideDownload: "guide_download",
  contactRequest: "contact_request",
} as const;

export type ConversionEvent = (typeof CONVERSION_EVENTS)[keyof typeof CONVERSION_EVENTS];

export type EventPayload = {
  lead_source?: string;
  lead_category?: string;
  budget?: string;
  property_type?: string;
  location?: string;
  /** Coarse bucket only — never the numeric internal lead score. */
  lead_quality?: string;
  landing_page?: string;
  step?: number;
  cta_location?: string;
  [key: string]: string | number | boolean | undefined;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** Meta's standard events, so the pixel reports against known conversions. */
const META_EVENT_MAP: Partial<Record<ConversionEvent, string>> = {
  investor_form_start: "InitiateCheckout",
  investor_form_complete: "Lead",
  guide_download: "CompleteRegistration",
  contact_request: "Contact",
};

export function trackEvent(event: ConversionEvent | string, payload: EventPayload = {}): void {
  if (typeof window === "undefined") return;

  const data = { event, ...stripEmpty(payload) };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(data);

  if (typeof window.gtag === "function") {
    window.gtag("event", event, stripEmpty(payload));
  }

  if (typeof window.fbq === "function") {
    const standard = META_EVENT_MAP[event as ConversionEvent];
    if (standard) window.fbq("track", standard, stripEmpty(payload));
    else window.fbq("trackCustom", event, stripEmpty(payload));
  }
}

/** Page views for the SPA transitions Next.js does client-side. */
export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: "page_view", page_path: path });
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", { page_path: path });
  }
  if (typeof window.fbq === "function") window.fbq("track", "PageView");
}

function stripEmpty(payload: EventPayload): EventPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""),
  ) as EventPayload;
}
