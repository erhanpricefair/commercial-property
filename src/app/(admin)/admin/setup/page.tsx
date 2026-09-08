import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SetupForm from "@/components/admin/SetupForm";
import { needsSetup, setupTokenRequired } from "@/lib/setup";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Set up",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

/**
 * First-run setup. Reachable only while the platform has no admin account.
 */
export default async function SetupPage() {
  if (!needsSetup()) redirect("/admin/login");
  const tokenRequired = setupTokenRequired();

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-sunken px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ink-900" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M10 21V11l7 4v6" stroke="#9C7A46" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M2 21h20" stroke="#FBFAF8" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="mt-5 font-display text-display-sm text-ink-900">Set up {SITE.name}</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Create the administrator account. This page only works once.
          </p>
        </div>

        <div className="card">
          <SetupForm tokenRequired={tokenRequired} />
        </div>

        {!tokenRequired && (
          <p className="mt-6 rounded-xl border border-brass-200 bg-brass-100/50 px-4 py-3 text-xs leading-relaxed text-brass-600">
            <strong className="font-semibold">Do this now.</strong> Until an account exists, anyone
            who found this address could create one. It closes permanently the moment you submit.
            To remove the window entirely, set <code>ADMIN_SETUP_TOKEN</code> in your hosting
            settings and reload — this page will then ask for it.
          </p>
        )}
      </div>
    </div>
  );
}
