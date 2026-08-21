"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        setError(data.error ?? "Sign in failed.");
        setSubmitting(false);
        return;
      }

      // Only accept a same-origin relative path, so a crafted ?next= can't
      // bounce an admin off to another host after authenticating.
      const next = searchParams.get("next");
      const target = next && /^\/admin(\/|$)/.test(next) ? next : "/admin";
      router.push(target);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="admin-email" className="field-label">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="admin-password" className="field-label">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-signal-hot/30 bg-signal-hot/5 px-4 py-3 text-sm text-signal-hot">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
