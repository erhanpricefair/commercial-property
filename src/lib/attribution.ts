/**
 * Campaign attribution capture (client-side).
 *
 * Paid social sends people to a landing page with tracking parameters in the
 * URL. Those parameters have to survive the multi-step form — and any
 * navigation the visitor does before converting — or the lead arrives with no
 * indication of which ad produced it, which makes ad spend impossible to
 * optimise.
 *
 * First touch wins: if a visitor arrives from an Instagram ad, browses to an
 * article, then comes back and registers, the campaign that paid for them is
 * still the one credited.
 */

export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  /** fbclid / gclid / ttclid — whichever platform sent them. */
  clickId?: string;
  referrer?: string;
  landingPage?: string;
};

const STORAGE_KEY = "cp_attribution";

/**
 * Platforms each use their own click identifier. We keep whichever one is
 * present so the lead can later be reconciled against the ad platform's
 * reporting (and, if the business adds server-side Conversions API, matched).
 */
const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid", "li_fat_id", "msclkid"];

/** Some networks append their own junk; only these are worth recording. */
const UTM_PARAMS = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  content: "utm_content",
  term: "utm_term",
} as const;

/**
 * Read attribution from the current URL, remembering the first set seen for
 * this browsing session.
 *
 * sessionStorage rather than localStorage on purpose: attribution should
 * describe *this* visit. A click from an ad three weeks ago shouldn't be
 * credited with a lead that arrived today from a Google search.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  const stored = readStored();
  const fromUrl = readFromUrl();

  // A fresh campaign click always overwrites — the visitor genuinely arrived
  // from a new ad, and that ad should get the credit.
  if (fromUrl.campaign || fromUrl.source || fromUrl.clickId) {
    persist(fromUrl);
    return fromUrl;
  }

  if (stored) return stored;

  // No campaign parameters at all: still record where they came from.
  const organic: Attribution = {
    referrer: safeReferrer(),
    landingPage: window.location.pathname,
  };
  persist(organic);
  return organic;
}

/** Read what was captured earlier this session, without touching the URL. */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  return readStored() ?? captureAttribution();
}

/**
 * Flatten to the fields the lead API accepts. `source` and `sourceDetail`
 * already exist on the investor record, so a campaign lead reads sensibly in
 * the admin list even before anyone looks at the UTM columns.
 */
export function attributionPayload(fallbackSource: string): {
  source: string;
  sourceDetail?: string;
  landingPage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  clickId?: string;
  referrer?: string;
} {
  const a = getAttribution();
  return {
    source: a.source ?? fallbackSource,
    sourceDetail: [a.campaign, a.content].filter(Boolean).join(" · ") || undefined,
    landingPage: a.landingPage ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    utmSource: a.source,
    utmMedium: a.medium,
    utmCampaign: a.campaign,
    utmContent: a.content,
    utmTerm: a.term,
    clickId: a.clickId,
    referrer: a.referrer,
  };
}

function readFromUrl(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {};

  for (const [key, param] of Object.entries(UTM_PARAMS)) {
    const value = params.get(param);
    if (value) attribution[key as keyof typeof UTM_PARAMS] = clean(value);
  }

  for (const param of CLICK_ID_PARAMS) {
    const value = params.get(param);
    if (value) {
      attribution.clickId = clean(value);
      // A click ID with no utm_source still tells us the platform.
      if (!attribution.source) attribution.source = platformFor(param);
      break;
    }
  }

  attribution.referrer = safeReferrer();
  attribution.landingPage = window.location.pathname;
  return attribution;
}

function platformFor(param: string): string {
  switch (param) {
    case "fbclid":
      return "meta";
    case "gclid":
      return "google";
    case "ttclid":
      return "tiktok";
    case "li_fat_id":
      return "linkedin";
    case "msclkid":
      return "microsoft";
    default:
      return "paid";
  }
}

/** Trim, cap length, and drop anything that looks like an injection attempt. */
function clean(value: string): string {
  return value.trim().replace(/[<>"']/g, "").slice(0, 120);
}

function safeReferrer(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const url = new URL(document.referrer);
    // Internal navigation isn't a referrer worth recording.
    if (url.host === window.location.host) return undefined;
    return `${url.host}${url.pathname}`.slice(0, 200);
  } catch {
    return undefined;
  }
}

function readStored(): Attribution | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    // Private browsing and blocked storage both throw. Attribution is a
    // nice-to-have; never let it break the form.
    return null;
  }
}

function persist(attribution: Attribution): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
}
