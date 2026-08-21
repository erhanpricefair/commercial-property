"use client";

import { useState } from "react";

/**
 * Enquiry from a private presentation. The token identifies which opportunity
 * and investor the enquiry relates to — the client never needs to send, or
 * know, the opportunity's internal ID.
 */
export default function PresentationEnquiry({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError(null);

    try {
      const response = await fetch("/api/presentation-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "We couldn't send that. Please try again.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="rounded-xl border border-ink-600 bg-ink-800 px-5 py-4 text-sm text-ink-100">
        Thanks — we&rsquo;ve received your enquiry and will be in touch shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="presentation-message" className="sr-only">
        Your message
      </label>
      <textarea
        id="presentation-message"
        rows={3}
        className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-[0.9375rem] text-canvas placeholder:text-ink-400 focus:border-brass-400 focus:outline-none focus:ring-2 focus:ring-brass-400/30"
        placeholder="Anything you'd like to ask, or a time that suits for a call."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      {error && (
        <p role="alert" className="text-sm text-brass-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "sending"} className="btn-brass w-full sm:w-auto">
        {state === "sending" ? "Sending…" : "Register my interest"}
      </button>
    </form>
  );
}
