"use client";

import { useState } from "react";

/**
 * One button. The token arrives in the URL from the email; nothing about the
 * person is shown here, so a forwarded link reveals nothing.
 */
export default function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="rounded-xl border border-ink-100 bg-canvas-sunken px-5 py-4 text-[0.9375rem] text-ink-700">
        You&rsquo;ve been unsubscribed from our marketing emails. If you registered criteria with us, we
        may still contact you directly about that registration unless you ask us not to.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button type="submit" disabled={state === "sending"} className="btn-primary w-full sm:w-auto">
        {state === "sending" ? "Unsubscribing…" : "Unsubscribe me"}
      </button>
      {state === "error" && (
        <p role="alert" className="text-sm text-signal-hot">
          That didn&rsquo;t go through. Please try again, or reply to any of our emails asking to be
          removed.
        </p>
      )}
    </form>
  );
}
