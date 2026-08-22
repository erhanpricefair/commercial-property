"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BUDGET_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  FINANCE_OPTIONS,
  LOCATION_OPTIONS,
  PRIORITY_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  TIMEFRAME_OPTIONS,
  type Budget,
  type ContactMethod,
  type FinanceStatus,
  type LocationScope,
  type Priority,
  type PropertyType,
  type Timeframe,
} from "@/lib/taxonomy";
import { CONVERSION_EVENTS, trackEvent } from "@/lib/analytics";
import { attributionPayload, captureAttribution } from "@/lib/attribution";

/**
 * Seven-step investor qualification form.
 *
 * Mobile-first by construction: every choice is a full-width 56px button, only
 * the final step requires typing, and the step is advanced automatically on
 * single-select questions so the common path is one tap per screen.
 */

type FormState = {
  propertyType: PropertyType | "";
  budget: Budget | "";
  locationScope: LocationScope | "";
  locationFree: string;
  priorities: Priority[];
  financeStatus: FinanceStatus | "";
  timeframe: Timeframe | "";
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  contactMethod: ContactMethod;
  message: string;
  consentMarketing: boolean;
  company: string; // honeypot
};

const INITIAL: FormState = {
  propertyType: "",
  budget: "",
  locationScope: "",
  locationFree: "",
  priorities: [],
  financeStatus: "",
  timeframe: "",
  firstName: "",
  lastName: "",
  email: "",
  mobile: "",
  contactMethod: "email",
  message: "",
  consentMarketing: false,
  company: "",
};

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  "What type of commercial property are you interested in?",
  "What is your approximate budget?",
  "Where are you looking?",
  "What is most important to you?",
  "Are you currently finance-ready?",
  "How soon are you looking to invest?",
  "How should we reach you?",
];

const STEP_HINTS = [
  "Choose the closest fit. You can change this later.",
  "An approximate range is fine — it just helps us filter.",
  "Pick a region, and add a suburb if you have one in mind.",
  "Select as many as apply.",
  "There's no wrong answer here.",
  "This helps us judge what's worth showing you.",
  "We'll only use these details to discuss opportunities with you.",
];

/**
 * `prefill` lets a campaign landing page pre-answer the questions its ad
 * already established. Someone who clicked an ad about warehouses under $500k
 * should not be asked those two questions again — message match is worth more
 * conversions than a couple of extra data points, and they can still change
 * the answer by stepping back.
 */
export type InvestorFormPrefill = Partial<
  Pick<FormState, "propertyType" | "budget" | "locationScope">
>;

export default function InvestorForm({
  source,
  prefill,
  compact = false,
}: {
  source?: string;
  prefill?: InvestorFormPrefill;
  compact?: boolean;
}) {
  const router = useRouter();
  // Skip past any question the ad already answered.
  const firstUnanswered = firstUnansweredStep(prefill);
  const [step, setStep] = useState(firstUnanswered);
  const [form, setForm] = useState<FormState>({ ...INITIAL, ...prefill });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Record which ad sent them, before they touch anything.
  useEffect(() => {
    captureAttribution();
  }, []);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }, []);

  /** Fires once, the first time the visitor interacts with the form. */
  const markStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const attribution = attributionPayload(source ?? "website");
    trackEvent(CONVERSION_EVENTS.investorFormStart, {
      lead_source: attribution.source,
      campaign: attribution.utmCampaign,
      ad_content: attribution.utmContent,
      landing_page: attribution.landingPage,
    });
  }, [source]);

  // Move focus to the new question so screen readers and keyboard users follow
  // the step change, and scroll the card back into view on small screens.
  useEffect(() => {
    if (step === firstUnanswered) return;
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [step, firstUnanswered]);

  const goNext = useCallback(() => {
    setStep((s) => {
      const next = Math.min(TOTAL_STEPS - 1, s + 1);
      if (next !== s) trackEvent(CONVERSION_EVENTS.investorFormStep, { step: next + 1 });
      return next;
    });
  }, []);

  const goBack = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  /** Single-select answers advance on their own — one tap per screen. */
  const selectAndAdvance = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      markStarted();
      set(key, value);
      window.setTimeout(goNext, 180);
    },
    [goNext, markStarted, set],
  );

  const togglePriority = useCallback(
    (value: Priority) => {
      markStarted();
      setForm((prev) => ({
        ...prev,
        priorities: prev.priorities.includes(value)
          ? prev.priorities.filter((p) => p !== value)
          : [...prev.priorities, value],
      }));
      setErrors((prev) => {
        if (!prev.priorities) return prev;
        const next = { ...prev };
        delete next.priorities;
        return next;
      });
    },
    [markStarted],
  );

  const validateFinalStep = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Please enter your first name";
    if (!form.lastName.trim()) next.lastName = "Please enter your last name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = "Please enter a valid email address";
    if (!/^(\+?61|0)[\s-]?[2-478](?:[\s-]?\d){8}$/.test(form.mobile.replace(/\s+/g, " ").trim()))
      next.mobile = "Please enter a valid Australian phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (submitting) return;
      if (!validateFinalStep()) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            ...attributionPayload(source ?? "website"),
          }),
        });

        const data = (await response.json()) as {
          ok?: boolean;
          errors?: Record<string, string>;
          error?: string;
          /** Coarse bucket for ad platforms — never the internal numeric score. */
          leadCategory?: string;
        };

        if (!response.ok || !data.ok) {
          if (data.errors) {
            setErrors(data.errors);
            // Send the visitor back to the first step that has a problem.
            const firstBadStep = stepForField(Object.keys(data.errors)[0]);
            if (firstBadStep !== null) setStep(firstBadStep);
          }
          setSubmitError(data.error ?? "We couldn't submit that. Please check your details and try again.");
          setSubmitting(false);
          return;
        }

        const attribution = attributionPayload(source ?? "website");
        trackEvent(CONVERSION_EVENTS.investorFormComplete, {
          lead_source: attribution.source,
          campaign: attribution.utmCampaign,
          ad_content: attribution.utmContent,
          lead_category: data.leadCategory,
          budget: form.budget,
          property_type: form.propertyType,
          location: form.locationScope,
          lead_quality: data.leadCategory,
        });

        router.push("/register/thank-you");
      } catch {
        setSubmitError("We couldn't reach the server. Please check your connection and try again.");
        setSubmitting(false);
      }
    },
    [form, router, source, submitting, validateFinalStep],
  );

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(form.propertyType);
      case 1:
        return Boolean(form.budget);
      case 2:
        return Boolean(form.locationScope);
      case 3:
        return form.priorities.length > 0;
      case 4:
        return Boolean(form.financeStatus);
      case 5:
        return Boolean(form.timeframe);
      default:
        return true;
    }
  }, [form, step]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`card p-0 sm:p-0 ${compact ? "shadow-lift" : ""}`}
    >
      {/* Progress */}
      <div className="border-b border-ink-100 px-6 pb-5 pt-6 sm:px-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-500">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label="Registration progress"
        >
          <div
            className="h-full rounded-full bg-ink-900 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-6 py-7 sm:px-8 sm:py-9">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-display-sm text-ink-900 focus:outline-none"
        >
          {STEP_TITLES[step]}
        </h2>
        <p className="mt-2 text-sm text-ink-500">{STEP_HINTS[step]}</p>

        <div className="mt-7 space-y-3">
          {step === 0 &&
            PROPERTY_TYPE_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={form.propertyType === option.value}
                label={option.label}
                hint={option.hint}
                onClick={() => selectAndAdvance("propertyType", option.value)}
              />
            ))}

          {step === 1 &&
            BUDGET_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={form.budget === option.value}
                label={option.label}
                onClick={() => selectAndAdvance("budget", option.value)}
              />
            ))}

          {step === 2 && (
            <>
              {LOCATION_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  selected={form.locationScope === option.value}
                  label={option.label}
                  onClick={() => {
                    markStarted();
                    set("locationScope", option.value);
                  }}
                />
              ))}
              <div className="pt-3">
                <label htmlFor="locationFree" className="field-label">
                  Any particular suburb or area? <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id="locationFree"
                  name="locationFree"
                  type="text"
                  autoComplete="address-level2"
                  className="field-input"
                  placeholder="e.g. northern suburbs, or a specific suburb"
                  value={form.locationFree}
                  onChange={(e) => set("locationFree", e.target.value)}
                  onFocus={markStarted}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIORITY_OPTIONS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  selected={form.priorities.includes(option.value)}
                  label={option.label}
                  multi
                  onClick={() => togglePriority(option.value)}
                />
              ))}
            </div>
          )}

          {step === 4 &&
            FINANCE_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={form.financeStatus === option.value}
                label={option.label}
                onClick={() => selectAndAdvance("financeStatus", option.value)}
              />
            ))}

          {step === 5 &&
            TIMEFRAME_OPTIONS.map((option) => (
              <ChoiceButton
                key={option.value}
                selected={form.timeframe === option.value}
                label={option.label}
                onClick={() => selectAndAdvance("timeframe", option.value)}
              />
            ))}

          {step === 6 && (
            <ContactStep form={form} set={set} errors={errors} markStarted={markStarted} />
          )}

          {errors.priorities && step === 3 && <p className="field-error">{errors.priorities}</p>}
        </div>

        {submitError && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-signal-hot/30 bg-signal-hot/5 px-4 py-3 text-sm text-signal-hot"
          >
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button type="button" onClick={goBack} className="btn-ghost self-start">
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="btn-primary w-full sm:w-auto"
            >
              Continue
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
              {submitting ? "Submitting…" : "Register for Investor Access"}
            </button>
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-ink-400">
          Registering does not create an obligation to purchase. Information provided on this website
          is general in nature and does not constitute financial, legal or investment advice.
        </p>
      </div>
    </form>
  );
}

function ChoiceButton({
  label,
  hint,
  selected,
  onClick,
  multi = false,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`choice ${selected ? "choice-selected" : ""}`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center border-2 transition ${
          multi ? "rounded-md" : "rounded-full"
        } ${selected ? "border-canvas bg-canvas" : "border-ink-300"}`}
        aria-hidden="true"
      >
        {selected && (
          <svg className="h-3 w-3 text-ink-900" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {hint && (
          <span className={`mt-0.5 hidden text-xs font-normal sm:block ${selected ? "text-ink-200" : "text-ink-400"}`}>
            {hint}
          </span>
        )}
      </span>
    </button>
  );
}

function ContactStep({
  form,
  set,
  errors,
  markStarted,
}: {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: Record<string, string>;
  markStarted: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="field-label">First name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            required
            className="field-input"
            value={form.firstName}
            onFocus={markStarted}
            onChange={(e) => set("firstName", e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "firstName-error" : undefined}
          />
          {errors.firstName && <p id="firstName-error" className="field-error">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="field-label">Last name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            required
            className="field-input"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "lastName-error" : undefined}
          />
          {errors.lastName && <p id="lastName-error" className="field-error">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input
          id="email"
          name="email"
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
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="mobile" className="field-label">Mobile</label>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required
          className="field-input"
          placeholder="04XX XXX XXX"
          value={form.mobile}
          onChange={(e) => set("mobile", e.target.value)}
          aria-invalid={Boolean(errors.mobile)}
          aria-describedby={errors.mobile ? "mobile-error" : undefined}
        />
        {errors.mobile && <p id="mobile-error" className="field-error">{errors.mobile}</p>}
      </div>

      <fieldset>
        <legend className="field-label">Preferred contact method</legend>
        <div className="grid grid-cols-3 gap-2">
          {CONTACT_METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set("contactMethod", option.value)}
              aria-pressed={form.contactMethod === option.value}
              className={`btn min-h-[3rem] w-full border text-sm ${
                form.contactMethod === option.value
                  ? "border-ink-900 bg-ink-900 text-canvas"
                  : "border-ink-200 bg-canvas-raised text-ink-700 hover:border-ink-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className="field-label">
          Anything else we should know? <span className="font-normal text-ink-400">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="field-input resize-y"
          placeholder="Anything about your objectives, existing portfolio or constraints."
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-100 bg-canvas-sunken p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-300 text-ink-900 focus:ring-brass-200"
          checked={form.consentMarketing}
          onChange={(e) => set("consentMarketing", e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-ink-600">
          Yes, I&rsquo;d also like to receive general commercial property investment information by
          email. You can unsubscribe at any time.
        </span>
      </label>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
        />
      </div>
    </div>
  );
}

/**
 * Where the form should open. A campaign that prefills property type and
 * budget drops the visitor straight onto question three.
 */
function firstUnansweredStep(prefill?: InvestorFormPrefill): number {
  if (!prefill) return 0;
  if (!prefill.propertyType) return 0;
  if (!prefill.budget) return 1;
  if (!prefill.locationScope) return 2;
  return 3;
}

/** Maps a server-side field error back to the step that owns it. */
function stepForField(field: string): number | null {
  const map: Record<string, number> = {
    propertyType: 0,
    budget: 1,
    locationScope: 2,
    locationFree: 2,
    priorities: 3,
    financeStatus: 4,
    timeframe: 5,
    firstName: 6,
    lastName: 6,
    email: 6,
    mobile: 6,
    contactMethod: 6,
    message: 6,
  };
  return map[field] ?? null;
}
