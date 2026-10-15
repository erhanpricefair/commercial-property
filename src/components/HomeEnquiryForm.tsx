"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";
import { attributionPayload, captureAttribution } from "@/lib/attribution";
import {
  HOME_BUDGETS,
  HOME_BUDGET_LABELS,
  HOME_PURPOSES,
  HOME_PURPOSE_LABELS,
  HOME_TIMEFRAMES,
  HOME_TIMEFRAME_LABELS,
  SUBURB_EVENT,
  cleanSuburbParam,
} from "@/lib/content/home-options";

/**
 * "Register your interest" — the NewPF enquiry form.
 *
 * Suburbs are toggles, not typing: the published suburbs are listed, a tap
 * on an opportunity row elsewhere on the page selects one here, and an ad
 * link can preselect one with `/?suburb=Preston`. Anything else goes in the
 * optional "other suburbs" field. Every home is a townhouse, so that isn't
 * asked. Success replaces the form in place.
 */

type Fields = {
  picked: string[];
  otherSuburbs: string;
  budget: string;
  timeframe: string;
  purpose: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  consentMarketing: boolean;
  company: string; // honeypot
};

const EMPTY: Fields = {
  picked: [],
  otherSuburbs: "",
  budget: "",
  timeframe: "",
  purpose: "",
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  consentMarketing: false,
  company: "",
};

const SOURCE = "home_landing";

export default function HomeEnquiryForm({ suburbs }: { suburbs: string[] }) {
  const [form, setForm] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const started = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const known = useRef(new Map(suburbs.map((s) => [s.toLowerCase(), s])));

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackEvent(CONVERSION_EVENTS.investorFormStart, { lead_source: SOURCE });
  }

  /** Select a suburb by name: a listed one toggles on, anything else is appended to "other". */
  function chooseSuburb(raw: string) {
    const suburb = cleanSuburbParam(raw);
    if (!suburb) return;
    const listed = known.current.get(suburb.toLowerCase());
    setForm((prev) => {
      if (listed) {
        return prev.picked.includes(listed) ? prev : { ...prev, picked: [...prev.picked, listed] };
      }
      const others = prev.otherSuburbs.split(",").map((s) => s.trim()).filter(Boolean);
      if (others.some((s) => s.toLowerCase() === suburb.toLowerCase())) return prev;
      return { ...prev, otherSuburbs: [...others, suburb].join(", ") };
    });
  }

  useEffect(() => {
    captureAttribution();
    const fromUrl = new URLSearchParams(window.location.search).get("suburb");
    if (fromUrl) chooseSuburb(fromUrl);

    const onChoose = (event: Event) => {
      chooseSuburb(String((event as CustomEvent).detail ?? ""));
      markStarted();
    };
    window.addEventListener(SUBURB_EVENT, onChoose);
    return () => window.removeEventListener(SUBURB_EVENT, onChoose);
    // Both helpers only touch refs and state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state === "done") doneRef.current?.focus();
  }, [state]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function togglePicked(suburb: string) {
    markStarted();
    setForm((prev) => ({
      ...prev,
      picked: prev.picked.includes(suburb) ? prev.picked.filter((s) => s !== suburb) : [...prev.picked, suburb],
    }));
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.budget) next.budget = "Please choose a budget";
    if (!form.timeframe) next.timeframe = "Please choose your timing";
    if (!form.purpose) next.purpose = "Please choose one";
    if (!form.firstName.trim()) next.firstName = "Please enter your first name";
    if (!/^(\+?61|0)[\s-]?[2-478](?:[\s-]?\d){8}$/.test(form.mobile.replace(/\s+/g, " ").trim()))
      next.mobile = "Please enter a valid Australian phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Please enter a valid email address";
    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    markStarted();

    const problems = validate();
    setErrors(problems);
    const first = Object.keys(problems)[0];
    if (first) {
      document.getElementById(first === "purpose" ? "nf-purpose-live_in" : `nf-${first}`)?.focus();
      return;
    }

    const suburbsText = [...form.picked, ...form.otherSuburbs.split(",").map((s) => s.trim()).filter(Boolean)].join(", ");

    setState("sending");
    setFormError(null);
    try {
      const response = await fetch("/api/home-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...attributionPayload(SOURCE),
          homeType: "townhouse",
          budget: form.budget,
          suburbs: suburbsText,
          timeframe: form.timeframe,
          purpose: form.purpose,
          firstName: form.firstName,
          lastName: form.lastName,
          mobile: form.mobile,
          email: form.email,
          consentMarketing: form.consentMarketing,
          company: form.company,
          source: SOURCE,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        errors?: Record<string, string>;
        error?: string;
        leadCategory?: string;
      };
      if (!response.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error ?? "We couldn't send that. Please check your details and try again.");
        setState("idle");
        return;
      }
      trackEvent(CONVERSION_EVENTS.investorFormComplete, {
        lead_source: SOURCE,
        lead_category: data.leadCategory,
        lead_quality: data.leadCategory,
        budget: form.budget,
        property_type: "townhouse",
      });
      setState("done");
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="border-t border-charcoal py-10 focus:outline-none">
        <p className="nf-serif text-[2.25rem] leading-[1.1] text-charcoal">
          Thank you, {form.firstName.trim()}.
        </p>
        <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-charcoal-graphite">
          We&rsquo;ve received your details and will be in touch personally. A copy of what you told us
          is on its way to your inbox.
        </p>
      </div>
    );
  }

  const describedBy = (name: string) => (errors[name] ? `nf-${name}-error` : undefined);
  const errorText = (name: string) =>
    errors[name] ? (
      <p id={`nf-${name}-error`} className="nf-error">
        {errors[name]}
      </p>
    ) : null;

  const select = (
    name: "budget" | "timeframe",
    label: string,
    values: readonly string[],
    labels: Record<string, string>,
  ) => (
    <div>
      <label htmlFor={`nf-${name}`} className="nf-label">
        {label}
      </label>
      <select
        id={`nf-${name}`}
        name={name}
        className="nf-input"
        value={form[name]}
        onFocus={markStarted}
        onChange={(e) => set(name, e.target.value)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={describedBy(name)}
      >
        <option value="" disabled>
          Choose…
        </option>
        {values.map((value) => (
          <option key={value} value={value}>
            {labels[value]}
          </option>
        ))}
      </select>
      {errorText(name)}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* Suburbs */}
      <fieldset>
        <legend className="nf-label">Suburbs of interest</legend>
        <div className="flex flex-wrap gap-2">
          {suburbs.map((suburb) => {
            const on = form.picked.includes(suburb);
            return (
              <button
                key={suburb}
                type="button"
                aria-pressed={on}
                onClick={() => togglePicked(suburb)}
                className={`inline-flex min-h-[3rem] items-center gap-2 border px-4 text-[0.9375rem] font-medium transition-colors ${
                  on
                    ? "border-olive bg-olive text-ivory"
                    : "border-limestone-deep bg-ivory-paper text-charcoal hover:border-charcoal-muted"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-3.5 w-3.5 place-items-center border ${on ? "border-ivory" : "border-charcoal-muted"}`}
                >
                  {on && <span className="h-1.5 w-1.5 bg-ivory" />}
                </span>
                {suburb}
              </button>
            );
          })}
        </div>
        <label htmlFor="nf-otherSuburbs" className="mt-6 block text-[1rem] font-medium leading-snug text-charcoal">
          Not on this list?{" "}
          <span className="nf-serif text-[1.125rem] italic text-olive">Whereabouts are you looking?</span>
        </label>
        <input
          id="nf-otherSuburbs"
          name="otherSuburbs"
          type="text"
          autoComplete="off"
          className="nf-input mt-2"
          placeholder="Suburbs or areas, e.g. Thornbury, Coburg, Ivanhoe"
          value={form.otherSuburbs}
          onFocus={markStarted}
          onChange={(e) => set("otherSuburbs", e.target.value)}
          aria-describedby="nf-otherSuburbs-note"
        />
        <p id="nf-otherSuburbs-note" className="mt-1.5 text-xs leading-relaxed text-charcoal-muted">
          Optional. We&rsquo;ll keep it in mind as new homes become available.
        </p>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        {select("budget", "Budget", HOME_BUDGETS, HOME_BUDGET_LABELS)}
        {select("timeframe", "Timing", HOME_TIMEFRAMES, HOME_TIMEFRAME_LABELS)}
      </div>

      {/* Purpose — a segmented single choice */}
      <fieldset aria-describedby={describedBy("purpose")}>
        <legend className="nf-label">Buying</legend>
        <div className="grid grid-cols-3 border border-limestone-deep">
          {HOME_PURPOSES.map((value, i) => {
            const on = form.purpose === value;
            return (
              <label
                key={value}
                className={`flex min-h-[3.25rem] cursor-pointer items-center justify-center px-2 text-center text-sm font-medium leading-tight transition-colors ${
                  i > 0 ? "border-l border-limestone-deep" : ""
                } ${on ? "bg-charcoal text-ivory" : "bg-ivory-paper text-charcoal hover:bg-limestone/60"}`}
              >
                <input
                  id={`nf-purpose-${value}`}
                  type="radio"
                  name="purpose"
                  value={value}
                  checked={on}
                  onChange={() => {
                    markStarted();
                    set("purpose", value);
                  }}
                  className="sr-only"
                />
                {HOME_PURPOSE_LABELS[value]}
              </label>
            );
          })}
        </div>
        {errorText("purpose")}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="nf-firstName" className="nf-label">First name</label>
          <input
            id="nf-firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            className="nf-input"
            value={form.firstName}
            onFocus={markStarted}
            onChange={(e) => set("firstName", e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={describedBy("firstName")}
          />
          {errorText("firstName")}
        </div>
        <div>
          <label htmlFor="nf-lastName" className="nf-label">
            Last name <span className="font-normal normal-case tracking-normal text-charcoal-muted">(optional)</span>
          </label>
          <input
            id="nf-lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            className="nf-input"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="nf-mobile" className="nf-label">Mobile</label>
          <input
            id="nf-mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="nf-input"
            placeholder="04XX XXX XXX"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            aria-invalid={Boolean(errors.mobile)}
            aria-describedby={describedBy("mobile")}
          />
          {errorText("mobile")}
        </div>
        <div>
          <label htmlFor="nf-email" className="nf-label">Email</label>
          <input
            id="nf-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            className="nf-input"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          {errorText("email")}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 rounded-none border-charcoal-muted text-olive accent-[#545839]"
          checked={form.consentMarketing}
          onChange={(e) => set("consentMarketing", e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-charcoal-graphite">
          Also email me when new opportunities become available. Optional — unsubscribe at any time.
        </span>
      </label>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="nf-company">Company</label>
        <input
          id="nf-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
        />
      </div>

      {formError && (
        <p role="alert" className="border-l-2 border-brick bg-ivory-paper px-4 py-3 text-sm text-brick">
          {formError}
        </p>
      )}

      <div className="space-y-4 border-t border-charcoal/15 pt-6">
        <button type="submit" disabled={state === "sending"} className="nf-btn-primary group w-full sm:w-auto">
          {state === "sending" ? "Sending…" : "Register Your Interest"}
          <span className="nf-arrow" aria-hidden="true">→</span>
        </button>
        <p className="text-xs leading-relaxed text-charcoal-muted">
          We use your details to contact you about homes that may suit you, as described in our{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          . No obligation.
        </p>
      </div>
    </form>
  );
}
