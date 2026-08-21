"use client";

import { useState } from "react";

/** Copies a tokenised presentation URL without ever rendering it in full. */
export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; fall back to showing the URL so the
      // admin can select it manually.
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-300 hover:bg-canvas-sunken"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
