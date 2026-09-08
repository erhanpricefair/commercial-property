"use client";

import { useActionState } from "react";
import { completeSetupAction, type SetupState } from "@/app/(admin)/admin/setup/actions";

export default function SetupForm({ tokenRequired }: { tokenRequired: boolean }) {
  const [state, formAction, pending] = useActionState<SetupState, FormData>(
    completeSetupAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="field-label">Your name</label>
        <input id="name" name="name" type="text" required autoComplete="name" className="field-input" />
      </div>

      <div>
        <label htmlFor="email" className="field-label">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="off"
          spellCheck={false}
          className="field-input"
        />
        <p className="mt-1.5 text-xs text-ink-400">You&rsquo;ll use this to sign in.</p>
      </div>

      <div>
        <label htmlFor="password" className="field-label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="field-input"
        />
        <p className="mt-1.5 text-xs text-ink-400">
          At least 12 characters. Use a password manager if you have one.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          className="field-input"
        />
      </div>

      {tokenRequired && (
        <div>
          <label htmlFor="token" className="field-label">Setup key</label>
          <input id="token" name="token" type="text" required className="field-input" />
          <p className="mt-1.5 text-xs text-ink-400">
            The value you set as <code>ADMIN_SETUP_TOKEN</code> in your hosting settings.
          </p>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl border border-signal-hot/30 bg-signal-hot/5 px-4 py-3 text-sm text-signal-hot">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Creating your account…" : "Create my account"}
      </button>
    </form>
  );
}
