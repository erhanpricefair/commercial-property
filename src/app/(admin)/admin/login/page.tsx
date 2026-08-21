import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import { getCurrentAdmin } from "@/lib/auth";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-sunken px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ink-900" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 21V9l7-4.5V21" stroke="#FBFAF8" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M10 21V11l7 4v6" stroke="#9C7A46" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M2 21h20" stroke="#FBFAF8" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
          <h1 className="mt-5 font-display text-display-sm text-ink-900">{SITE.name}</h1>
          <p className="mt-1.5 text-sm text-ink-500">Private administration</p>
        </div>

        <div className="card">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-400">
          Authorised access only. All activity is logged.
        </p>
      </div>
    </div>
  );
}
