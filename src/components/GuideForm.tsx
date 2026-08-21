"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";

/**
 * Lead magnet capture. Two fields only — the guide is the value exchange, and
 * every extra field costs conversions. Investors who want to go further are
 * pointed at the full qualification form afterwards.
 */
export default function GuideForm({ source = "guide_page" }: { source?: string }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "Please enter your first name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      next.email = "Please enter a valid email address";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          company,
          source,
          landingPage: window.location.pathname,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; errors?: Record<string, string>; error?: string };

      if (!response.ok || !data.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error ?? "We couldn't submit that. Please try again.");
        setSubmitting(false);
        return;
      }

      trackEvent(CONVERSION_EVENTS.guideDownload, { lead_source: source });
      router.push("/guide/read");
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="guide-firstName" className="field-label">First name</label>
        <input
          id="guide-firstName"
          type="text"
          autoComplete="given-name"
          required
          className="field-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          aria-invalid={Boolean(errors.firstName)}
        />
        {errors.firstName && <p className="field-error">{errors.firstName}</p>}
      </div>

      <div>
        <label htmlFor="guide-email" className="field-label">Email</label>
        <input
          id="guide-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          required
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="guide-company">Company</label>
        <input
          id="guide-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {formError && (
        <p role="alert" className="rounded-xl border border-signal-hot/30 bg-signal-hot/5 px-4 py-3 text-sm text-signal-hot">
          {formError}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Sending…" : "Get the Starter Guide"}
      </button>

      <p className="text-xs leading-relaxed text-ink-400">
        We&rsquo;ll email you a link to the guide. No obligation, and you can unsubscribe at any
        time. Information provided is general in nature and does not constitute financial, legal or
        investment advice.
      </p>
    </form>
  );
}
