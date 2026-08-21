"use client";

import { useState } from "react";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";

export default function ContactForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    message: "",
    company: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;

    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Please enter your first name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = "Please enter a valid email address";
    if (form.message.trim().length < 5) next.message = "Please tell us a little more";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("sending");
    setFormError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, landingPage: window.location.pathname }),
      });
      const data = (await response.json()) as { ok?: boolean; errors?: Record<string, string>; error?: string };

      if (!response.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error ?? "We couldn't send that. Please try again.");
        setState("idle");
        return;
      }

      trackEvent(CONVERSION_EVENTS.contactRequest, { lead_source: "contact_page" });
      setState("sent");
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="card text-center" role="status">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink-900" aria-hidden="true">
          <svg className="h-5 w-5 text-brass-400" viewBox="0 0 24 24" fill="none">
            <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-5 font-display text-display-sm text-ink-900">Message received</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-600">
          Thanks for getting in touch. We&rsquo;ll come back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-firstName" className="field-label">First name</label>
          <input
            id="c-firstName"
            type="text"
            autoComplete="given-name"
            required
            className="field-input"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
          />
          {errors.firstName && <p className="field-error">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="c-lastName" className="field-label">
            Last name <span className="font-normal text-ink-400">(optional)</span>
          </label>
          <input
            id="c-lastName"
            type="text"
            autoComplete="family-name"
            className="field-input"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-email" className="field-label">Email</label>
        <input
          id="c-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          required
          className="field-input"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="c-mobile" className="field-label">
          Mobile <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <input
          id="c-mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="field-input"
          placeholder="04XX XXX XXX"
          value={form.mobile}
          onChange={(e) => set("mobile", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="c-message" className="field-label">How can we help?</label>
        <textarea
          id="c-message"
          rows={5}
          required
          className="field-input resize-y"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message && <p className="field-error">{errors.message}</p>}
      </div>

      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="c-company">Company</label>
        <input
          id="c-company"
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
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
