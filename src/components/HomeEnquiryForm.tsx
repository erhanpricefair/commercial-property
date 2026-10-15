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
  HOME_TYPES,
  HOME_TYPE_LABELS,
  cleanSuburbParam,
} from "@/lib/content/home-landing";
import { SUBURB_EVENT } from "@/components/FeaturedHomeCard";

/**
 * The home-buyer form. One screen, native selects (they open the phone's own
 * picker, which is faster to use than anything custom), and the success
 * message replaces the form in place rather than navigating away.
 */

type Fields = {
  homeType: string;
  budget: string;
  suburbs: string;
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
  homeType: "",
  budget: "",
  suburbs: "",
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

export default function HomeEnquiryForm({ idPrefix = "home" }: { idPrefix?: string }) {
  const [form, setForm] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const started = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureAttribution();
  }, []);

  // A suburb chosen from a builder-home card, or passed in an ad link
  // (`/?suburb=Tarneit`), arrives already filled in.
  useEffect(() => {
    const fromUrl = cleanSuburbParam(new URLSearchParams(window.location.search).get("suburb"));
    if (fromUrl) setForm((prev) => ({ ...prev, suburbs: prev.suburbs || fromUrl }));

    const onChoose = (event: Event) => {
      const suburb = cleanSuburbParam(String((event as CustomEvent).detail ?? ""));
      if (!suburb) return;
      setForm((prev) => {
        const existing = prev.suburbs.split(",").map((s) => s.trim()).filter(Boolean);
        if (existing.some((s) => s.toLowerCase() === suburb.toLowerCase())) return prev;
        return { ...prev, suburbs: [...existing, suburb].join(", ") };
      });
      markStarted();
    };
    window.addEventListener(SUBURB_EVENT, onChoose);
    return () => window.removeEventListener(SUBURB_EVENT, onChoose);
    // markStarted only reads a ref; re-subscribing on every render isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state === "done") doneRef.current?.focus();
  }, [state]);

  const id = (name: string) => `${idPrefix}-${name}`;

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackEvent(CONVERSION_EVENTS.investorFormStart, { lead_source: SOURCE });
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.homeType) next.homeType = "Please choose a type of home";
    if (!form.budget) next.budget = "Please choose a budget";
    if (!form.timeframe) next.timeframe = "Please choose your timing";
    if (!form.purpose) next.purpose = "Please choose one";
    if (!form.firstName.trim()) next.firstName = "Please enter your first name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = "Please enter a valid email address";
    if (!/^(\+?61|0)[\s-]?[2-478](?:[\s-]?\d){8}$/.test(form.mobile.replace(/\s+/g, " ").trim()))
      next.mobile = "Please enter a valid Australian phone number";
    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    markStarted();

    const problems = validate();
    setErrors(problems);
    if (Object.keys(problems).length) {
      document.getElementById(id(Object.keys(problems)[0]))?.focus();
      return;
    }

    setState("sending");
    setFormError(null);
    try {
      const response = await fetch("/api/home-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...attributionPayload(SOURCE), ...form, source: SOURCE }),
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
        property_type: form.homeType,
      });
      setState("done");
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="py-6 text-center focus:outline-none">
        <p className="font-display text-display-sm text-ink-900">Thanks, {form.firstName.trim()}.</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-600">
          We&rsquo;ve got your details and a member of our team will be in touch shortly. We&rsquo;ve
          also emailed you a copy of what you told us.
        </p>
      </div>
    );
  }

  const describedBy = (name: string) => (errors[name] ? id(`${name}-error`) : undefined);
  const errorText = (name: string) =>
    errors[name] ? (
      <p id={id(`${name}-error`)} className="field-error">
        {errors[name]}
      </p>
    ) : null;

  const select = (
    name: "homeType" | "budget" | "timeframe" | "purpose",
    label: string,
    values: readonly string[],
    labels: Record<string, string>,
  ) => (
    <div>
      <label htmlFor={id(name)} className="field-label">
        {label}
      </label>
      <select
        id={id(name)}
        name={name}
        className="field-input"
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {select("homeType", "Type of home", HOME_TYPES, HOME_TYPE_LABELS)}
        {select("budget", "Budget", HOME_BUDGETS, HOME_BUDGET_LABELS)}
      </div>

      <div>
        <label htmlFor={id("suburbs")} className="field-label">
          Suburbs you&rsquo;re interested in <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <input
          id={id("suburbs")}
          name="suburbs"
          type="text"
          autoComplete="off"
          className="field-input"
          placeholder="e.g. Brunswick, Coburg, Northcote"
          value={form.suburbs}
          onFocus={markStarted}
          onChange={(e) => set("suburbs", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {select("timeframe", "When are you looking to buy?", HOME_TIMEFRAMES, HOME_TIMEFRAME_LABELS)}
        {select("purpose", "Are you buying…", HOME_PURPOSES, HOME_PURPOSE_LABELS)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("firstName")} className="field-label">First name</label>
          <input
            id={id("firstName")}
            name="firstName"
            type="text"
            autoComplete="given-name"
            className="field-input"
            value={form.firstName}
            onFocus={markStarted}
            onChange={(e) => set("firstName", e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={describedBy("firstName")}
          />
          {errorText("firstName")}
        </div>
        <div>
          <label htmlFor={id("lastName")} className="field-label">
            Last name <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id={id("lastName")}
            name="lastName"
            type="text"
            autoComplete="family-name"
            className="field-input"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("mobile")} className="field-label">Mobile</label>
          <input
            id={id("mobile")}
            name="mobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            className="field-input"
            placeholder="04XX XXX XXX"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            aria-invalid={Boolean(errors.mobile)}
            aria-describedby={describedBy("mobile")}
          />
          {errorText("mobile")}
        </div>
        <div>
          <label htmlFor={id("email")} className="field-label">Email</label>
          <input
            id={id("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            className="field-input"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy("email")}
          />
          {errorText("email")}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-100 bg-canvas-sunken p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-300"
          checked={form.consentMarketing}
          onChange={(e) => set("consentMarketing", e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-ink-600">
          Also email me about new homes and market updates. Optional — you can unsubscribe at any
          time.
        </span>
      </label>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor={id("company")}>Company</label>
        <input
          id={id("company")}
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
        />
      </div>

      {formError && (
        <p role="alert" className="rounded-xl border border-signal-hot/30 bg-signal-hot/5 px-4 py-3 text-sm text-signal-hot">
          {formError}
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className="btn-primary w-full">
        {state === "sending" ? "Sending…" : "Get started"}
      </button>

      <p className="text-xs leading-relaxed text-ink-400">
        We&rsquo;ll use your details to contact you about homes that may suit you, as described in
        our{" "}
        <Link href="/privacy" className="underline">
          Privacy Policy
        </Link>
        . No obligation.
      </p>
    </form>
  );
}
